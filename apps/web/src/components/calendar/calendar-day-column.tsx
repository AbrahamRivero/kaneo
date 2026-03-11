import type { Reservation } from "@/fetchers/event-room";
import { EventCard } from "./event-card";

interface CalendarDayColumnProps {
  reservations: Reservation[];
  onEventClick: (reservations: Reservation[]) => void;
}

function getMinutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + (minutes || 0);
}

function sortReservations(reservations: Reservation[]) {
  return [...reservations].sort((a, b) => {
    const startDiff =
      getMinutesFromTime(a.startTime) - getMinutesFromTime(b.startTime);
    if (startDiff !== 0) return startDiff;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

export function CalendarDayColumn({
  reservations,
  onEventClick,
}: CalendarDayColumnProps) {
  const sortedReservations = sortReservations(reservations);

  return (
    <div
      className="flex-1 border-r border-border last:border-r-0 p-1.5 md:p-2 min-w-44 flex flex-col gap-2 overflow-y-auto relative"
      style={{ height: 2880 }}
    >
      {sortedReservations.map((reservation) => {
        return (
          <EventCard
            key={reservation.id}
            event={reservation}
            onClick={() => onEventClick([reservation])}
          />
        );
      })}
    </div>
  );
}
