import type { EventRoom, Reservation } from "@/fetchers/event-room";
import { useCalendarStore } from "@/store/calendar-store";
import { format } from "date-fns";
import { useState } from "react";
import { CalendarDayColumn } from "./calendar-day-column";
import { CalendarWeekHeader } from "./calendar-week-header";
import { EventSheet } from "./reservation-sheet";

export interface CalendarViewProps {
  reservations: Reservation[];
  workspaceId: string;
  eventRooms: EventRoom[];
}

export function CalendarView({
  reservations,
  workspaceId,
  eventRooms,
}: CalendarViewProps) {
  const {
    goToNextWeek,
    goToPreviousWeek,
    getWeekDays,
    getCurrentWeekReservations,
  } = useCalendarStore();
  const weekDays = getWeekDays();

  const eventRoomsMap = eventRooms.reduce(
    (acc, room) => {
      acc[room.id] = room.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const reservationsWithRoomName = reservations.map((res) => ({
    ...res,
    roomName: eventRoomsMap[res.eventRoomId] || "",
  }));

  const filteredReservations = getCurrentWeekReservations(
    reservationsWithRoomName,
  );
  const [selectedReservations, setSelectedReservations] = useState<
    Reservation[] | null
  >(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const reservationsByDay: Record<string, Reservation[]> = {};
  for (const day of weekDays) {
    const dayStr = format(day, "yyyy-MM-dd");
    reservationsByDay[dayStr] = filteredReservations.filter(
      (e) => e.date === dayStr,
    );
  }

  const handleEventClick = (reservations: Reservation[]) => {
    setSelectedReservations(reservations);
    setSheetOpen(true);
  };

  return (
    <>
      <EventSheet
        reservations={selectedReservations}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        workspaceId={workspaceId}
        eventRooms={eventRooms}
      />
      <div className="flex flex-col h-full overflow-x-auto w-full">
        <CalendarWeekHeader
          weekDays={weekDays}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
        />

        <div className="flex min-w-full w-max">
          <div className="w-[80px] md:w-[104px] flex items-center gap-1 md:gap-2 p-1.5 md:p-2 border-r border-border shrink-0 bg-background" />
          {weekDays.map((day) => {
            const dayStr = format(day, "yyyy-MM-dd");
            const dayReservations = reservationsByDay[dayStr] || [];

            return (
              <CalendarDayColumn
                key={day.toISOString()}
                reservations={dayReservations}
                onEventClick={handleEventClick}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
