import {
  HOURS_24,
  HOUR_HEIGHT,
  getEventHeight,
  getEventTop,
} from "./calendar-utils";
import { CurrentTimeIndicator } from "./current-time-indicator";
import { EventCard } from "./event-card";
import type { Reservation } from "@/types/event-room";

interface CalendarDayColumnProps {
  day: Date;
  dayIndex: number;
  reservations: Reservation[];
  today: Date;
  isTodayInWeek: boolean;
  currentTime: Date;
  onScroll: (index: number) => (e: React.UIEvent<HTMLDivElement>) => void;
  scrollRef: (el: HTMLDivElement | null) => void;
  onEventClick: (reservation: Reservation) => void;
}

export function CalendarDayColumn({
  day,
  dayIndex,
  reservations,
  today,
  isTodayInWeek,
  currentTime,
  onScroll,
  scrollRef,
  onEventClick,
}: CalendarDayColumnProps) {
  return (
    <div
      ref={scrollRef}
      onScroll={onScroll(dayIndex)}
      className="flex-1 border-r border-border last:border-r-0 relative min-w-44 overflow-y-auto"
    >
      {HOURS_24.map((hour) => (
        <div
          key={hour}
          className="border-b border-border"
          style={{ height: `${HOUR_HEIGHT}px` }}
        />
      ))}

      <CurrentTimeIndicator
        day={day}
        today={today}
        isTodayInWeek={isTodayInWeek}
        currentTime={currentTime}
      />

      {reservations.map((reservation) => {
        const top = getEventTop(reservation.startTime);
        const height = getEventHeight(reservation.startTime, reservation.endTime);

        return (
          <EventCard
            key={reservation.id}
            event={reservation}
            style={{
              top: `${top + 4}px`,
              height: `${height - 8}px`,
            }}
            onClick={() => onEventClick(reservation)}
          />
        );
      })}
    </div>
  );
}
