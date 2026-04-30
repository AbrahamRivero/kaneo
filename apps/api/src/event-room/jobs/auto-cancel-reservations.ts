import { and, eq, sql } from "drizzle-orm";
import db from "../../database/index.js";
import { eventRoomTable, reservationTable } from "../../database/schema.js";
import getActiveWorkspaceUsers from "../../workspace-user/controllers/get-active-workspace-users.js";
import createNotification from "../../notification/controllers/create-notification.js";


interface ReservationToCancel {
  id: string;
  title: string | null;
  clientName: string;
  companyName: string | null;
  dateRange: string;
  workspaceId: string;
  eventRoomId: string;
  createdAt: Date;
}

async function getPendingReservationsOlderThan72Hours(): Promise<
  ReservationToCancel[]
> {
  console.log(
    "[AUTO-CANCEL] Searching for pending reservations with reserved date within 72 hours...",
  );

  const reservations = await db
    .select({
      id: reservationTable.id,
      title: reservationTable.title,
      clientName: reservationTable.clientName,
      companyName: reservationTable.companyName,
      dateRange: reservationTable.dateRange,
      workspaceId: reservationTable.workspaceId,
      eventRoomId: reservationTable.eventRoomId,
      createdAt: reservationTable.createdAt,
    })
    .from(reservationTable)
    .innerJoin(
      eventRoomTable,
      eq(reservationTable.eventRoomId, eventRoomTable.id),
    )
    .where(
      and(
        eq(reservationTable.status, "pending"),
        eq(reservationTable.paymentConfirmed, false),
        eq(eventRoomTable.allowsMultipleReservations, true),
        sql`NOW() >= ((${reservationTable.dateRange}::jsonb->>'from')::timestamp) - interval '72 hours'`,
      ),
    );

  console.log(
    `[AUTO-CANCEL] Found ${reservations.length} pending reservations with reserved date within 72 hours`,
  );

  return reservations;
}

async function cancelReservation(
  reservation: ReservationToCancel,
): Promise<void> {
  const cancellationReason =
    "Auto-cancelled: Reserved date within 72 hours without payment received";

  const [updated] = await db
    .update(reservationTable)
    .set({
      status: "cancelled",
      cancellationReason,
      updatedAt: new Date(),
    })
    .where(eq(reservationTable.id, reservation.id))
    .returning();

  if (updated) {
    console.log(`[AUTO-CANCEL] Cancelled reservation ${reservation.id}`);

    const workspaceUsers = await getActiveWorkspaceUsers(
      reservation.workspaceId,
    );

    const dateRange = JSON.parse(reservation.dateRange);
    const dateFormatted =
      dateRange.from === dateRange.to
        ? dateRange.from
        : `${dateRange.from} - ${dateRange.to}`;

    const titlePrefix = reservation.title
      ? reservation.title + " - "
      : "";
    const companyPart = reservation.companyName
      ? ` (${reservation.companyName})`
      : "";

    const notificationTitle =
      `Reservation cancelled: ${titlePrefix}Payment not received`;
    const notificationContent =
      `Client: ${reservation.clientName}${companyPart}\n` +
      `Date: ${dateFormatted}\n` +
      "Reason: Reserved date within 72 hours without payment received";

    const notificationPromises = workspaceUsers.map(
      (user: { userId: string; userName: string | null; role: string; status: string }) =>
        createNotification({
          userId: user.userId,
          title: notificationTitle,
          content: notificationContent,
          type: "reservation_cancelled",
          resourceId: reservation.id,
          resourceType: "reservation",
        }),
    );

    await Promise.all(notificationPromises);

    console.log(
      `[AUTO-CANCEL] Notified ${workspaceUsers.length} users about cancellation of reservation ${reservation.id}`,
    );
  }
}

async function autoCancelPendingReservations(): Promise<{
  processed: number;
  cancelled: number;
  errors: number;
}> {
  console.log("[AUTO-CANCEL] Starting auto-cancel job...");

  const reservations = await getPendingReservationsOlderThan72Hours();
  const results = {
    processed: reservations.length,
    cancelled: 0,
    errors: 0,
  };

  for (const reservation of reservations) {
    try {
      await cancelReservation(reservation);
      results.cancelled++;
    } catch (error) {
      console.error(
        `[AUTO-CANCEL] Error cancelling reservation ${reservation.id}:`,
        error,
      );
      results.errors++;
    }
  }

  console.log(
    `[AUTO-CANCEL] Job completed. Processed: ${results.processed}, Cancelled: ${results.cancelled}, Errors: ${results.errors}`,
  );

  return results;
}

export { autoCancelPendingReservations };