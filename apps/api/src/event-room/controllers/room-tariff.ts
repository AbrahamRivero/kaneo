import { and, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  roomTariffTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";

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

function maskPrice(
  tariff: typeof roomTariffTable.$inferSelect,
  isViewer: boolean,
): RoomTariffWithMaskedPrice {
  if (isViewer) {
    return {
      ...tariff,
      price: null,
      serviceChargePercent: tariff.serviceChargePercent,
      modificationCharge: tariff.modificationCharge,
    };
  }
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

      const masked = maskPrice(tariff, isViewer);
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

  const masked = maskPrice(tariff, isViewer);
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
    throw new HTTPException(403, {
      message: "Viewers cannot create room tariffs",
    });
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
    throw new HTTPException(403, {
      message: "Viewers cannot update room tariffs",
    });
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

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, updated.eventRoomId))
    .limit(1);

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
    throw new HTTPException(403, {
      message: "Viewers cannot delete room tariffs",
    });
  }

  await db.delete(roomTariffTable).where(eq(roomTariffTable.id, tariffId));

  return { success: true };
}
