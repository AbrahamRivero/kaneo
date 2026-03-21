import { RoomForm } from "@/components/calendar/room-form";
import WorkspaceLayout from "@/components/common/workspace-layout";
import queryClient from "@/query-client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/manage/new",
)({
  component: CreateRoomPage,
});

function CreateRoomPage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();

  const handleSuccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ["event-rooms"] });
    navigate({
      to: "/dashboard/workspace/$workspaceId/event-rooms/manage",
      params: { workspaceId },
    });
  };

  return (
    <WorkspaceLayout title="Create New Room">
      <div className="p-6 max-w-xl">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-semibold">Create New Room</h1>
            <p className="text-muted-foreground mt-1">
              Add a new event room for your workspace.
            </p>
          </div>
          <RoomForm
            workspaceId={workspaceId}
            onSuccess={handleSuccess}
            onCancel={() => {
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/manage",
                params: { workspaceId },
              });
            }}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
