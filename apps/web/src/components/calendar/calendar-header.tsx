import { Button } from "@/components/ui/button";
import type { DateRange, EventRoom, Reservation } from "@/fetchers/event-room";
import { useCalendarStore } from "@/store/calendar-store";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { useState } from "react";
import { ReservationDialog } from "./reservation-dialog";

interface CalendarHeaderProps {
  workspaceId: string;
  eventRooms: EventRoom[];
  reservations: Reservation[];
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

function isDateInRange(dateStr: string, dateRange: DateRange): boolean {
  const date = new Date(dateStr + "T00:00:00");
  const from = new Date(dateRange.from + "T00:00:00");
  const to = new Date((dateRange.to || dateRange.from) + "T00:00:00");
  return date >= from && date <= to;
}

export function CalendarHeader({
  workspaceId,
  eventRooms,
  reservations,
}: CalendarHeaderProps) {
  const { currentWeekStart, getWeekDays } = useCalendarStore();
  const weekDays = getWeekDays();
  const weekReservations = reservations.filter((r) => {
    const dateRange = parseDateRange(r.dateRange);
    return weekDays.some((day) =>
      isDateInRange(format(day, "yyyy-MM-dd"), dateRange),
    );
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <>
      <ReservationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        workspaceId={workspaceId}
        eventRooms={eventRooms}
      />
      <div className="border-b border-border bg-background">
        <div className="px-3 md:px-6 py-2.5 md:py-3">
          <div className="flex items-center justify-between gap-2 md:gap-3 flex-nowrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0">
                <h1 className="text-sm md:text-base lg:text-lg font-semibold text-foreground truncate mb-0 md:mb-1">
                  {format(currentWeekStart, "MMMM dd, yyyy")}
                </h1>
                <p className="hidden md:block text-xs text-muted-foreground">
                  You have {weekReservations.length} reservation
                  {weekReservations.length !== 1 ? "s" : ""} this week 🗓️
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-2.5 shrink-0">
              <Button onClick={() => setCreateDialogOpen(true)}>
                <CalendarIcon className="size-4" />
                <span className="hidden lg:inline">Create Reservation</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
