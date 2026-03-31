import { and, eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import db from "../../database";
import { eventRoomTable, reservationTable } from "../../database/schema";

interface UnpaidReservation {
  id: string;
  title: string | null;
  clientName: string;
  companyName: string | null;
  dateRange: string;
  grandTotal: number | null;
  workspaceId: string;
  paymentConfirmed: boolean | null;
  status: string | null;
  eventRoomName: string;
}

interface UnpaidReservationWithDays extends UnpaidReservation {
  daysUntilStart: number;
  daysUntilEnd: number;
  totalEventDays: number;
  currentDay: number;
}

function getDateRangeFromString(dateRangeStr: string): {
  from: string;
  to: string;
} {
  const parsed = JSON.parse(dateRangeStr);
  return {
    from: parsed.from,
    to: parsed.to || parsed.from,
  };
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(amount: number | null): string {
  if (amount === null) return "No especificado";
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount / 100);
}

function calculateDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

function getDaysUntil(dateStr: string): number {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = year + "-" + month + "-" + day;

  const target = new Date(dateStr + "T00:00:00");
  const today = new Date(todayStr + "T00:00:00");

  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getUnpaidReservationsUpcoming(): Promise<
  UnpaidReservationWithDays[]
> {
  console.log("[DEBUG] getUnpaidReservationsUpcoming: Starting query...");

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = year + "-" + month + "-" + day;

  console.log("[DEBUG] Today string (local): " + todayStr);

  console.log("[DEBUG] Executing SQL query...");
  const reservations = await db
    .select({
      id: reservationTable.id,
      title: reservationTable.title,
      clientName: reservationTable.clientName,
      companyName: reservationTable.companyName,
      dateRange: reservationTable.dateRange,
      grandTotal: reservationTable.grandTotal,
      workspaceId: reservationTable.workspaceId,
      paymentConfirmed: reservationTable.paymentConfirmed,
      status: reservationTable.status,
      eventRoomName: eventRoomTable.name,
    })
    .from(reservationTable)
    .innerJoin(
      eventRoomTable,
      eq(reservationTable.eventRoomId, eventRoomTable.id),
    )
    .where(
      and(
        eq(reservationTable.paymentConfirmed, false),
        sql`(${reservationTable.dateRange}::jsonb->>'to') >= ${todayStr}`,
      ),
    )
    .limit(100);

  console.log("[DEBUG] Raw reservations found: " + reservations.length);
  if (reservations.length > 0) {
    console.log(
      "[DEBUG] First reservation:",
      JSON.stringify(reservations[0], null, 2),
    );
  }

  const reservationsWithDays: UnpaidReservationWithDays[] = [];

  for (const res of reservations) {
    const dateRange = getDateRangeFromString(res.dateRange);
    const daysUntilStart = getDaysUntil(dateRange.from);
    const daysUntilEnd = getDaysUntil(dateRange.to);
    const totalEventDays = calculateDaysBetween(dateRange.from, dateRange.to);
    const currentDay = totalEventDays - daysUntilEnd;

    console.log(
      "[DEBUG] Reservation " +
        res.id +
        ": from=" +
        dateRange.from +
        ", to=" +
        dateRange.to +
        ", daysUntilStart=" +
        daysUntilStart,
    );

    if (daysUntilStart <= 3) {
      console.log(
        "[DEBUG] Reservation " +
          res.id +
          " qualifies (daysUntilStart=" +
          daysUntilStart +
          " <= 3)",
      );
      reservationsWithDays.push({
        ...res,
        daysUntilStart,
        daysUntilEnd,
        totalEventDays,
        currentDay,
      });
    } else {
      console.log(
        "[DEBUG] Reservation " +
          res.id +
          " does NOT qualify (daysUntilStart=" +
          daysUntilStart +
          " > 3)",
      );
    }
  }

  console.log(
    "[DEBUG] Final reservations to notify: " + reservationsWithDays.length,
  );
  return reservationsWithDays;
}

async function checkAndNotifyUnpaidReservations() {
  console.log("[DEBUG] checkAndNotifyUnpaidReservations: Starting...");
  const result = await getUnpaidReservationsUpcoming();
  console.log(
    "[DEBUG] checkAndNotifyUnpaidReservations: Returning " +
      result.length +
      " reservations",
  );
  return result;
}

export {
  checkAndNotifyUnpaidReservations,
  formatDate,
  formatCurrency,
  getDateRangeFromString,
  getUnpaidReservationsUpcoming,
};

export type { UnpaidReservation, UnpaidReservationWithDays };
