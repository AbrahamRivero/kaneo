import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";
import createNotification from "../../notification/controllers/create-notification";
import { hasScheduledPermission } from "../../utils/permissions";
import getActiveWorkspaceUsers from "../../workspace-user/controllers/get-active-workspace-users";
import { getUserName } from "../utils/get-user-name";

type CreateEventRoomPayload = {
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string;
  allowsMultipleReservations?: boolean;
};

async function createEventRoom(
  userId: string,
  payload: CreateEventRoomPayload,
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

  if (!isOwner) {
    const [member] = await db
      .select({ role: workspaceUserTable.role })
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, payload.workspaceId),
          eq(workspaceUserTable.userId, userId),
        ),
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      const hasPermission = await hasScheduledPermission(
        userId,
        payload.workspaceId,
        "create_rooms",
      );
      if (!hasPermission) {
        throw new HTTPException(403, {
          message: "Viewers cannot create event rooms",
        });
      }
    }
  }

  const [eventRoom] = await db
    .insert(eventRoomTable)
    .values({
      workspaceId: payload.workspaceId,
      name: payload.name,
      capacity: payload.capacity,
      description: payload.description,
      allowsMultipleReservations: payload.allowsMultipleReservations ?? false,
    })
    .returning();

  if (!eventRoom) {
    throw new HTTPException(500, { message: "Failed to create event room" });
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(payload.workspaceId);
  const notificationTitle = `Event Room Created: ${eventRoom.name}`;
  const notificationContent =
    `User "${userName}" created event room "${eventRoom.name}"\n` +
    `- Capacity: ${eventRoom.capacity}\n` +
    `- Description: ${eventRoom.description || "N/A"}\n` +
    `- Multiple Reservations: ${eventRoom.allowsMultipleReservations ? "Yes" : "No"}`;

  await Promise.all(
    workspaceUsers.map((wu) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "event_room_created",
        resourceId: eventRoom.id,
        resourceType: "event_room",
      }),
    ),
  );

  return eventRoom;
}

async function getEventRooms(workspaceId: string) {
  const eventRooms = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.workspaceId, workspaceId));

  return eventRooms;
}

async function getEventRoom(userId: string, eventRoomId: string) {
  const [eventRoom] = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, eventRoomId))
    .limit(1);

  if (!eventRoom) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, eventRoom.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  if (!isOwner) {
    const [member] = await db
      .select({ role: workspaceUserTable.role })
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, eventRoom.workspaceId),
          eq(workspaceUserTable.userId, userId),
          eq(workspaceUserTable.status, "active"),
        ),
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      throw new HTTPException(403, {
        message: "Only owners and members can view event rooms",
      });
    }
  }

  return eventRoom;
}

type UpdateEventRoomPayload = {
  name?: string;
  capacity?: number;
  description?: string;
  allowsMultipleReservations?: boolean;
};

async function updateEventRoom(
  userId: string,
  eventRoomId: string,
  payload: UpdateEventRoomPayload,
) {
  const [eventRoom] = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, eventRoomId))
    .limit(1);

  if (!eventRoom) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, eventRoom.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  if (!isOwner) {
    const [member] = await db
      .select({ role: workspaceUserTable.role })
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, eventRoom.workspaceId),
          eq(workspaceUserTable.userId, userId),
          eq(workspaceUserTable.status, "active"),
        ),
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      const hasPermission = await hasScheduledPermission(
        userId,
        eventRoom.workspaceId,
        "edit_rooms",
      );
      if (!hasPermission) {
        throw new HTTPException(403, {
          message: "Only owners and members can update event rooms",
        });
      }
    }
  }

  const [updated] = await db
    .update(eventRoomTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(eventRoomTable.id, eventRoomId))
    .returning();

  if (!updated) {
    throw new HTTPException(500, { message: "Failed to update event room" });
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(eventRoom.workspaceId);
  const notificationTitle = `Event Room Updated: ${updated.name}`;
  const changedFields = Object.keys(payload).join(", ");
  const notificationContent =
    `User "${userName}" updated event room "${updated.name}"\n` +
    `- Changed fields: ${changedFields || "N/A"}\n` +
    `- New capacity: ${updated.capacity}\n` +
    `- Multiple Reservations: ${updated.allowsMultipleReservations ? "Yes" : "No"}`;

  await Promise.all(
    workspaceUsers.map((wu) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "event_room_updated",
        resourceId: updated.id,
        resourceType: "event_room",
      }),
    ),
  );

  return updated;
}

async function deleteEventRoom(userId: string, eventRoomId: string) {
  const [eventRoom] = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, eventRoomId))
    .limit(1);

  if (!eventRoom) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, eventRoom.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  if (!isOwner) {
    const [member] = await db
      .select({ role: workspaceUserTable.role })
      .from(workspaceUserTable)
      .where(
        and(
          eq(workspaceUserTable.workspaceId, eventRoom.workspaceId),
          eq(workspaceUserTable.userId, userId),
          eq(workspaceUserTable.status, "active"),
        ),
      )
      .limit(1);

    if (!member || member.role === "viewer") {
      const hasPermission = await hasScheduledPermission(
        userId,
        eventRoom.workspaceId,
        "delete_rooms",
      );
      if (!hasPermission) {
        throw new HTTPException(403, {
          message: "Viewers cannot delete event rooms",
        });
      }
    }
  }

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(eventRoom.workspaceId);
  const notificationTitle = `Event Room Deleted: ${eventRoom.name}`;
  const notificationContent =
    `User "${userName}" deleted event room "${eventRoom.name}"\n` +
    `- Previous capacity: ${eventRoom.capacity}\n` +
    `- Previous description: ${eventRoom.description || "N/A"}`;

  await Promise.all(
    workspaceUsers.map((wu) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "event_room_deleted",
        resourceId: eventRoom.id,
        resourceType: "event_room",
      }),
    ),
  );

  await db.delete(eventRoomTable).where(eq(eventRoomTable.id, eventRoomId));

  return { success: true };
}

export default {
  createEventRoom,
  getEventRooms,
  getEventRoom,
  updateEventRoom,
  deleteEventRoom,
};
