import { type SQL, and, eq, sql } from "drizzle-orm";
import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import db from "../../database";
import {
  eventRoomTable,
  reservationTable,
} from "../../database/schema";
import { subscribeToEvent } from "../../events";

export type DateRange = { from: string; to?: string };

export type DailyPaxData = {
  date: string;
  roomId: string;
  roomName: string;
  capacity: number;
  totalPax: number;
  availablePax: number;
  occupancyPercent: number;
  reservationCount: number;
};

export type RoomAvailabilityEvent = {
  type: "pax_update";
  workspaceId: string;
  data: DailyPaxData[];
};

function normalizeDateRange(dateRange: DateRange): { from: string; to: string } {
  return {
    from: dateRange.from,
    to: dateRange.to || dateRange.from,
  };
}

function getDatesBetween(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Get PAX data for rooms that allow multiple reservations
 * for a given date range in a workspace
 */
export async function getDailyPax(
  workspaceId: string,
  startDate: string,
  endDate: string,
): Promise<DailyPaxData[]> {
  // Get all rooms that allow multiple reservations
  const rooms = await db
    .select({
      id: eventRoomTable.id,
      name: eventRoomTable.name,
      capacity: eventRoomTable.capacity,
    })
    .from(eventRoomTable)
    .where(
      and(
        eq(eventRoomTable.workspaceId, workspaceId),
        eq(eventRoomTable.allowsMultipleReservations, true),
      ),
    );

  if (rooms.length === 0) {
    return [];
  }

  // Get all reservations for these rooms in the date range
  const roomIds = rooms.map((r) => r.id);

  const reservations = await db
    .select({
      id: reservationTable.id,
      eventRoomId: reservationTable.eventRoomId,
      dateRange: reservationTable.dateRange,
      expectedPax: reservationTable.expectedPax,
    })
    .from(reservationTable)
    .where(
      and(
        eq(reservationTable.workspaceId, workspaceId),
        sql`${reservationTable.eventRoomId} = ANY(${roomIds})`,
        // Check if reservation overlaps with date range
        sql`(${reservationTable.dateRange}::jsonb->>'from') <= ${endDate}`,
        sql`COALESCE((${reservationTable.dateRange}::jsonb->>'to'), (${reservationTable.dateRange}::jsonb->>'from')) >= ${startDate}`,
      ),
    );

  // Build daily PAX data
  const dates = getDatesBetween(startDate, endDate);
  const result: DailyPaxData[] = [];

  for (const room of rooms) {
    for (const date of dates) {
      // Find all reservations for this room on this date
      let totalPax = 0;
      let reservationCount = 0;

      for (const res of reservations) {
        if (res.eventRoomId !== room.id) continue;

        const dateRange = normalizeDateRange(
          JSON.parse(res.dateRange) as DateRange,
        );

        // Check if this date is within the reservation's range
        if (date >= dateRange.from && date <= dateRange.to) {
          totalPax += res.expectedPax || 0;
          reservationCount++;
        }
      }

      const availablePax = Math.max(0, room.capacity - totalPax);
      const occupancyPercent =
        room.capacity > 0 ? Math.round((totalPax / room.capacity) * 100) : 0;

      result.push({
        date,
        roomId: room.id,
        roomName: room.name,
        capacity: room.capacity,
        totalPax,
        availablePax,
        occupancyPercent,
        reservationCount,
      });
    }
  }

  return result;
}

/**
 * SSE endpoint for real-time PAX updates
 * Clients connect and receive updates when reservations change
 */
export async function streamAvailability(
  c: Context,
  workspaceId: string,
  startDate: string,
  endDate: string,
) {
  return streamSSE(c, async (stream) => {
    // Send initial data
    const initialData = await getDailyPax(workspaceId, startDate, endDate);
    await stream.writeSSE({
      event: "pax_update",
      data: JSON.stringify({
        type: "pax_update",
        workspaceId,
        data: initialData,
      }),
    });

    // Keep connection alive with heartbeat
    const heartbeatInterval = setInterval(async () => {
      try {
        await stream.writeSSE({
          event: "heartbeat",
          data: JSON.stringify({ timestamp: new Date().toISOString() }),
        });
      } catch {
        clearInterval(heartbeatInterval);
      }
    }, 30000);

    // Subscribe to reservation events
    const eventTypes = [
      "reservation.created",
      "reservation.updated",
      "reservation.deleted",
    ];

    const handlers: Array<() => void> = [];

    for (const eventType of eventTypes) {
      const handler = async (eventData: {
        workspaceId?: string;
        eventRoomId?: string;
      }) => {
        // Only send update if it's for this workspace
        if (eventData.workspaceId !== workspaceId) return;

        try {
          const updatedData = await getDailyPax(workspaceId, startDate, endDate);
          await stream.writeSSE({
            event: "pax_update",
            data: JSON.stringify({
              type: "pax_update",
              workspaceId,
              data: updatedData,
            }),
          });
        } catch {
          // Connection might be closed
        }
      };

      await subscribeToEvent(eventType, handler);
    }

    // Handle client disconnect
    stream.onAbort(() => {
      clearInterval(heartbeatInterval);
    });

    // Keep the connection open
    while (true) {
      await stream.sleep(1000);
    }
  });
}

export default {
  getDailyPax,
  streamAvailability,
};
