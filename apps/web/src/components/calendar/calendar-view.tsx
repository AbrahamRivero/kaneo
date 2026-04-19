import type { DateRange, EventRoom, Reservation } from "@/fetchers/event-room";
import { useGetRoomTariffs } from "@/hooks/queries/event-room";
import { useCalendarStore } from "@/store/calendar-store";
import { useNavigate } from "@tanstack/react-router";
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

interface ReservationWithRoomName extends Reservation {
  roomName: string;
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

function isDateInRange(dateStr: string, dateRange: DateRange): boolean {
  const date = new Date(`${dateStr}T00:00:00`);
  const from = new Date(`${dateRange.from}T00:00:00`);
  const to = new Date(`${dateRange.to || dateRange.from}T00:00:00`);
  return date >= from && date <= to;
}

export function CalendarView({
  reservations,
  workspaceId,
  eventRooms,
}: CalendarViewProps) {
  const navigate = useNavigate();
  const {
    goToNextWeek,
    goToPreviousWeek,
    getWeekDays,
    getCurrentWeekReservations,
  } = useCalendarStore();
  const weekDays = getWeekDays();

  const handleDayClick = (date: Date) => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms/reservations/new",
      params: { workspaceId },
      search: { from: format(date, "yyyy-MM-dd") },
    });
  };

  const eventRoomsMap = eventRooms.reduce(
    (acc, room) => {
      acc[room.id] = room.name;
      return acc;
    },
    {} as Record<string, string>,
  );

  const reservationsWithRoomName: ReservationWithRoomName[] = reservations.map(
    (res) => ({
      ...res,
      roomName: eventRoomsMap[res.eventRoomId] || "",
    }),
  );

  const filteredReservations = getCurrentWeekReservations(
    reservationsWithRoomName,
  );
  const [selectedReservations, setSelectedReservations] = useState<
    Reservation[] | null
  >(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { data: roomTariffsData } = useGetRoomTariffs(workspaceId);
  const roomTariffs = roomTariffsData?.data ?? [];

  const reservationsByDay: Record<string, Reservation[]> = {};
  for (const day of weekDays) {
    const dayStr = format(day, "yyyy-MM-dd");
    reservationsByDay[dayStr] = filteredReservations.filter((e) => {
      const dateRange = parseDateRange(e.dateRange);
      return isDateInRange(dayStr, dateRange);
    });
  }

  const handleEventClick = (reservations: Reservation[]) => {
    setSelectedReservations(reservations);
    setSheetOpen(true);
  };

  const handleReservationUpdate = (updatedReservation: Reservation) => {
    setSelectedReservations(
      (prev) =>
        prev?.map((res) =>
          res.id === updatedReservation.id ? updatedReservation : res,
        ) ?? null,
    );
  };

  return (
    <>
      <EventSheet
        reservations={selectedReservations}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        workspaceId={workspaceId}
        eventRooms={eventRooms}
        roomTariffs={roomTariffs}
        onReservationUpdate={handleReservationUpdate}
      />
      <div className="flex flex-col h-full overflow-x-auto w-full">
        <CalendarWeekHeader
          weekDays={weekDays}
          onPreviousWeek={goToPreviousWeek}
          onNextWeek={goToNextWeek}
          workspaceId={workspaceId}
          onDayClick={handleDayClick}
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
                eventRooms={eventRooms}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
