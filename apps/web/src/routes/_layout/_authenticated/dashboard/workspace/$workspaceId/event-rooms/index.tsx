import { CalendarControls } from "@/components/calendar/calendar-controls";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { ReportsDialog } from "@/components/calendar/reports-dialog";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange, EventRoom, Reservation } from "@/fetchers/event-room";
import {
  useGetEventRooms,
  useGetReservations,
} from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { useCalendarStore } from "@/store/calendar-store";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { lazy, Suspense, useEffect, useState } from "react";

const CalendarView = lazy(() =>
  import("@/components/calendar/calendar-view").then((m) => ({
    default: m.CalendarView,
  })),
);

const calendarFallback = (
  <div className="flex h-[70vh] items-center justify-center">
    <Skeleton className="h-full w-full" />
  </div>
);

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/",
)({
  component: EventRoomsIndex,
});

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

function EventRoomsIndex() {
  const { workspaceId } = Route.useParams();
  const [reportsOpen, setReportsOpen] = useState(false);

  const { data: workspace, isLoading } = useGetWorkspace({ id: workspaceId });
  const {
    data: _eventRooms,
    isLoading: isLoadingRooms,
    refetch: refetchRooms,
  } = useGetEventRooms(workspaceId);
  const { getWeekDays } = useCalendarStore();
  const weekDays = getWeekDays();
  const {
    data: _reservations,
    isLoading: isLoadingReservations,
    refetch: refetchReservations,
  } = useGetReservations(workspaceId);

  useEffect(() => {
    refetchRooms();
    refetchReservations();
  }, [refetchRooms, refetchReservations]);

  const eventRoomsEnabled = Boolean(
    (workspace as { eventRoomsEnabled?: boolean } | undefined)
      ?.eventRoomsEnabled,
  );

  if (isLoading || isLoadingRooms || isLoadingReservations) {
    return (
      <WorkspaceLayout title="Event Rooms">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      </WorkspaceLayout>
    );
  }

  if (!workspace) {
    return (
      <WorkspaceLayout title="Event Rooms">
        <div className="p-4">Workspace not found.</div>
      </WorkspaceLayout>
    );
  }

  if (!eventRoomsEnabled) {
    return (
      <WorkspaceLayout title="Event Rooms">
        <div className="p-4 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  const eventRooms = (_eventRooms || []) as EventRoom[];

  const reservations = (_reservations || []) as Reservation[];

  const weekReservations = reservations.filter((r) => {
    const dateRange = parseDateRange(r.dateRange);
    return weekDays.some((day) =>
      isDateInRange(format(day, "yyyy-MM-dd"), dateRange),
    );
  });

  return (
    <WorkspaceLayout title="Event Rooms">
      <ReportsDialog
        open={reportsOpen}
        onOpenChange={setReportsOpen}
        workspaceId={workspaceId}
        eventRooms={eventRooms}
      />
      <div className="w-full">
        <CalendarHeader workspaceId={workspaceId} reservations={reservations} />
        <CalendarControls
          eventRooms={eventRooms}
          onOpenReports={() => setReportsOpen(true)}
        />
      </div>
      <div className="flex-1 overflow-hidden w-full">
        <Suspense fallback={calendarFallback}>
          <CalendarView
            reservations={weekReservations}
            workspaceId={workspaceId}
            eventRooms={eventRooms}
          />
        </Suspense>
      </div>
    </WorkspaceLayout>
  );
}
