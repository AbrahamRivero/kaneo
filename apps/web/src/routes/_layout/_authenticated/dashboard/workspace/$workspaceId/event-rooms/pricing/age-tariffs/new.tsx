import WorkspaceLayout from "@/components/common/workspace-layout";
import { AgeGroupTariffForm } from "@/components/event-room/age-tariff-form";
import { Button } from "@/components/ui/button";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/age-tariffs/new",
)({
  component: NewAgeGroupTariffPage,
});

function NewAgeGroupTariffPage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });
  if (isLoadingWorkspace) {
    return (
      <WorkspaceLayout title="New Age Group Tariff">
        <div className="p-6">Loading...</div>
      </WorkspaceLayout>
    );
  }

  const eventRoomsEnabled = Boolean(
    (workspace as { eventRoomsEnabled?: boolean } | undefined)
      ?.eventRoomsEnabled,
  );

  if (!eventRoomsEnabled) {
    return (
      <WorkspaceLayout title="New Age Group Tariff">
        <div className="p-6 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout title="New Age Group Tariff">
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/age-tariffs",
                params: { workspaceId },
              })
            }
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">New Age Group Tariff</h1>
            <p className="text-muted-foreground mt-1">
              Create a new age group tariff
            </p>
          </div>
        </div>

        <AgeGroupTariffForm
          workspaceId={workspaceId}
          onSuccess={() =>
            navigate({
              to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/age-tariffs",
              params: { workspaceId },
            })
          }
          onCancel={() =>
            navigate({
              to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/age-tariffs",
              params: { workspaceId },
            })
          }
        />
      </div>
    </WorkspaceLayout>
  );
}
