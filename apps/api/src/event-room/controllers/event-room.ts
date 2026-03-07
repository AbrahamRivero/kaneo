import { and, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import { eventRoomTable, workspaceTable } from "../../database/schema";

type CreateEventRoomPayload = {
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string;
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

  if (!workspace || workspace.ownerId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const [eventRoom] = await db
    .insert(eventRoomTable)
    .values({
      workspaceId: payload.workspaceId,
      name: payload.name,
      capacity: payload.capacity,
      description: payload.description,
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

  if (!workspace || workspace.ownerId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  return eventRoom;
}

type UpdateEventRoomPayload = {
  name?: string;
  capacity?: number;
  description?: string;
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

  if (!workspace || workspace.ownerId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
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

  if (!workspace || workspace.ownerId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
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
