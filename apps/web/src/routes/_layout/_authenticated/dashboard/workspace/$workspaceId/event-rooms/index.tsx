import { CalendarControls } from "@/components/calendar/calendar-controls";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import { ReportsDialog } from "@/components/calendar/reports-dialog";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Skeleton } from "@/components/ui/skeleton";
import type { EventRoom, Reservation } from "@/fetchers/event-room";
import {
  useGetEventRooms,
  useGetReservations,
} from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { useCalendarStore } from "@/store/calendar-store";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { useState } from "react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/",
)({
  component: EventRoomsIndex,
});

function EventRoomsIndex() {
  const { workspaceId } = Route.useParams();
  const [reportsOpen, setReportsOpen] = useState(false);

  const { data: workspace, isLoading } = useGetWorkspace({ id: workspaceId });
  const { data: _eventRooms, isLoading: isLoadingRooms } =
    useGetEventRooms(workspaceId);
  const { getWeekDays } = useCalendarStore();
  const weekDays = getWeekDays();
  const { data: _reservations, isLoading: isLoadingReservations } =
    useGetReservations(workspaceId);

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
    const resDate = r.date;
    return weekDays.some((day) => format(day, "yyyy-MM-dd") === resDate);
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
        <CalendarHeader
          workspaceId={workspaceId}
          eventRooms={eventRooms}
          reservations={reservations}
        />
        <CalendarControls
          eventRooms={eventRooms}
          onOpenReports={() => setReportsOpen(true)}
        />
      </div>
      <div className="flex-1 overflow-hidden w-full">
        <CalendarView
          reservations={weekReservations}
          workspaceId={workspaceId}
          eventRooms={eventRooms}
        />
      </div>
    </WorkspaceLayout>
  );
}
