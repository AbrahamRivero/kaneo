import { type SQL, and, eq, gte, lte, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  reservationTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";

type CreateReservationPayload = {
  workspaceId: string;
  eventRoomId: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  startDate: Date;
  endDate: Date;
  adultPax: number;
  childrenPax: number;
  notes?: string;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
};

async function createReservation(
  userId: string,
  payload: CreateReservationPayload,
) {
  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, payload.workspaceId))
    .limit(1);

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isMember = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, payload.workspaceId),
        eq(workspaceUserTable.userId, userId),
      ),
    )
    .limit(1);

  if (workspace.ownerId !== userId && isMember.length === 0) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  const [room] = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, payload.eventRoomId))
    .limit(1);

  if (!room || room.workspaceId !== payload.workspaceId) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  const totalPax = payload.adultPax + payload.childrenPax;
  if (totalPax > room.capacity) {
    throw new HTTPException(400, {
      message: `Room capacity exceeded. Maximum capacity is ${room.capacity}`,
    });
  }

  const [reservation] = await db
    .insert(reservationTable)
    .values({
      workspaceId: payload.workspaceId,
      eventRoomId: payload.eventRoomId,
      clientName: payload.clientName,
      companyName: payload.companyName,
      phone: payload.phone,
      email: payload.email,
      startDate: payload.startDate,
      endDate: payload.endDate,
      adultPax: payload.adultPax,
      childrenPax: payload.childrenPax,
      notes: payload.notes,
      coffeeBreak: payload.coffeeBreak ?? false,
      lunch: payload.lunch ?? false,
      cocktail: payload.cocktail ?? false,
      canapes: payload.canapes ?? false,
      openBar: payload.openBar ?? false,
    })
    .returning();

  return reservation;
}

async function getReservations(
  workspaceId: string,
  startDate?: Date,
  endDate?: Date,
) {
  const baseCondition = eq(reservationTable.workspaceId, workspaceId);

  // biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
  let reservations;

  if (startDate && endDate) {
    const dateOverlap = or(
      and(
        gte(reservationTable.startDate, startDate),
        lte(reservationTable.startDate, endDate),
      ),
      and(
        gte(reservationTable.endDate, startDate),
        lte(reservationTable.endDate, endDate),
      ),
      and(
        lte(reservationTable.startDate, startDate),
        gte(reservationTable.endDate, endDate),
      ),
    );
    const conditions = and(baseCondition, dateOverlap);

    reservations = await db
      .select({
        id: reservationTable.id,
        workspaceId: reservationTable.workspaceId,
        eventRoomId: reservationTable.eventRoomId,
        clientName: reservationTable.clientName,
        companyName: reservationTable.companyName,
        phone: reservationTable.phone,
        email: reservationTable.email,
        startDate: reservationTable.startDate,
        endDate: reservationTable.endDate,
        adultPax: reservationTable.adultPax,
        childrenPax: reservationTable.childrenPax,
        notes: reservationTable.notes,
        paymentConfirmed: reservationTable.paymentConfirmed,
        coffeeBreak: reservationTable.coffeeBreak,
        lunch: reservationTable.lunch,
        cocktail: reservationTable.cocktail,
        canapes: reservationTable.canapes,
        openBar: reservationTable.openBar,
        status: reservationTable.status,
        createdAt: reservationTable.createdAt,
        updatedAt: reservationTable.updatedAt,
        roomName: eventRoomTable.name,
        roomCapacity: eventRoomTable.capacity,
      })
      .from(reservationTable)
      .innerJoin(
        eventRoomTable,
        eq(reservationTable.eventRoomId, eventRoomTable.id),
      )
      .where(conditions);

    return reservations;
  }
}

async function getReservation(userId: string, reservationId: string) {
  const [reservation] = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, reservationId))
    .limit(1);

  if (!reservation) {
    throw new HTTPException(404, { message: "Reservation not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, reservation.workspaceId))
    .limit(1);

  const isMember = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, reservation.workspaceId),
        eq(workspaceUserTable.userId, userId),
      ),
    )
    .limit(1);

  if (!workspace || (workspace.ownerId !== userId && isMember.length === 0)) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  return reservation;
}

type UpdateReservationPayload = {
  eventRoomId?: string;
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  startDate?: Date;
  endDate?: Date;
  adultPax?: number;
  childrenPax?: number;
  notes?: string;
  paymentConfirmed?: boolean;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
  status?: "all" | "pending" | "confirmed" | "cancelled" | "completed";
};

async function updateReservation(
  userId: string,
  reservationId: string,
  payload: UpdateReservationPayload,
) {
  const [reservation] = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, reservationId))
    .limit(1);

  if (!reservation) {
    throw new HTTPException(404, { message: "Reservation not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, reservation.workspaceId))
    .limit(1);

  const isMember = await db
    .select()
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, reservation.workspaceId),
        eq(workspaceUserTable.userId, userId),
      ),
    )
    .limit(1);

  if (!workspace || (workspace.ownerId !== userId && isMember.length === 0)) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  if (payload.eventRoomId) {
    const [room] = await db
      .select()
      .from(eventRoomTable)
      .where(eq(eventRoomTable.id, payload.eventRoomId))
      .limit(1);

    if (!room || room.workspaceId !== reservation.workspaceId) {
      throw new HTTPException(404, { message: "Event room not found" });
    }

    const adultPax = payload.adultPax ?? reservation.adultPax;
    const childrenPax = payload.childrenPax ?? reservation.childrenPax;
    const totalPax = adultPax + childrenPax;

    if (totalPax > room.capacity) {
      throw new HTTPException(400, {
        message: `Room capacity exceeded. Maximum capacity is ${room.capacity}`,
      });
    }
  }

  const [updated] = await db
    .update(reservationTable)
    .set({
      ...payload,
      updatedAt: new Date(),
    })
    .where(eq(reservationTable.id, reservationId))
    .returning();

  return updated;
}

async function deleteReservation(userId: string, reservationId: string) {
  const [reservation] = await db
    .select()
    .from(reservationTable)
    .where(eq(reservationTable.id, reservationId))
    .limit(1);

  if (!reservation) {
    throw new HTTPException(404, { message: "Reservation not found" });
  }

  const [workspace] = await db
    .select({ ownerId: workspaceTable.ownerId })
    .from(workspaceTable)
    .where(eq(workspaceTable.id, reservation.workspaceId))
    .limit(1);

  if (!workspace || workspace.ownerId !== userId) {
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await db
    .delete(reservationTable)
    .where(eq(reservationTable.id, reservationId));

  return { success: true };
}

export default {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  deleteReservation,
}

