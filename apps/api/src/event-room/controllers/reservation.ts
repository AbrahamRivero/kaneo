import { type SQL, and, eq, gte, lte, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  reservationTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";
import { publishEvent } from "../../events";

export type DateRange = { from: string; to?: string };

export type CreateReservationPayload = {
  workspaceId: string;
  eventRoomId: string;
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  dateRange: DateRange;
  adultPax: number;
  childrenPax: number;
  notes?: string;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
};

export type UpdateReservationPayload = {
  eventRoomId?: string;
  title?: string;
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  dateRange?: DateRange;
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

function parseDateRange(dateRange: string | DateRange): DateRange {
  if (typeof dateRange === "string") {
    const parsed = JSON.parse(dateRange) as DateRange;
    return parsed;
  }
  return dateRange;
}

type NormalizedDateRange = { from: string; to: string };

function normalizeDateRange(dateRange: DateRange): NormalizedDateRange {
  return {
    from: dateRange.from,
    to: dateRange.to || dateRange.from,
  };
}

function dateRangeToString(dateRange: DateRange): string {
  return JSON.stringify(normalizeDateRange(dateRange));
}

function dateRangeFromString(dateRangeStr: string): DateRange {
  return JSON.parse(dateRangeStr) as DateRange;
}

function datesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  return startA <= endB && endA >= startB;
}

type ConflictResult =
  | { hasConflict: false }
  | {
      hasConflict: true;
      type: "date_overlap";
      conflictingReservation: {
        id: string;
        title: string;
        dateRange: DateRange;
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
  dateRange: DateRange,
  adultPax: number,
  childrenPax: number,
  excludeReservationId?: string,
): Promise<ConflictResult> {
  const normalizedDateRange = normalizeDateRange(dateRange);

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

  const existingReservations = await db
    .select({
      id: reservationTable.id,
      title: reservationTable.title,
      dateRange: reservationTable.dateRange,
      adultPax: reservationTable.adultPax,
      childrenPax: reservationTable.childrenPax,
    })
    .from(reservationTable)
    .where(
      and(
        eq(reservationTable.eventRoomId, eventRoomId),
        excludeReservationId
          ? ne(reservationTable.id, excludeReservationId)
          : undefined,
      ),
    );

  if (eventRoom.allowsMultipleReservations) {
    const overlappingReservations = existingReservations.filter((res) => {
      const resDateRange = normalizeDateRange(
        dateRangeFromString(res.dateRange),
      );
      return datesOverlap(
        normalizedDateRange.from,
        normalizedDateRange.to,
        resDateRange.from,
        resDateRange.to,
      );
    });

    const totalExistingPax = overlappingReservations.reduce((sum, res) => {
      return sum + res.adultPax + res.childrenPax;
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
    for (const res of existingReservations) {
      const resDateRange = normalizeDateRange(
        dateRangeFromString(res.dateRange),
      );
      if (
        datesOverlap(
          normalizedDateRange.from,
          normalizedDateRange.to,
          resDateRange.from,
          resDateRange.to,
        )
      ) {
        return {
          hasConflict: true,
          type: "date_overlap",
          conflictingReservation: {
            id: res.id,
            title: res.title || "Untitled",
            dateRange: resDateRange,
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
      message: "Viewers cannot create reservations",
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

  const totalPax = payload.adultPax + payload.childrenPax;
  if (totalPax > room.capacity) {
    throw new HTTPException(400, {
      message: `Room capacity exceeded. Maximum capacity is ${room.capacity}`,
    });
  }

  const conflict = await checkReservationConflict(
    payload.eventRoomId,
    payload.dateRange,
    payload.adultPax,
    payload.childrenPax,
  );

  if (conflict.hasConflict) {
    if (conflict.type === "capacity_exceeded") {
      throw new HTTPException(400, {
        message: `Capacity exceeded: The room has a maximum capacity of ${conflict.capacity} people. Currently used: ${conflict.usedCapacity}/${conflict.capacity}. Requested: ${conflict.requestedPax}. Please reduce the number of guests or choose a different date range.`,
      });
    }
    if (conflict.type === "date_overlap") {
      const { title, dateRange } = conflict.conflictingReservation;
      throw new HTTPException(400, {
        message: `Date range conflict: The room is already reserved for "${title}" from ${dateRange.from} to ${dateRange.to}.`,
      });
    }
  }

  const [reservation] = await db
    .insert(reservationTable)
    .values({
      workspaceId: payload.workspaceId,
      eventRoomId: payload.eventRoomId,
      userId,
      title: payload.title,
      clientName: payload.clientName,
      companyName: payload.companyName,
      phone: payload.phone,
      email: payload.email,
      dateRange: dateRangeToString(payload.dateRange),
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

  if (!reservation) {
    throw new Error("Failed to create reservation");
  }

  const resDateRange = dateRangeFromString(reservation.dateRange);

  await publishEvent("reservation.created", {
    reservationId: reservation.id,
    workspaceId: payload.workspaceId,
    clientName: payload.clientName,
    title: payload.title,
    dateRange: resDateRange,
    totalPax: payload.adultPax + payload.childrenPax,
    roomName: room.name,
    userId,
  });

  return reservation;
}

async function getReservations(
  workspaceId: string,
  startDate?: string,
  endDate?: string,
  eventRoomId?: string,
) {
  let conditions: SQL<unknown> = eq(reservationTable.workspaceId, workspaceId);

  if (startDate && endDate) {
    conditions = and(
      conditions,
      and(
        gte(reservationTable.dateRange, startDate),
        lte(reservationTable.dateRange, endDate),
      ),
    ) as SQL<unknown>;
  } else if (startDate) {
    conditions = and(
      conditions,
      and(
        gte(reservationTable.dateRange, startDate),
        lte(reservationTable.dateRange, startDate),
      ),
    ) as SQL<unknown>;
  }

  if (eventRoomId) {
    conditions = and(
      conditions,
      eq(reservationTable.eventRoomId, eventRoomId),
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
      dateRange: reservationTable.dateRange,
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
      dateRange: reservationTable.dateRange,
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

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [member] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, reservation.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  if (!isOwner && (!member || member.role === "viewer")) {
    throw new HTTPException(403, {
      message: "Viewers cannot update reservations",
    });
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
  const dateRange = payload.dateRange
    ? payload.dateRange
    : dateRangeFromString(reservation.dateRange);
  const adultPax = payload.adultPax ?? reservation.adultPax;
  const childrenPax = payload.childrenPax ?? reservation.childrenPax;

  const conflict = await checkReservationConflict(
    eventRoomId,
    dateRange,
    adultPax,
    childrenPax,
    reservationId,
  );

  if (conflict.hasConflict) {
    if (conflict.type === "capacity_exceeded") {
      throw new HTTPException(400, {
        message: `Capacity exceeded: The room has a maximum capacity of ${conflict.capacity} people. Currently used: ${conflict.usedCapacity}/${conflict.capacity}. Requested: ${conflict.requestedPax}. Please reduce the number of guests or choose a different date range.`,
      });
    }
    if (conflict.type === "date_overlap") {
      const { title, dateRange: cDateRange } = conflict.conflictingReservation;
      throw new HTTPException(400, {
        message: `Date range conflict: The room is already reserved for "${title}" from ${cDateRange.from} to ${cDateRange.to}.`,
      });
    }
  }

  const updateValues: Record<string, unknown> = { ...payload };
  if (payload.dateRange) {
    updateValues.dateRange = dateRangeToString(payload.dateRange);
  }
  delete updateValues.status;

  const [updated] = await db
    .update(reservationTable)
    .set({
      ...updateValues,
      ...(payload.status && payload.status !== "all"
        ? { status: payload.status }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(reservationTable.id, reservationId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update reservation");
  }

  const [room] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, updated.eventRoomId))
    .limit(1);

  const updatedDateRange = dateRangeFromString(updated.dateRange);

  await publishEvent("reservation.updated", {
    reservationId: updated.id,
    workspaceId: updated.workspaceId,
    clientName: updated.clientName,
    title: updated.title,
    dateRange: updatedDateRange,
    totalPax: updated.adultPax + updated.childrenPax,
    roomName: room?.name || "Unknown",
    userId,
  });

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

  if (!workspace) {
    throw new HTTPException(404, { message: "Workspace not found" });
  }

  const isOwner = workspace.ownerId === userId;

  const [workspaceUser] = await db
    .select({ role: workspaceUserTable.role })
    .from(workspaceUserTable)
    .where(
      and(
        eq(workspaceUserTable.workspaceId, reservation.workspaceId),
        eq(workspaceUserTable.userId, userId),
        eq(workspaceUserTable.status, "active"),
      ),
    )
    .limit(1);

  const isViewer = workspaceUser?.role === "viewer";

  if (isViewer) {
    throw new HTTPException(403, {
      message: "Viewers cannot delete reservations",
    });
  }

  if (!isOwner && reservation.userId !== userId) {
    throw new HTTPException(403, {
      message: "You can only delete your own reservations",
    });
  }

  const resDateRange = dateRangeFromString(reservation.dateRange);

  await publishEvent("reservation.deleted", {
    reservationId: reservation.id,
    workspaceId: reservation.workspaceId,
    clientName: reservation.clientName,
    title: reservation.title,
    dateRange: resDateRange,
    totalPax: reservation.adultPax + reservation.childrenPax,
    userId,
  });

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
