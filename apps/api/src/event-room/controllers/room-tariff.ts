import { and, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  roomTariffTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";
import createNotification from "../../notification/controllers/create-notification";
import { hasScheduledPermission } from "../../utils/permissions";
import getActiveWorkspaceUsers from "../../workspace-user/controllers/get-active-workspace-users";
import { getUserName } from "../utils/get-user-name";

export type SessionType =
  | "half_session"
  | "full_session"
  | "social_event"
  | "flat";

export type CreateRoomTariffPayload = {
  workspaceId: string;
  eventRoomId: string;
  sessionType: SessionType;
  price: number;
  serviceChargePercent?: number;
  modificationCharge?: number;
  isActive?: boolean;
};

export type UpdateRoomTariffPayload = {
  eventRoomId?: string;
  sessionType?: SessionType;
  price?: number;
  serviceChargePercent?: number;
  modificationCharge?: number;
  isActive?: boolean;
};

export type RoomTariffWithMaskedPrice = {
  id: string;
  workspaceId: string;
  eventRoomId: string;
  sessionType: SessionType;
  price: number | null;
  serviceChargePercent: number;
  modificationCharge: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roomName?: string;
};

function maskPrice(tariff: typeof roomTariffTable.$inferSelect): RoomTariffWithMaskedPrice {
  return {
    ...tariff,
    price: tariff.price,
  };
}

export interface PaginatedRoomTariffs {
  data: (ReturnType<typeof maskPrice> & { roomName?: string })[];
  total: number;
  page: number;
  limit: number;
}

export async function getRoomTariffs(
  workspaceId: string,
  userId?: string,
  page = 1,
  limit = 10,
): Promise<PaginatedRoomTariffs> {
  let isViewer = false;

  if (userId) {
    const [workspace] = await db
      .select({ ownerId: workspaceTable.ownerId })
      .from(workspaceTable)
      .where(eq(workspaceTable.id, workspaceId))
      .limit(1);

    if (workspace && workspace.ownerId !== userId) {
      const [member] = await db
        .select({ role: workspaceUserTable.role })
        .from(workspaceUserTable)
        .where(
          and(
            eq(workspaceUserTable.workspaceId, workspaceId),
            eq(workspaceUserTable.userId, userId),
            eq(workspaceUserTable.status, "active"),
          ),
        )
        .limit(1);

      isViewer = member?.role === "viewer";
    }
  }

  const offset = (page - 1) * limit;

  const [tariffs, countResult] = await Promise.all([
    db
      .select()
      .from(roomTariffTable)
      .where(eq(roomTariffTable.workspaceId, workspaceId))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: count() })
      .from(roomTariffTable)
      .where(eq(roomTariffTable.workspaceId, workspaceId)),
  ]);

  const total = countResult[0]?.count ?? 0;

  const tariffsWithRoom = await Promise.all(
    tariffs.map(async (tariff) => {
      const [room] = await db
        .select({ name: eventRoomTable.name })
        .from(eventRoomTable)
        .where(eq(eventRoomTable.id, tariff.eventRoomId))
        .limit(1);

      const masked = maskPrice(tariff);
      return {
        ...masked,
        roomName: room?.name,
      };
    }),
  );

  return {
    data: tariffsWithRoom,
    total,
    page,
    limit,
  };
}

export async function getRoomTariffById(userId: string, tariffId: string) {
  const [tariff] = await db
    .select()
    .from(roomTariffTable)
    .where(eq(roomTariffTable.id, tariffId))
    .limit(1);

  if (!tariff) {
    throw new HTTPException(404, { message: "Tariff not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, tariff.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, tariff.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  const isViewer = !isOwner && member?.role === "viewer";

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, tariff.eventRoomId))
    .limit(1);

  const masked = maskPrice(tariff);
  return {
    ...masked,
    roomName: room?.name,
  };
}

export async function createRoomTariff(
  userId: string,
  payload: CreateRoomTariffPayload,
) {
  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, payload.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, payload.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    const hasPermission = await hasScheduledPermission(
      userId,
      payload.workspaceId,
      "create_tariffs",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot create room tariffs",
      });
    }
  }

  const [room] = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, payload.eventRoomId))
    .limit(1);

  if (!room || room.workspaceId !== payload.workspaceId) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  const [tariff] = await db
    .insert(roomTariffTable)
    .values({
      workspaceId: payload.workspaceId,
      eventRoomId: payload.eventRoomId,
      sessionType: payload.sessionType,
      price: payload.price,
      serviceChargePercent: payload.serviceChargePercent ?? 10,
      modificationCharge: payload.modificationCharge ?? 2000,
      isActive: payload.isActive ?? true,
    })
    .returning();

  if (!tariff) {
    throw new HTTPException(500, { message: "Failed to create room tariff" });
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(payload.workspaceId);
  const sessionTypeLabels: Record<string, string> = {
    half_session: "Half Session",
    full_session: "Full Session",
    social_event: "Social Event",
    flat: "Flat Rate",
  };
  const sessionLabel =
    sessionTypeLabels[tariff.sessionType] || tariff.sessionType;
  const priceFormatted = `€${(tariff.price / 100).toFixed(2)}`;
  const serviceChargeFormatted = `${tariff.serviceChargePercent}%`;
  const modificationFormatted = `€${(tariff.modificationCharge / 100).toFixed(2)}`;

  const notificationTitle = `Room Tariff Created: ${sessionLabel}`;
  const notificationContent =
    `User "${userName}" created a room tariff\n` +
    `- Room: ${room.name}\n` +
    `- Session Type: ${sessionLabel}\n` +
    `- Price: ${priceFormatted}\n` +
    `- Service Charge: ${serviceChargeFormatted}\n` +
    `- Modification Charge: ${modificationFormatted}\n` +
    `- Active: ${tariff.isActive ? "Yes" : "No"}`;

  await Promise.all(
    workspaceUsers.map((wu) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "tariff_created",
        resourceId: tariff.id,
        resourceType: "room_tariff",
      }),
    ),
  );

  return {
    ...tariff,
    roomName: room.name,
  };
}

