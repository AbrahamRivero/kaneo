import type { DateRange, EventRoom, Reservation } from "@/fetchers/event-room";
import { EventCard } from "./event-card";

interface CalendarDayColumnProps {
  reservations: Reservation[];
  onEventClick: (reservations: Reservation[]) => void;
  eventRooms: EventRoom[];
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

function sortReservations(reservations: Reservation[]) {
  return [...reservations].sort((a, b) => {
    const dateRangeA = parseDateRange(a.dateRange);
    const dateRangeB = parseDateRange(b.dateRange);
    const dateDiff = dateRangeA.from.localeCompare(dateRangeB.from);
    if (dateDiff !== 0) return dateDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function CalendarDayColumn({
  reservations,
  onEventClick,
  eventRooms,
}: CalendarDayColumnProps) {
  const sortedReservations = sortReservations(reservations);

  return (
    <div
      className="w-44 border-r border-border last:border-r-0 p-1.5 md:p-2 flex flex-col gap-2 overflow-y-auto relative"
      style={{ height: 2880 }}
    >
      {sortedReservations.map((reservation) => {
        const room = eventRooms.find((r) => r.id === reservation.eventRoomId);
        return (
          <EventCard
            key={reservation.id}
            event={reservation}
            onClick={() => onEventClick([reservation])}
            allowsMultipleReservations={
              room?.allowsMultipleReservations ?? false
            }
          />
        );
      })}
    </div>
  );
}
