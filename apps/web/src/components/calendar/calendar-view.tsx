import { useCalendarStore } from "@/store/calendar-store";
import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { CalendarDayColumn } from "./calendar-day-column";
import { CalendarHoursColumn } from "./calendar-hours-column";
import { INITIAL_SCROLL_OFFSET } from "./calendar-utils";
import { CalendarWeekHeader } from "./calendar-week-header";
import { EventSheet } from "./reservation-sheet";
import type { Reservation } from "@/types/event-room";

export function CalendarView() {
  const { goToNextWeek, goToPreviousWeek, getWeekDays, getCurrentWeekReservations } =
    useCalendarStore();
  const weekDays = getWeekDays();
  const filteredReservations = getCurrentWeekReservations();
  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const daysScrollRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hasScrolledRef = useRef(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const today = new Date();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const reservationsByDay: Record<string, Reservation[]> = {};
  for (const day of weekDays) {
    const dayStr = format(day, "yyyy-MM-dd");
    reservationsByDay[dayStr] = filteredReservations.filter((e) => e.startDate.toDateString() === dayStr);
  };

  const isTodayInWeek = weekDays.some(
    (day) => format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd"),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const scrollToInitial = () => {
      if (!hasScrolledRef.current && hoursScrollRef.current) {
        hoursScrollRef.current.scrollTop = INITIAL_SCROLL_OFFSET;
        for (const ref of daysScrollRefs.current) {
          if (ref) {
            ref.scrollTop = INITIAL_SCROLL_OFFSET;
          }
        };
        hasScrolledRef.current = true;
      }
    };

    scrollToInitial();
    const timeoutId = setTimeout(scrollToInitial, 100);
    return () => clearTimeout(timeoutId);
  }, [weekDays]);

  const handleHoursScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    for (const ref of daysScrollRefs.current) {
      if (ref) {
        ref.scrollTop = scrollTop;
      }
    };
  };

  const handleDayScroll =
    (index: number) => (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      if (hoursScrollRef.current) {
        hoursScrollRef.current.scrollTop = scrollTop;
      }
      for (const [idx, ref] of daysScrollRefs.current.entries()) {
        if (ref && idx !== index) {
          ref.scrollTop = scrollTop;
        }
      };
    };

  const handleEventClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setSheetOpen(true);
  };

  return (
    <>
      <EventSheet
        reservation={selectedReservation}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
      <div className="flex flex-col h-full overflow-x-auto w-full">
        <CalendarWeekHeader
          weekDays={weekDays}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
        />

        <div className="flex min-w-full w-max">
          <CalendarHoursColumn
            onScroll={handleHoursScroll}
            scrollRef={hoursScrollRef}
          />

          {weekDays.map((day, dayIndex) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayReservations = reservationsByDay[dayStr] || [];

            return (
              <CalendarDayColumn
                key={day.toISOString()}
                day={day}
                dayIndex={dayIndex}
                reservations={dayReservations}
                today={today}
                isTodayInWeek={isTodayInWeek}
                currentTime={currentTime}
                onScroll={handleDayScroll}
                scrollRef={(el) => {
                  daysScrollRefs.current[dayIndex] = el;
                }}
                onEventClick={handleEventClick}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
