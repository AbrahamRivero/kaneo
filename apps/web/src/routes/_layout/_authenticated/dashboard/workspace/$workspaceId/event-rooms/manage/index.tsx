import { type Room, RoomsTable } from "@/components/calendar/rooms-table";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteEventRoom } from "@/hooks/mutations/event-room";
import { useGetEventRooms } from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/manage/",
)({
  component: ManageEventRoomsRoute,
});

function ManageEventRoomsRoute() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();

  const { data: workspace, isLoading } = useGetWorkspace({ id: workspaceId });
  const {
    data: _eventRooms,
    isLoading: isLoadingRooms,
    refetch: refetchRooms,
  } = useGetEventRooms(workspaceId);

  const deleteRoom = useDeleteEventRoom();

  useEffect(() => {
    refetchRooms();
  }, [refetchRooms]);

  const eventRoomsEnabled = Boolean(
    (workspace as { eventRoomsEnabled?: boolean } | undefined)
      ?.eventRoomsEnabled,
  );

  if (isLoading || isLoadingRooms) {
    return (
      <WorkspaceLayout title="Manage Event Rooms">
        <div className="p-4 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-[70vh] w-full" />
        </div>
      </WorkspaceLayout>
    );
  }

  if (!workspace) {
    return (
      <WorkspaceLayout title="Manage Event Rooms">
        <div className="p-4">Workspace not found.</div>
      </WorkspaceLayout>
    );
  }

  if (!eventRoomsEnabled) {
    return (
      <WorkspaceLayout title="Manage Event Rooms">
        <div className="p-4 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  const rooms: Room[] = (_eventRooms || []).map((r) => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity,
    description: r.description ?? undefined,
    allowsMultipleReservations: r.allowsMultipleReservations ?? false,
  }));

  const handleEdit = (room: Room) => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms/manage/$roomId",
      params: { workspaceId, roomId: room.id },
    });
  };

  const handleDelete = (room: Room) => {
    const message = `Are you sure you want to delete ${room.name}?`;
    if (window.confirm(message)) {
      deleteRoom.mutate(room.id);
    }
  };

  const handleCreateNew = () => {
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms/manage/new",
      params: { workspaceId },
    });
  };

  return (
    <WorkspaceLayout title="Manage Event Rooms">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Event Rooms</h1>
            <p className="text-muted-foreground mt-1">
              Manage your event spaces and their capacities
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="w-4 h-4 mr-2" />
            Add Room
          </Button>
        </div>

        <RoomsTable rooms={rooms} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </WorkspaceLayout>
  );
}
