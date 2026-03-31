import { type SQL, and, eq, ne, or, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database";
import {
  eventRoomTable,
  reservationDayTariffTable,
  reservationServiceTable,
  reservationTable,
  roomTariffTable,
  serviceTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema";
import { publishEvent } from "../../events";

export type DateRange = { from: string; to?: string };

export type ReservationServicePayload = {
  serviceId: string;
  pax: number;
  unitPrice: number;
  totalPrice: number;
};

export type DayTariffPayload = {
  date: string;
  roomTariffId?: string;
  price: number;
};

export type CreateReservationPayload = {
  workspaceId: string;
  eventRoomId: string;
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  dateRange: DateRange;
  notes?: string;
  roomTariffId?: string;
  totalRoomPrice?: number;
  totalServicePrice?: number;
  serviceChargeAmount?: number;
  grandTotal?: number;
  expectedPax?: number;
  services?: ReservationServicePayload[];
  dayTariffs?: DayTariffPayload[];
};

export type UpdateReservationPayload = {
  eventRoomId?: string;
  title?: string;
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  dateRange?: DateRange;
  notes?: string;
  paymentConfirmed?: boolean;
  roomTariffId?: string;
  totalRoomPrice?: number;
  totalServicePrice?: number;
  serviceChargeAmount?: number;
  grandTotal?: number;
  expectedPax?: number;
  status?: "all" | "pending" | "confirmed" | "completed";
  services?: ReservationServicePayload[];
  dayTariffs?: DayTariffPayload[];
};

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
    };

async function checkReservationConflict(
  eventRoomId: string,
  dateRange: DateRange,
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

  if (!eventRoom.allowsMultipleReservations) {
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

  const conflict = await checkReservationConflict(
    payload.eventRoomId,
    payload.dateRange,
  );

  if (conflict.hasConflict) {
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
      notes: payload.notes,
      roomTariffId: payload.roomTariffId,
      totalRoomPrice: payload.totalRoomPrice,
      totalServicePrice: payload.totalServicePrice,
      serviceChargeAmount: payload.serviceChargeAmount,
      grandTotal: payload.grandTotal,
      expectedPax: payload.expectedPax,
    })
    .returning();

  if (!reservation) {
    throw new Error("Failed to create reservation");
  }

  const resDateRange = dateRangeFromString(reservation.dateRange);

  if (payload.services && payload.services.length > 0) {
    await db.insert(reservationServiceTable).values(
      payload.services.map((service) => ({
        reservationId: reservation.id,
        serviceId: service.serviceId,
        pax: service.pax,
        unitPrice: service.unitPrice,
        totalPrice: service.totalPrice,
      })),
    );
  }

  if (payload.dayTariffs && payload.dayTariffs.length > 0) {
    await db.insert(reservationDayTariffTable).values(
      payload.dayTariffs.map((dt) => ({
        reservationId: reservation.id,
        date: dt.date,
        roomTariffId: dt.roomTariffId,
        price: dt.price,
      })),
    );
  }

  const services = await db
    .select({
      id: reservationServiceTable.id,
      reservationId: reservationServiceTable.reservationId,
      serviceId: reservationServiceTable.serviceId,
      pax: reservationServiceTable.pax,
      unitPrice: reservationServiceTable.unitPrice,
      totalPrice: reservationServiceTable.totalPrice,
      createdAt: reservationServiceTable.createdAt,
      name: serviceTable.name,
      description: serviceTable.description,
      pricePerPax: serviceTable.pricePerPax,
    })
    .from(reservationServiceTable)
    .innerJoin(
      serviceTable,
      eq(reservationServiceTable.serviceId, serviceTable.id),
    )
    .where(eq(reservationServiceTable.reservationId, reservation.id));

  const totalPax = services.reduce((sum, s) => sum + s.pax, 0);

  await publishEvent("reservation.created", {
    reservationId: reservation.id,
    workspaceId: payload.workspaceId,
    clientName: payload.clientName,
    title: payload.title,
    dateRange: resDateRange,
    totalPax,
    roomName: room.name,
    userId,
  });

  return {
    ...reservation,
    services: services.map((s) => ({
      id: s.id,
      reservationId: s.reservationId,
      serviceId: s.serviceId,
      pax: s.pax,
      unitPrice: s.unitPrice,
      totalPrice: s.totalPrice,
      createdAt: s.createdAt,
      service: {
        id: s.serviceId,
        name: s.name,
        description: s.description,
        pricePerPax: s.pricePerPax,
      },
    })),
  };
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
        sql`(${reservationTable.dateRange}::jsonb->>'from') <= ${endDate}`,
        sql`(COALESCE((${reservationTable.dateRange}::jsonb->>'to'), ${reservationTable.dateRange}::jsonb->>'from')) >= ${startDate}`,
      ),
    ) as SQL<unknown>;
  } else if (startDate) {
    conditions = and(
      conditions,
      sql`(${reservationTable.dateRange}::jsonb->>'from') = ${startDate}`,
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
      notes: reservationTable.notes,
      paymentConfirmed: reservationTable.paymentConfirmed,
      roomTariffId: reservationTable.roomTariffId,
      totalRoomPrice: reservationTable.totalRoomPrice,
      totalServicePrice: reservationTable.totalServicePrice,
      serviceChargeAmount: reservationTable.serviceChargeAmount,
      grandTotal: reservationTable.grandTotal,
      expectedPax: reservationTable.expectedPax,
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

  if (reservations.length === 0) return reservations;

  const reservationIds = reservations.map((r) => r.id);

  const services = await db
    .select({
      id: reservationServiceTable.id,
      reservationId: reservationServiceTable.reservationId,
      serviceId: reservationServiceTable.serviceId,
      pax: reservationServiceTable.pax,
      unitPrice: reservationServiceTable.unitPrice,
      totalPrice: reservationServiceTable.totalPrice,
      createdAt: reservationServiceTable.createdAt,
      name: serviceTable.name,
      description: serviceTable.description,
      pricePerPax: serviceTable.pricePerPax,
    })
    .from(reservationServiceTable)
    .innerJoin(
      serviceTable,
      eq(reservationServiceTable.serviceId, serviceTable.id),
    )
    .where(
      or(
        ...reservationIds.map((id) =>
          eq(reservationServiceTable.reservationId, id),
        ),
      ) as SQL<unknown>,
    );

  const dayTariffs = await db
    .select({
      id: reservationDayTariffTable.id,
      reservationId: reservationDayTariffTable.reservationId,
      date: reservationDayTariffTable.date,
      roomTariffId: reservationDayTariffTable.roomTariffId,
      price: reservationDayTariffTable.price,
      createdAt: reservationDayTariffTable.createdAt,
      sessionType: roomTariffTable.sessionType,
    })
    .from(reservationDayTariffTable)
    .leftJoin(
      roomTariffTable,
      eq(reservationDayTariffTable.roomTariffId, roomTariffTable.id),
    )
    .where(
      or(
        ...reservationIds.map((id) =>
          eq(reservationDayTariffTable.reservationId, id),
        ),
      ) as SQL<unknown>,
    );

  const servicesByReservation: Record<
    string,
    Array<{
      id: string;
      reservationId: string;
      serviceId: string;
      pax: number;
      unitPrice: number;
      totalPrice: number;
      createdAt: Date;
      service: {
        id: string;
        name: string;
        description: string | null;
        pricePerPax: number | null;
      };
    }>
  > = {};

  const dayTariffsByReservation: Record<
    string,
    Array<{
      id: string;
      reservationId: string;
      date: string;
      roomTariffId: string | null;
      price: number;
      createdAt: Date;
      sessionType: string | null;
    }>
  > = {};

  for (const service of services) {
    const resId = service.reservationId;
    let arr = servicesByReservation[resId];
    if (!arr) {
      arr = [];
      servicesByReservation[resId] = arr;
    }
    arr.push({
      id: service.id,
      reservationId: service.reservationId,
      serviceId: service.serviceId,
      pax: service.pax,
      unitPrice: service.unitPrice,
      totalPrice: service.totalPrice,
      createdAt: service.createdAt,
      service: {
        id: service.serviceId,
        name: service.name,
        description: service.description,
        pricePerPax: service.pricePerPax,
      },
    });
  }

  for (const dt of dayTariffs) {
    const resId = dt.reservationId;
    let arr = dayTariffsByReservation[resId];
    if (!arr) {
      arr = [];
      dayTariffsByReservation[resId] = arr;
    }
    arr.push({
      id: dt.id,
      reservationId: dt.reservationId,
      date: dt.date,
      roomTariffId: dt.roomTariffId,
      price: dt.price,
      createdAt: dt.createdAt,
      sessionType: dt.sessionType,
    });
  }

  return reservations.map((reservation) => ({
    ...reservation,
    services: servicesByReservation[reservation.id] || [],
    dayTariffs: dayTariffsByReservation[reservation.id] || [],
  }));
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
      notes: reservationTable.notes,
      paymentConfirmed: reservationTable.paymentConfirmed,
      roomTariffId: reservationTable.roomTariffId,
      totalRoomPrice: reservationTable.totalRoomPrice,
      totalServicePrice: reservationTable.totalServicePrice,
      serviceChargeAmount: reservationTable.serviceChargeAmount,
      grandTotal: reservationTable.grandTotal,
      expectedPax: reservationTable.expectedPax,
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

  const services = await db
    .select({
      id: reservationServiceTable.id,
      reservationId: reservationServiceTable.reservationId,
      serviceId: reservationServiceTable.serviceId,
      pax: reservationServiceTable.pax,
      unitPrice: reservationServiceTable.unitPrice,
      totalPrice: reservationServiceTable.totalPrice,
      createdAt: reservationServiceTable.createdAt,
      name: serviceTable.name,
      description: serviceTable.description,
      pricePerPax: serviceTable.pricePerPax,
    })
    .from(reservationServiceTable)
    .innerJoin(
      serviceTable,
      eq(reservationServiceTable.serviceId, serviceTable.id),
    )
    .where(eq(reservationServiceTable.reservationId, reservationId));

  const dayTariffs = await db
    .select({
      id: reservationDayTariffTable.id,
      reservationId: reservationDayTariffTable.reservationId,
      date: reservationDayTariffTable.date,
      roomTariffId: reservationDayTariffTable.roomTariffId,
      price: reservationDayTariffTable.price,
      createdAt: reservationDayTariffTable.createdAt,
      sessionType: roomTariffTable.sessionType,
    })
    .from(reservationDayTariffTable)
    .leftJoin(
      roomTariffTable,
      eq(reservationDayTariffTable.roomTariffId, roomTariffTable.id),
    )
    .where(eq(reservationDayTariffTable.reservationId, reservationId));

  return {
    ...reservation,
    services: services.map((s) => ({
      id: s.id,
      reservationId: s.reservationId,
      serviceId: s.serviceId,
      pax: s.pax,
      unitPrice: s.unitPrice,
      totalPrice: s.totalPrice,
      createdAt: s.createdAt,
      service: {
        id: s.serviceId,
        name: s.name,
        description: s.description,
        pricePerPax: s.pricePerPax,
      },
    })),
    dayTariffs: dayTariffs.map((dt) => ({
      id: dt.id,
      reservationId: dt.reservationId,
      date: dt.date,
      roomTariffId: dt.roomTariffId,
      price: dt.price,
      createdAt: dt.createdAt,
      sessionType: dt.sessionType,
    })),
  };
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
  }

  const eventRoomId = payload.eventRoomId ?? reservation.eventRoomId;
  const dateRange = payload.dateRange
    ? payload.dateRange
    : dateRangeFromString(reservation.dateRange);

  const conflict = await checkReservationConflict(
    eventRoomId,
    dateRange,
    reservationId,
  );

  if (conflict.hasConflict) {
    if (conflict.type === "date_overlap") {
      const { title, dateRange: cDateRange } = conflict.conflictingReservation;
      throw new HTTPException(400, {
        message: `Date range conflict: The room is already reserved for "${title}" from ${cDateRange.from} to ${cDateRange.to}.`,
      });
    }
  }

  const { status: _, ...restPayload } = payload;
  const { dateRange: payloadDateRange, ...restWithoutDateRange } = restPayload;

  const [updated] = await db
    .update(reservationTable)
    .set({
      ...restWithoutDateRange,
      ...(payloadDateRange
        ? { dateRange: dateRangeToString(payloadDateRange) }
        : {}),
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

  if (payload.services !== undefined) {
    await db
      .delete(reservationServiceTable)
      .where(eq(reservationServiceTable.reservationId, reservationId));

    if (payload.services.length > 0) {
      await db.insert(reservationServiceTable).values(
        payload.services.map((service) => ({
          reservationId: reservationId,
          serviceId: service.serviceId,
          pax: service.pax,
          unitPrice: service.unitPrice,
          totalPrice: service.totalPrice,
        })),
      );
    }
  }

  if (payload.dayTariffs !== undefined) {
    await db
      .delete(reservationDayTariffTable)
      .where(eq(reservationDayTariffTable.reservationId, reservationId));

    if (payload.dayTariffs.length > 0) {
      await db.insert(reservationDayTariffTable).values(
        payload.dayTariffs.map((dt) => ({
          reservationId: reservationId,
          date: dt.date,
          roomTariffId: dt.roomTariffId,
          price: dt.price,
        })),
      );
    }
  }

  const services = await db
    .select({
      id: reservationServiceTable.id,
      reservationId: reservationServiceTable.reservationId,
      serviceId: reservationServiceTable.serviceId,
      pax: reservationServiceTable.pax,
      unitPrice: reservationServiceTable.unitPrice,
      totalPrice: reservationServiceTable.totalPrice,
      createdAt: reservationServiceTable.createdAt,
      name: serviceTable.name,
      description: serviceTable.description,
      pricePerPax: serviceTable.pricePerPax,
    })
    .from(reservationServiceTable)
    .innerJoin(
      serviceTable,
      eq(reservationServiceTable.serviceId, serviceTable.id),
    )
    .where(eq(reservationServiceTable.reservationId, reservationId));

  const totalPax = services.reduce((sum, s) => sum + s.pax, 0);

  await publishEvent("reservation.updated", {
    reservationId: updated.id,
    workspaceId: updated.workspaceId,
    clientName: updated.clientName,
    title: updated.title,
    dateRange: updatedDateRange,
    totalPax,
    roomName: room?.name || "Unknown",
    userId,
  });

  const dayTariffs = await db
    .select({
      id: reservationDayTariffTable.id,
      reservationId: reservationDayTariffTable.reservationId,
      date: reservationDayTariffTable.date,
      roomTariffId: reservationDayTariffTable.roomTariffId,
      price: reservationDayTariffTable.price,
      createdAt: reservationDayTariffTable.createdAt,
      sessionType: roomTariffTable.sessionType,
    })
    .from(reservationDayTariffTable)
    .leftJoin(
      roomTariffTable,
      eq(reservationDayTariffTable.roomTariffId, roomTariffTable.id),
    )
    .where(eq(reservationDayTariffTable.reservationId, reservationId));

  return {
    ...updated,
    services: services.map((s) => ({
      id: s.id,
      reservationId: s.reservationId,
      serviceId: s.serviceId,
      pax: s.pax,
      unitPrice: s.unitPrice,
      totalPrice: s.totalPrice,
      createdAt: s.createdAt,
      service: {
        id: s.serviceId,
        name: s.name,
        description: s.description,
        pricePerPax: s.pricePerPax,
      },
    })),
    dayTariffs: dayTariffs.map((dt) => ({
      id: dt.id,
      reservationId: dt.reservationId,
      date: dt.date,
      roomTariffId: dt.roomTariffId,
      price: dt.price,
      createdAt: dt.createdAt,
      sessionType: dt.sessionType,
    })),
  };
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
    totalPax: 0,
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
