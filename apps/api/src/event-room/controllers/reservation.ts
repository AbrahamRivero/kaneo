import { type SQL, and, eq, ne, or, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import db from "../../database/index.js";
import {
  eventRoomTable,
  reservationAgeGroupTariffTable,
  reservationDayTariffTable,
  reservationServiceTable,
  reservationTable,
  roomTariffTable,
  serviceTable,
  workspaceTable,
  workspaceUserTable,
} from "../../database/schema.js";
import { publishEvent } from "../../events/index.js";
import createNotification from "../../notification/controllers/create-notification.js";
import { hasScheduledPermission } from "../../utils/permissions.js";
import getActiveWorkspaceUsers from "../../workspace-user/controllers/get-active-workspace-users.js";
import { getUserName } from "../utils/get-user-name.js";
import { calculateReservationPricing } from "../utils/pricing.js";

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
  expectedPax?: number;
  ageBreakdown?: {
    adults: number;
    children: number;
    infants: number;
  };
  paymentConfirmed?: boolean;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
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
  expectedPax?: number;
  ageBreakdown?: {
    adults: number;
    children: number;
    infants: number;
  };
  status?: "all" | "pending" | "confirmed" | "completed" | "cancelled";
  cancellationReason?: string;
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

function buildRoomBreakdown(params: {
  ageGroupTariffs?: Array<{
    groupName: string;
    count: number;
    totalPrice: number;
  }>;
  dayTariffs?: Array<{ sessionType: string | null; price: number }>;
  totalRoomPrice: number | null;
  days?: number;
}): Array<{ sessionType: string; days: number; price: number }> {
  const { ageGroupTariffs, dayTariffs, totalRoomPrice, days } = params;

  if (ageGroupTariffs && ageGroupTariffs.length > 0) {
    return ageGroupTariffs.map((agt) => ({
      sessionType: `${agt.groupName} · ${agt.count}`,
      days: days ?? 1,
      price: agt.totalPrice,
    }));
  }

  if (dayTariffs && dayTariffs.length > 0) {
    const grouped = dayTariffs.reduce(
      (acc, dt) => {
        const type = dt.sessionType ?? "unknown";
        if (!acc[type]) {
          acc[type] = { sessionType: type, days: 0, price: 0 };
        }
        acc[type].days += 1;
        acc[type].price += dt.price ?? 0;
        return acc;
      },
      {} as Record<
        string,
        { sessionType: string; days: number; price: number }
      >,
    );
    return Object.values(grouped);
  }

  if (totalRoomPrice) {
    return [
      {
        sessionType: "room",
        days: days ?? 1,
        price: totalRoomPrice,
      },
    ];
  }

  return [];
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

type PaxSource = {
  expectedPax: number | null;
  ageBreakdown: { adults: number; children: number; infants: number } | null;
};

function getTotalPax(reservation: PaxSource): number {
  if (reservation.ageBreakdown) {
    return (
      reservation.ageBreakdown.adults +
      reservation.ageBreakdown.children +
      reservation.ageBreakdown.infants
    );
  }
  return reservation.expectedPax || 0;
}

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
        ne(reservationTable.status, "cancelled"),
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

function daysInRange(dateRange: DateRange): number {
  const from = new Date(dateRange.from);
  const to = dateRange.to ? new Date(dateRange.to) : from;
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
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
    const hasPermission = await hasScheduledPermission(
      userId,
      payload.workspaceId,
      "create_reservations",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot create reservations",
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

  if (
    room.allowsMultipleReservations &&
    !room.hasAgeBasedPricing &&
    (payload.expectedPax === undefined ||
      payload.expectedPax === null ||
      payload.expectedPax === 0)
  ) {
    throw new HTTPException(400, {
      message:
        "Expected Pax is required for rooms that allow multiple reservations",
    });
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

  if (room.allowsMultipleReservations) {
    const normalizedDateRange = normalizeDateRange(payload.dateRange);
    const fromDate = new Date(normalizedDateRange.from);
    const toDate = new Date(normalizedDateRange.to);
    const dates: string[] = [];
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      dates.push(currentDate.toISOString().split("T")[0] || "");
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const newPax = payload.ageBreakdown
      ? payload.ageBreakdown.adults +
        payload.ageBreakdown.children +
        payload.ageBreakdown.infants
      : payload.expectedPax || 0;

    const existingReservationsForRoom = await db
      .select({
        id: reservationTable.id,
        dateRange: reservationTable.dateRange,
        expectedPax: reservationTable.expectedPax,
        ageBreakdown: reservationTable.ageBreakdown,
      })
      .from(reservationTable)
      .where(
        and(
          eq(reservationTable.eventRoomId, payload.eventRoomId),
          ne(reservationTable.status, "cancelled"),
        ),
      );

    const paxByDate: Record<string, number> = {};
    for (const date of dates) {
      paxByDate[date] = 0;
    }

    for (const res of existingReservationsForRoom) {
      const resDateRange = normalizeDateRange(
        dateRangeFromString(res.dateRange),
      );
      const resFrom = new Date(resDateRange.from);
      const resTo = new Date(resDateRange.to);
      const resStart = new Date(resFrom);
      while (resStart <= resTo) {
        const dateStr = resStart.toISOString().split("T")[0] || "";
        if (Object.hasOwn(paxByDate, dateStr)) {
          paxByDate[dateStr] = (paxByDate[dateStr] || 0) + getTotalPax(res);
        }
        resStart.setDate(resStart.getDate() + 1);
      }
    }

    for (const date of dates) {
      const totalPax = (paxByDate[date] ?? 0) + newPax;
      if (totalPax > room.capacity) {
        throw new HTTPException(400, {
          message: `Cannot create reservation: Total pax (${totalPax}) would exceed room capacity of ${room.capacity} for date ${date}`,
        });
      }
    }
  }

  console.log("[DEBUG] Payload roomTariffId:", payload.roomTariffId);
  console.log("[DEBUG] Payload dayTariffs:", payload.dayTariffs);
  console.log("[DEBUG] Payload ageBreakdown:", payload.ageBreakdown);
  console.log("[DEBUG] Payload dateRange:", payload.dateRange);

  const pricing = await calculateReservationPricing(
    {
      roomTariffId: payload.roomTariffId,
      eventRoomId: payload.eventRoomId,
      ageBreakdown: payload.ageBreakdown,
      dateRange: payload.dateRange,
      services: payload.services || [],
      dayTariffs: payload.dayTariffs,
    },
    db,
  );

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
      totalRoomPrice: pricing.totalRoomPrice,
      totalServicePrice: pricing.totalServicePrice,
      roomChargeAmount: pricing.roomChargeAmount,
      serviceChargeAmount: pricing.serviceChargeAmount,
      grandTotal: pricing.grandTotal,
      expectedPax: payload.expectedPax,
      ageBreakdown: payload.ageBreakdown ?? null,
      paymentConfirmed: payload.paymentConfirmed,
      status: payload.status,
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

  if (
    pricing.ageGroupPricingLineItems &&
    pricing.ageGroupPricingLineItems.length > 0
  ) {
    await db.insert(reservationAgeGroupTariffTable).values(
      pricing.ageGroupPricingLineItems.map((item) => ({
        reservationId: reservation.id,
        ageGroupTariffId: item.ageGroupTariffId,
        groupName: item.groupName,
        minAge: item.minAge,
        maxAge: item.maxAge,
        count: item.count,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
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

  await publishEvent("reservation.created", {
    reservationId: reservation.id,
    workspaceId: payload.workspaceId,
    clientName: payload.clientName,
    title: payload.title,
    dateRange: resDateRange,
    expectedPax: payload.expectedPax,
    ageBreakdown: payload.ageBreakdown,
    roomName: room.name,
    userId,
  });

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(payload.workspaceId);
  const dateStr =
    resDateRange.from === resDateRange.to
      ? resDateRange.from
      : `${resDateRange.from} to ${resDateRange.to}`;
  const totalFormatted = pricing.grandTotal
    ? `€${(pricing.grandTotal / 100).toFixed(2)}`
    : "N/A";
  const statusStr = payload.status || "pending";
  const paxStr = payload.expectedPax ? `${payload.expectedPax} pax` : "N/A";

  const notificationTitle = `${payload.title ? `Reservation Created: ${payload.title}` : "Reservation Created"}`;
  const notificationContent =
    `User "${userName}" created a reservation\n` +
    `- Client: ${payload.clientName}${payload.companyName ? ` (${payload.companyName})` : ""}\n` +
    `- Room: ${room.name}\n` +
    `- Date: ${dateStr}\n` +
    `- Status: ${statusStr}\n` +
    `- Expected Pax: ${paxStr}\n` +
    `- Total: ${totalFormatted}`;

  await Promise.all(
    workspaceUsers.map((wu: { userId: string }) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "reservation_created",
        resourceId: reservation.id,
        resourceType: "reservation",
      }),
    ),
  );

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
    totalRoomPrice: pricing.totalRoomPrice,
    totalServicePrice: pricing.totalServicePrice,
    roomChargeAmount: pricing.roomChargeAmount,
    serviceChargeAmount: pricing.serviceChargeAmount,
    grandTotal: pricing.grandTotal,
    roomBreakdown: pricing.ageGroupPricingLineItems
      ? pricing.ageGroupPricingLineItems.map((item) => ({
          sessionType: `${item.groupName} · ${item.count}`,
          days: daysInRange(payload.dateRange),
          price: item.totalPrice,
        }))
      : payload.dayTariffs && payload.dayTariffs.length > 0
        ? buildRoomBreakdown({
            dayTariffs: payload.dayTariffs.map((dt) => ({
              sessionType: null,
              price: dt.price,
            })),
            totalRoomPrice: pricing.totalRoomPrice,
          })
        : [
            {
              sessionType: "room",
              days: daysInRange(payload.dateRange),
              price: pricing.totalRoomPrice,
            },
          ],
  };
}

async function getReservations(
  workspaceId: string,
  startDate?: string,
  endDate?: string,
  eventRoomId?: string,
  status?: "pending" | "confirmed" | "completed" | "cancelled",
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

  if (status) {
    conditions = and(
      conditions,
      eq(reservationTable.status, status),
    ) as SQL<unknown>;
  }

  const reservations = await db
    .select({
      id: reservationTable.id,
      workspaceId: reservationTable.workspaceId,
      eventRoomId: reservationTable.eventRoomId,
      userId: reservationTable.userId,
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
      roomChargeAmount: reservationTable.roomChargeAmount,
      serviceChargeAmount: reservationTable.serviceChargeAmount,
      grandTotal: reservationTable.grandTotal,
      expectedPax: reservationTable.expectedPax,
      ageBreakdown: reservationTable.ageBreakdown,
      status: reservationTable.status,
      cancellationReason: reservationTable.cancellationReason,
      cancelledBy: reservationTable.cancelledBy,
      createdAt: reservationTable.createdAt,
      updatedAt: reservationTable.updatedAt,
      roomName: eventRoomTable.name,
      roomCapacity: eventRoomTable.capacity,
      allowsMultipleReservations: eventRoomTable.allowsMultipleReservations,
      hasAgeBasedPricing: eventRoomTable.hasAgeBasedPricing,
    })
    .from(reservationTable)
    .innerJoin(
      eventRoomTable,
      eq(reservationTable.eventRoomId, eventRoomTable.id),
    )
    .where(conditions);

  if (reservations.length === 0) return reservations;

  const reservationIds = reservations.map((r) => r.id);

  const reservationServiceRows = await db
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

  const reservationDayTariffs = await db
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

  for (const service of reservationServiceRows) {
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

  for (const dt of reservationDayTariffs) {
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

  const reservationAgeGroupTariffs = await db
    .select({
      id: reservationAgeGroupTariffTable.id,
      reservationId: reservationAgeGroupTariffTable.reservationId,
      groupName: reservationAgeGroupTariffTable.groupName,
      count: reservationAgeGroupTariffTable.count,
      unitPrice: reservationAgeGroupTariffTable.unitPrice,
      totalPrice: reservationAgeGroupTariffTable.totalPrice,
      createdAt: reservationAgeGroupTariffTable.createdAt,
    })
    .from(reservationAgeGroupTariffTable)
    .where(
      or(
        ...reservationIds.map((id) =>
          eq(reservationAgeGroupTariffTable.reservationId, id),
        ),
      ) as SQL<unknown>,
    );

  const ageGroupTariffsByReservation: Record<
    string,
    Array<{
      id: string;
      reservationId: string;
      groupName: string;
      count: number;
      unitPrice: number;
      totalPrice: number;
      createdAt: Date;
    }>
  > = {};

  for (const agt of reservationAgeGroupTariffs) {
    const resId = agt.reservationId;
    let arr = ageGroupTariffsByReservation[resId];
    if (!arr) {
      arr = [];
      ageGroupTariffsByReservation[resId] = arr;
    }
    arr.push({
      id: agt.id,
      reservationId: agt.reservationId,
      groupName: agt.groupName,
      count: agt.count,
      unitPrice: agt.unitPrice,
      totalPrice: agt.totalPrice,
      createdAt: agt.createdAt,
    });
  }

  return reservations.map((reservation) => {
    const parsedDateRange = dateRangeFromString(reservation.dateRange);
    const days = daysInRange(parsedDateRange);
    return {
      ...reservation,
      services: servicesByReservation[reservation.id] || [],
      dayTariffs: dayTariffsByReservation[reservation.id] || [],
      ageGroupTariffs: ageGroupTariffsByReservation[reservation.id] || [],
      totalRoomPrice: reservation.totalRoomPrice ?? 0,
      totalServicePrice: reservation.totalServicePrice ?? 0,
      roomChargeAmount: reservation.roomChargeAmount ?? 0,
      serviceChargeAmount: reservation.serviceChargeAmount ?? 0,
      grandTotal: reservation.grandTotal ?? 0,
      roomBreakdown: buildRoomBreakdown({
        ageGroupTariffs: ageGroupTariffsByReservation[reservation.id] || [],
        dayTariffs: dayTariffsByReservation[reservation.id] || [],
        totalRoomPrice: reservation.totalRoomPrice ?? null,
        days,
      }),
    };
  });
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
      roomChargeAmount: reservationTable.roomChargeAmount,
      serviceChargeAmount: reservationTable.serviceChargeAmount,
      grandTotal: reservationTable.grandTotal,
      expectedPax: reservationTable.expectedPax,
      ageBreakdown: reservationTable.ageBreakdown,
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

  const ageGroupTariffs = await db
    .select({
      id: reservationAgeGroupTariffTable.id,
      reservationId: reservationAgeGroupTariffTable.reservationId,
      ageGroupTariffId: reservationAgeGroupTariffTable.ageGroupTariffId,
      groupName: reservationAgeGroupTariffTable.groupName,
      minAge: reservationAgeGroupTariffTable.minAge,
      maxAge: reservationAgeGroupTariffTable.maxAge,
      count: reservationAgeGroupTariffTable.count,
      unitPrice: reservationAgeGroupTariffTable.unitPrice,
      totalPrice: reservationAgeGroupTariffTable.totalPrice,
      createdAt: reservationAgeGroupTariffTable.createdAt,
    })
    .from(reservationAgeGroupTariffTable)
    .where(eq(reservationAgeGroupTariffTable.reservationId, reservationId));

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
    ageGroupTariffs: ageGroupTariffs.map((item) => ({
      id: item.id,
      reservationId: item.reservationId,
      ageGroupTariffId: item.ageGroupTariffId,
      groupName: item.groupName,
      minAge: item.minAge,
      maxAge: item.maxAge,
      count: item.count,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      createdAt: item.createdAt,
    })),
    totalRoomPrice: reservation.totalRoomPrice ?? 0,
    totalServicePrice: reservation.totalServicePrice ?? 0,
    roomChargeAmount: reservation.roomChargeAmount ?? 0,
    serviceChargeAmount: reservation.serviceChargeAmount ?? 0,
    grandTotal: reservation.grandTotal ?? 0,
    roomBreakdown: buildRoomBreakdown({
      ageGroupTariffs: ageGroupTariffs.map((agt) => ({
        groupName: agt.groupName,
        count: agt.count,
        totalPrice: agt.totalPrice,
      })),
      dayTariffs: dayTariffs.map((dt) => ({
        sessionType: dt.sessionType,
        price: dt.price,
      })),
      totalRoomPrice: reservation.totalRoomPrice ?? null,
      days: daysInRange(dateRangeFromString(reservation.dateRange)),
    }),
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
    const hasPermission = await hasScheduledPermission(
      userId,
      reservation.workspaceId,
      "edit_reservations",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot update reservations",
      });
    }
  }

  const eventRoomId = payload.eventRoomId ?? reservation.eventRoomId;

  const [room] = await db
    .select()
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, eventRoomId))
    .limit(1);

  if (!room) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  if (room.workspaceId !== reservation.workspaceId) {
    throw new HTTPException(404, { message: "Event room not found" });
  }

  if (
    "expectedPax" in payload &&
    room.allowsMultipleReservations &&
    !room.hasAgeBasedPricing &&
    (payload.expectedPax === undefined ||
      payload.expectedPax === null ||
      payload.expectedPax === 0)
  ) {
    throw new HTTPException(400, {
      message:
        "Expected Pax is required for rooms that allow multiple reservations",
    });
  }

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

  console.log("[DEBUG] Payload roomTariffId:", payload.roomTariffId);
  console.log("[DEBUG] Payload dayTariffs:", payload.dayTariffs);
  console.log("[DEBUG] Payload ageBreakdown:", payload.ageBreakdown);
  console.log("[DEBUG] Payload dateRange:", payload.dateRange);

  const pricing = await calculateReservationPricing(
    {
      roomTariffId: payload.roomTariffId ?? reservation.roomTariffId,
      eventRoomId,
      ageBreakdown:
        payload.ageBreakdown !== undefined
          ? payload.ageBreakdown
          : reservation.ageBreakdown || undefined,
      dateRange,
      services: payload.services || [],
      dayTariffs: payload.dayTariffs,
    },
    db,
  );

  const { status: _, ...restPayload } = payload;
  const {
    dateRange: payloadDateRange,
    ageBreakdown: payloadAgeBreakdown,
    ...restWithoutDateRange
  } = restPayload;

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
      ...(payload.status === "cancelled"
        ? {
            cancellationReason: payload.cancellationReason || null,
            cancelledBy: userId,
          }
        : {}),
      ...(payload.status &&
      payload.status !== "cancelled" &&
      reservation.status === "cancelled"
        ? {
            cancellationReason: null,
            cancelledBy: null,
          }
        : {}),
      ...(payloadAgeBreakdown !== undefined
        ? { ageBreakdown: payloadAgeBreakdown }
        : {}),
      totalRoomPrice: pricing.totalRoomPrice,
      totalServicePrice: pricing.totalServicePrice,
      roomChargeAmount: pricing.roomChargeAmount,
      serviceChargeAmount: pricing.serviceChargeAmount,
      grandTotal: pricing.grandTotal,
      updatedAt: new Date(),
    })
    .where(eq(reservationTable.id, reservationId))
    .returning();

  if (!updated) {
    throw new Error("Failed to update reservation");
  }

  const [roomForName] = await db
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
  } else if (payload.roomTariffId && !payload.dayTariffs) {
    await db
      .delete(reservationDayTariffTable)
      .where(eq(reservationDayTariffTable.reservationId, reservationId));
  }

  if (payload.ageBreakdown !== undefined) {
    await db
      .delete(reservationAgeGroupTariffTable)
      .where(eq(reservationAgeGroupTariffTable.reservationId, reservationId));

    if (
      pricing.ageGroupPricingLineItems &&
      pricing.ageGroupPricingLineItems.length > 0
    ) {
      await db.insert(reservationAgeGroupTariffTable).values(
        pricing.ageGroupPricingLineItems.map((item) => ({
          reservationId: reservationId,
          ageGroupTariffId: item.ageGroupTariffId,
          groupName: item.groupName,
          minAge: item.minAge,
          maxAge: item.maxAge,
          count: item.count,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
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

  await publishEvent("reservation.updated", {
    reservationId: updated.id,
    workspaceId: updated.workspaceId,
    clientName: updated.clientName,
    title: updated.title,
    dateRange: updatedDateRange,
    expectedPax: updated.expectedPax ?? undefined,
    ageBreakdown: updated.ageBreakdown ?? undefined,
    roomName: roomForName?.name || "Unknown",
    userId,
  });

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(updated.workspaceId);
  const dateStr =
    updatedDateRange.from === updatedDateRange.to
      ? updatedDateRange.from
      : `${updatedDateRange.from} to ${updatedDateRange.to}`;
  const totalFormatted = updated.grandTotal
    ? `€${(updated.grandTotal / 100).toFixed(2)}`
    : "N/A";
  const statusStr = updated.status || "pending";
  const paxStr = updated.expectedPax ? `${updated.expectedPax} pax` : "N/A";

  let notificationTitle: string;
  let notificationType: string;
  let notificationContent: string;

  const clientInfo = `${updated.clientName}${updated.companyName ? ` (${updated.companyName})` : ""}`;
  const reservationInfo = `- Client: ${clientInfo}\n- Room: ${roomForName?.name || "Unknown"}\n- Date: ${dateStr}`;

  if (payload.status === "cancelled") {
    const titlePrefix = updated.title ? `${updated.title} - ` : "";
    notificationTitle = `Reservation Cancelled: ${titlePrefix}${updated.clientName}`;
    notificationType = "reservation_cancelled";
    notificationContent =
      `User "${userName}" cancelled a reservation\n` +
      `${reservationInfo}\n` +
      "- Status: Cancelled\n" +
      `- Reason: ${updated.cancellationReason || "Not specified"}`;
  } else if (
    payload.status === "pending" &&
    reservation.status === "cancelled"
  ) {
    notificationTitle = `Reservation Reactivated: ${updated.title || updated.clientName}`;
    notificationType = "reservation_reactivated";
    notificationContent =
      `User "${userName}" reactivated a cancelled reservation\n` +
      `${reservationInfo}\n` +
      "- Status: Pending (reactivated from cancelled)";
  } else {
    const changedFields = payload
      ? Object.keys(payload)
          .filter((k) => k !== "services" && k !== "dayTariffs")
          .join(", ")
      : "N/A";
    notificationTitle = `Reservation Updated: ${updated.title || updated.clientName}`;
    notificationType = "reservation_updated";
    notificationContent =
      `User "${userName}" updated a reservation\n` +
      `${reservationInfo}\n` +
      `- Status: ${statusStr}\n` +
      `- Expected Pax: ${paxStr}\n` +
      `- Total: ${totalFormatted}\n` +
      `- Changed fields: ${changedFields}`;
  }

  await Promise.all(
    workspaceUsers.map((wu: { userId: string }) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: notificationType,
        resourceId: updated.id,
        resourceType: "reservation",
      }),
    ),
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
    .where(eq(reservationDayTariffTable.reservationId, reservationId));

  const ageGroupTariffs = await db
    .select({
      id: reservationAgeGroupTariffTable.id,
      reservationId: reservationAgeGroupTariffTable.reservationId,
      ageGroupTariffId: reservationAgeGroupTariffTable.ageGroupTariffId,
      groupName: reservationAgeGroupTariffTable.groupName,
      minAge: reservationAgeGroupTariffTable.minAge,
      maxAge: reservationAgeGroupTariffTable.maxAge,
      count: reservationAgeGroupTariffTable.count,
      unitPrice: reservationAgeGroupTariffTable.unitPrice,
      totalPrice: reservationAgeGroupTariffTable.totalPrice,
      createdAt: reservationAgeGroupTariffTable.createdAt,
    })
    .from(reservationAgeGroupTariffTable)
    .where(eq(reservationAgeGroupTariffTable.reservationId, reservationId));

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
    ageGroupTariffs: ageGroupTariffs.map((item) => ({
      id: item.id,
      reservationId: item.reservationId,
      ageGroupTariffId: item.ageGroupTariffId,
      groupName: item.groupName,
      minAge: item.minAge,
      maxAge: item.maxAge,
      count: item.count,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
      createdAt: item.createdAt,
    })),
    totalRoomPrice: updated.totalRoomPrice ?? 0,
    totalServicePrice: updated.totalServicePrice ?? 0,
    roomChargeAmount: updated.roomChargeAmount ?? 0,
    serviceChargeAmount: updated.serviceChargeAmount ?? 0,
    grandTotal: updated.grandTotal ?? 0,
    roomBreakdown: buildRoomBreakdown({
      ageGroupTariffs: ageGroupTariffs.map((agt) => ({
        groupName: agt.groupName,
        count: agt.count,
        totalPrice: agt.totalPrice,
      })),
      dayTariffs: dayTariffs.map((dt) => ({
        sessionType: dt.sessionType,
        price: dt.price,
      })),
      totalRoomPrice: updated.totalRoomPrice ?? null,
    }),
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
    const hasPermission = await hasScheduledPermission(
      userId,
      reservation.workspaceId,
      "delete_reservations",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot delete reservations",
      });
    }
  }

  if (!isOwner && !workspaceUser) {
    throw new HTTPException(403, {
      message: "You must be a workspace member to delete reservations",
    });
  }

  const resDateRange = dateRangeFromString(reservation.dateRange);

  await publishEvent("reservation.deleted", {
    reservationId: reservation.id,
    workspaceId: reservation.workspaceId,
    clientName: reservation.clientName,
    title: reservation.title,
    dateRange: resDateRange,
    expectedPax: reservation.expectedPax ?? undefined,
    userId,
  });

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(reservation.workspaceId);
  const dateStr =
    resDateRange.from === resDateRange.to
      ? resDateRange.from
      : `${resDateRange.from} to ${resDateRange.to}`;
  const totalFormatted = reservation.grandTotal
    ? `€${(reservation.grandTotal / 100).toFixed(2)}`
    : "N/A";
  const statusStr = reservation.status || "unknown";
  const paxStr = reservation.expectedPax
    ? `${reservation.expectedPax} pax`
    : "N/A";

  const notificationTitle = `${reservation.title ? `Reservation Deleted: ${reservation.title}` : "Reservation Deleted"}`;
  const notificationContent =
    `User "${userName}" deleted a reservation\n` +
    `- Client: ${reservation.clientName}${reservation.companyName ? ` (${reservation.companyName})` : ""}\n` +
    `- Date: ${dateStr}\n` +
    `- Status: ${statusStr}\n` +
    `- Expected Pax: ${paxStr}\n` +
    `- Total: ${totalFormatted}`;

  await Promise.all(
    workspaceUsers.map((wu: { userId: string }) =>
      createNotification({
        userId: wu.userId,
        title: notificationTitle,
        content: notificationContent,
        type: "reservation_deleted",
        resourceId: reservation.id,
        resourceType: "reservation",
      }),
    ),
  );

  await db
    .delete(reservationTable)
    .where(eq(reservationTable.id, reservationId));

  return { success: true };
}

async function updatePaymentStatus(
  userId: string,
  reservationId: string,
  paymentConfirmed: boolean,
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

  const isViewer = member?.role === "viewer";

  if (!isOwner && isViewer) {
    const hasPermission = await hasScheduledPermission(
      userId,
      reservation.workspaceId,
      "mark_reservation_paid",
    );
    if (!hasPermission) {
      throw new HTTPException(403, {
        message: "Viewers cannot update payment status without permission",
      });
    }
  }

  const [updated] = await db
    .update(reservationTable)
    .set({
      paymentConfirmed,
      status: paymentConfirmed ? "confirmed" : "pending",
    })
    .where(eq(reservationTable.id, reservationId))
    .returning();

  const [eventRoom] = await db
    .select({ name: eventRoomTable.name })
    .from(eventRoomTable)
    .where(eq(eventRoomTable.id, reservation.eventRoomId))
    .limit(1);

  const userName = await getUserName(userId);
  const workspaceUsers = await getActiveWorkspaceUsers(reservation.workspaceId);

  const clientName = reservation.title || reservation.clientName || "Unknown";
  const roomName = eventRoom?.name || "Event Room";
  const dateRange = dateRangeFromString(reservation.dateRange);
  const dateStr =
    dateRange.from === dateRange.to
      ? dateRange.from
      : `${dateRange.from} to ${dateRange.to}`;
  const statusText = paymentConfirmed ? "marked as paid" : "marked as pending";

  await Promise.all(
    workspaceUsers
      .filter((wu: { userId: string }) => wu.userId !== userId)
      .map((wu: { userId: string }) =>
        createNotification({
          userId: wu.userId,
          title: "Payment Status Updated",
          content: `User "${userName}" has ${statusText} the payment for "${clientName}" at "${roomName}" on ${dateStr}`,
          type: "reservation_payment",
          resourceId: reservation.id,
          resourceType: "reservation",
        }),
      ),
  );

  await publishEvent("reservation.payment_updated", {
    reservationId: reservation.id,
    workspaceId: reservation.workspaceId,
    clientName,
    paymentConfirmed,
    roomName,
    dateRange,
    userId,
  });

  return updated;
}

export default {
  createReservation,
  getReservations,
  getReservation,
  updateReservation,
  deleteReservation,
  updatePaymentStatus,
};
