import { type SQL, and, eq } from "drizzle-orm";
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
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  date: string;
  startTime: string;
  endTime: string;
  adultPax: number;
  childrenPax: number;
  notes?: string;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
};

type UpdateReservationPayload = {
  eventRoomId?: string;
  title?: string;
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
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

function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA < endB && endA > startB;
}

type ConflictResult =
  | { hasConflict: false }
  | {
      hasConflict: true;
      type: "time_overlap";
      conflictingReservation: {
        id: string;
        title: string;
        startTime: string;
        endTime: string;
      };
    }
  | {
      hasConflict: true;
      type: "capacity_exceeded";
      capacity: number;
      usedCapacity: number;
      requestedPax: number;
    };

async function checkReservationConflict(
  eventRoomId: string,
  date: string,
  startTime: string,
  endTime: string,
  adultPax: number,
  childrenPax: number,
  excludeReservationId?: string,
): Promise<ConflictResult> {
  // Get event room info to check if it allows multiple reservations
  const [eventRoom] = await db
    .select({
      id: eventRoomTable.id,
      capacity: eventRoomTable.capacity,
      allowsMultipleReservations: eventRoomTable.allowsMultipleReservations,
    })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, eventRoomId))
    .limit(1);

  if (!eventRoom) {
    return { hasConflict: false };
  }

  // Get existing reservations that overlap in time
  const existingReservations = await db
    .select({
      id: reservationTable.id,
      title: reservationTable.title,
      startTime: reservationTable.startTime,
      endTime: reservationTable.endTime,
      adultPax: reservationTable.adultPax,
      childrenPax: reservationTable.childrenPax,
    })
    .from(reservationTable)
    .where(
      and(
        eq(reservationTable.eventRoomId, eventRoomId),
        eq(reservationTable.date, date),
        excludeReservationId
          ? eq(reservationTable.id, excludeReservationId)
          : undefined,
      ),
    );

  // If the room allows multiple reservations, check capacity
  if (eventRoom.allowsMultipleReservations) {
    const totalExistingPax = existingReservations.reduce((sum, res) => {
      // Only count reservations that overlap in time
      if (timesOverlap(startTime, endTime, res.startTime, res.endTime)) {
        return sum + res.adultPax + res.childrenPax;
      }
      return sum;
    }, 0);

    const requestedPax = adultPax + childrenPax;
    const availableCapacity = eventRoom.capacity - totalExistingPax;

    if (requestedPax > availableCapacity) {
      return {
        hasConflict: true,
        type: "capacity_exceeded",
        capacity: eventRoom.capacity,
        usedCapacity: totalExistingPax,
        requestedPax,
      };
    }
  } else {
    // If the room does NOT allow multiple reservations, check for time overlap
    for (const res of existingReservations) {
      if (
        res.id !== excludeReservationId &&
        timesOverlap(startTime, endTime, res.startTime, res.endTime)
      ) {
        return {
          hasConflict: true,
          type: "time_overlap",
          conflictingReservation: {
            id: res.id,
            title: res.title || "Untitled",
            startTime: res.startTime,
            endTime: res.endTime,
          },
        };
      }
    }
  }

  return { hasConflict: false };
}

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

  const conflict = await checkReservationConflict(
    payload.eventRoomId,
    payload.date,
    payload.startTime,
    payload.endTime,
    payload.adultPax,
    payload.childrenPax,
  );

  if (conflict.hasConflict) {
    if (conflict.type === "capacity_exceeded") {
      throw new HTTPException(400, {
        message: `Capacity exceeded: The room has a maximum capacity of ${conflict.capacity} people. Currently used: ${conflict.usedCapacity}/${conflict.capacity}. Requested: ${conflict.requestedPax}. Please reduce the number of guests or choose a different time.`,
      });
    }
    if (conflict.type === "time_overlap") {
      const { title, startTime, endTime } = conflict.conflictingReservation;
      throw new HTTPException(400, {
        message: `Time slot conflict: The room is already reserved for "${title}" from ${startTime} to ${endTime} on this date.`,
      });
    }
  }

  const [reservation] = await db
    .insert(reservationTable)
    .values({
      workspaceId: payload.workspaceId,
      eventRoomId: payload.eventRoomId,
      title: payload.title,
      clientName: payload.clientName,
      companyName: payload.companyName,
      phone: payload.phone,
      email: payload.email,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
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
  startDate?: string,
  endDate?: string,
) {
  let conditions: SQL<unknown> = eq(reservationTable.workspaceId, workspaceId);

  if (startDate && endDate) {
    conditions = and(
      conditions,
      eq(reservationTable.date, startDate),
    ) as SQL<unknown>;
  }

  const reservations = await db
    .select({
      id: reservationTable.id,
      workspaceId: reservationTable.workspaceId,
      eventRoomId: reservationTable.eventRoomId,
      title: reservationTable.title,
      clientName: reservationTable.clientName,
      companyName: reservationTable.companyName,
      phone: reservationTable.phone,
      email: reservationTable.email,
      date: reservationTable.date,
      startTime: reservationTable.startTime,
      endTime: reservationTable.endTime,
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

async function getReservation(userId: string, reservationId: string) {
  const [reservation] = await db
    .select({
      id: reservationTable.id,
      workspaceId: reservationTable.workspaceId,
      eventRoomId: reservationTable.eventRoomId,
      title: reservationTable.title,
      clientName: reservationTable.clientName,
      companyName: reservationTable.companyName,
      phone: reservationTable.phone,
      email: reservationTable.email,
      date: reservationTable.date,
      startTime: reservationTable.startTime,
      endTime: reservationTable.endTime,
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
    })
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

  const eventRoomId = payload.eventRoomId ?? reservation.eventRoomId;
  const date = payload.date ?? reservation.date;
  const startTime = payload.startTime ?? reservation.startTime;
  const endTime = payload.endTime ?? reservation.endTime;
  const adultPax = payload.adultPax ?? reservation.adultPax;
  const childrenPax = payload.childrenPax ?? reservation.childrenPax;

  const conflict = await checkReservationConflict(
    eventRoomId,
    date,
    startTime,
    endTime,
    adultPax,
    childrenPax,
    reservationId,
  );

  if (conflict.hasConflict) {
    if (conflict.type === "capacity_exceeded") {
      throw new HTTPException(400, {
        message: `Capacity exceeded: The room has a maximum capacity of ${conflict.capacity} people. Currently used: ${conflict.usedCapacity}/${conflict.capacity}. Requested: ${conflict.requestedPax}. Please reduce the number of guests or choose a different time.`,
      });
    }
    if (conflict.type === "time_overlap") {
      const {
        title,
        startTime: cStart,
        endTime: cEnd,
      } = conflict.conflictingReservation;
      throw new HTTPException(400, {
        message: `Time slot conflict: The room is already reserved for "${title}" from ${cStart} to ${cEnd} on this date.`,
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
};
