import { CalendarControls } from "@/components/calendar/calendar-controls";
import { CalendarHeader } from "@/components/calendar/calendar-header";
import { CalendarView } from "@/components/calendar/calendar-view";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useGetEventRooms,
  useGetReservations,
} from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms",
)({
  component: EventRoomsRoute,
});

function EventRoomsRoute() {
  const { workspaceId } = Route.useParams();

  const { data: workspace, isLoading } = useGetWorkspace({ id: workspaceId });
  const { data: _eventRooms, isLoading: isLoadingRooms } =
    useGetEventRooms(workspaceId);
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

  return (
    <WorkspaceLayout title="Event Rooms">
      <div className="w-full">
        <CalendarHeader />
        <CalendarControls />
      </div>
      <div className="flex-1 overflow-hidden w-full">
        <CalendarView />
      </div>
    </WorkspaceLayout>
  );
}