export async function updateRoomTariff(
  userId: string,
  tariffId: string,
  payload: UpdateRoomTariffPayload,
) {
  const [tariff] = await db
    .select()
    .from(roomTariffTable)
    .where(eq(roomTariffTable.id, tariffId))
    .limit(1);

  if (!tariff) {
    throw new HTTPException(404, { message: "Tariff not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, tariff.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, tariff.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    const hasPermission = await hasScheduledPermission(
      userId,
      tariff.workspaceId,
      "edit_tariffs",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot update room tariffs",
      });
    }
  }

  if (payload.eventRoomId) {
    const [room] = await db
      .select()
      .from(eventRoomTable)
      .where(eq(eventRoomTable.id, payload.eventRoomId))
      .limit(1);

    if (!room || room.workspaceId !== tariff.workspaceId) {
      throw new HTTPException(404, { message: "Event room not found" });
    }
  }

  const [updated] = await db
    .update(roomTariffTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(roomTariffTable.id, tariffId))
    .returning();

  if (!updated) {
    throw new HTTPException(404, { message: "Room tariff not found" });
  }

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, updated.eventRoomId))
    .limit(1);

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(updated.workspaceId);
  const sessionTypeLabels: Record<string, string> = {
    half_session: "Half Session",
    full_session: "Full Session",
    social_event: "Social Event",
    flat: "Flat Rate",
  };
  const sessionLabel =
    sessionTypeLabels[updated.sessionType] || updated.sessionType;
  const priceFormatted = updated.price
    ? `€${(updated.price / 100).toFixed(2)}`
    : "N/A";
  const serviceChargeFormatted = `${updated.serviceChargePercent}%`;
  const modificationFormatted = updated.modificationCharge
    ? `€${(updated.modificationCharge / 100).toFixed(2)}`
    : "N/A";
  const changedFields = Object.keys(payload).join(", ");

  const notificationTitle = `Room Tariff Updated: ${sessionLabel}`;
  const notificationContent =
    `User "${userName}" updated a room tariff\n` +
    `- Room: ${room?.name || "Unknown"}\n` +
    `- Session Type: ${sessionLabel}\n` +
    `- Changed fields: ${changedFields}\n` +
    `- New Price: ${priceFormatted}\n` +
    `- Service Charge: ${serviceChargeFormatted}\n` +
    `- Modification Charge: ${modificationFormatted}\n` +
    `- Active: ${updated.isActive ? "Yes" : "No"}`;

  await Promise.all(
    workspaceUsers.map((wu) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "tariff_updated",
        resourceId: updated.id,
        resourceType: "room_tariff",
      }),
    ),
  );

  return {
    ...updated,
    roomName: room?.name,
  };
}

export async function deleteRoomTariff(userId: string, tariffId: string) {
  const [tariff] = await db
    .select()
    .from(roomTariffTable)
    .where(eq(roomTariffTable.id, tariffId))
    .limit(1);

  if (!tariff) {
    throw new HTTPException(404, { message: "Tariff not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, tariff.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, tariff.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    const hasPermission = await hasScheduledPermission(
      userId,
      tariff.workspaceId,
      "delete_tariffs",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot delete room tariffs",
      });
    }
  }

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, tariff.eventRoomId))
    .limit(1);

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(tariff.workspaceId);
  const sessionTypeLabels: Record<string, string> = {
    half_session: "Half Session",
    full_session: "Full Session",
    social_event: "Social Event",
    flat: "Flat Rate",
  };
  const sessionLabel =
    sessionTypeLabels[tariff.sessionType] || tariff.sessionType;
  const priceFormatted = tariff.price
    ? `€${(tariff.price / 100).toFixed(2)}`
    : "N/A";

  const notificationTitle = `Room Tariff Deleted: ${sessionLabel}`;
  const notificationContent =
    `User "${userName}" deleted a room tariff\n` +
    `- Room: ${room?.name || "Unknown"}\n` +
    `- Session Type: ${sessionLabel}\n` +
    `- Previous Price: ${priceFormatted}\n` +
    `- Service Charge: ${tariff.serviceChargePercent}%\n` +
    `- Modification Charge: €${(tariff.modificationCharge / 100).toFixed(2)}`;

  await Promise.all(
    workspaceUsers.map((wu) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "tariff_deleted",
        resourceId: tariff.id,
        resourceType: "room_tariff",
      }),
    ),
  );

  await db.delete(roomTariffTable).where(eq(roomTariffTable.id, tariffId));

  return { success: true };
}
