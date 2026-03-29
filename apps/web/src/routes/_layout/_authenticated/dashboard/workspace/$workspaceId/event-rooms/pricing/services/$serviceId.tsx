import WorkspaceLayout from "@/components/common/workspace-layout";
import { ServiceForm } from "@/components/event-room/service-form";
import { Button } from "@/components/ui/button";
import { useGetServiceById } from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/services/$serviceId",
)({
  loader: ({ params }) => ({
    workspaceId: params.workspaceId,
    serviceId: params.serviceId,
  }),
  component: EditServicePage,
});

function EditServicePage() {
  const { workspaceId, serviceId } = Route.useParams();
  const navigate = useNavigate();

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });

  const { data: service, isLoading: isLoadingService } =
    useGetServiceById(serviceId);

  if (isLoadingWorkspace || isLoadingService) {
    return (
      <WorkspaceLayout title="Edit Service">
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
      <WorkspaceLayout title="Edit Service">
        <div className="p-6 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout title="Edit Service">
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services",
                params: { workspaceId },
              })
            }
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Service</h1>
            <p className="text-muted-foreground mt-1">Update service details</p>
          </div>
        </div>

        <ServiceForm
          workspaceId={workspaceId}
          serviceId={serviceId}
          initialData={service ?? null}
          isLoadingData={isLoadingService}
          onSuccess={() =>
            navigate({
              to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services",
              params: { workspaceId },
            })
          }
          onCancel={() =>
            navigate({
              to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services",
              params: { workspaceId },
            })
          }
        />
      </div>
    </WorkspaceLayout>
  );
}
