import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";
import { hasScheduledPermission } from "../../utils/permissions";

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
