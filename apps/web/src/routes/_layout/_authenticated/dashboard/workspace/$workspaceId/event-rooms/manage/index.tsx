import { RoomDialog } from "@/components/calendar/room-dialog";
import { type Room, RoomsTable } from "@/components/calendar/rooms-table";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDeleteEventRoom } from "@/hooks/mutations/event-room";
import {
  useGetEventRoomById,
  useGetEventRooms,
} from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/manage/",
)({
  component: ManageEventRoomsRoute,
});

function ManageEventRoomsRoute() {
  const { workspaceId } = Route.useParams();

  const { data: workspace, isLoading } = useGetWorkspace({ id: workspaceId });
  const { data: _eventRooms, isLoading: isLoadingRooms } =
    useGetEventRooms(workspaceId);

  const deleteRoom = useDeleteEventRoom();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | undefined>();

  const {
    data: editingRoom,
    isLoading: isLoadingEditingRoom,
    refetch,
  } = useGetEventRoomById(editingRoomId);

  const eventRoomsEnabled = Boolean(
    (workspace as { eventRoomsEnabled?: boolean } | undefined)
      ?.eventRoomsEnabled,
  );

  // when the editingRoom data becomes available, show the dialog. this also
  // allows us to reset the form inside <RoomDialog> via the prop change. the
  // effect must be declared *before* any early return so that React always
  // executes the same number of hooks on every render.
  useEffect(() => {
    if (editingRoomId && editingRoom && !dialogOpen) {
      setDialogOpen(true);
    }
  }, [editingRoomId, editingRoom, dialogOpen]);

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
    // trigger the query for the full details - we'll open the dialog once the
    // data has arrived to avoid showing a blank form.
    setEditingRoomId(room.id);
    refetch();
  };

  const handleDelete = (room: Room) => {
    const message = `Are you sure you want to delete ${room.name}?`;
    if (window.confirm(message)) {
      deleteRoom.mutate(room.id);
    }
  };

  const handleCreateNew = () => {
    // opening dialog for a new room; make sure any previous editing id is
    // cleared so the form starts empty.
    setEditingRoomId(undefined);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingRoomId(undefined);
    }
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

        <RoomDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          workspaceId={workspaceId}
          roomId={editingRoomId}
          initialData={editingRoomId ? editingRoom : null}
          isLoadingData={Boolean(editingRoomId) && isLoadingEditingRoom}
        />
      </div>
    </WorkspaceLayout>
  );
}
