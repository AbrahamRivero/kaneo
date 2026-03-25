import { RoomForm } from "@/components/calendar/room-form";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetEventRoomById } from "@/hooks/queries/event-room";
import queryClient from "@/query-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/manage/$roomId",
)({
  component: EditRoomPage,
});

function EditRoomPage() {
  const { workspaceId, roomId } = Route.useParams();
  const navigate = useNavigate();

  const { data: room, isLoading } = useGetEventRoomById(roomId);

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["event-rooms"] });
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms/manage",
      params: { workspaceId },
    });
  };

  return (
    <WorkspaceLayout title="Edit Room">
      <div className="p-6 max-w-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                navigate({
                  to: "/dashboard/workspace/$workspaceId/event-rooms/manage",
                  params: { workspaceId },
                })
              }
            >
              <ArrowLeft className="size-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-semibold">Edit Room</h1>
              <p className="text-muted-foreground mt-1">
                Update the room details below.
              </p>
            </div>
          </div>
          {isLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <RoomForm
              workspaceId={workspaceId}
              roomId={roomId}
              initialData={room}
              onSuccess={handleSuccess}
              onCancel={() => {
                navigate({
                  to: "/dashboard/workspace/$workspaceId/event-rooms/manage",
                  params: { workspaceId },
                });
              }}
            />
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
