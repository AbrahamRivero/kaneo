import { useNavigate } from "@tanstack/react-router";
import { AgeGroupTariffForm } from "@/components/event-room/age-tariff-form";
import { useGetAgeGroupTariffById } from "@/hooks/queries/event-room";
import { createFileRoute } from "@tanstack/react-router";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/age-tariffs/$tariffId",
)({
  loader: ({ params }) => ({
    workspaceId: params.workspaceId,
    tariffId: params.tariffId,
  }),
  component: EditAgeGroupTariffPage,
});

function EditAgeGroupTariffPage() {
  const { workspaceId, tariffId } = Route.useParams();
  const navigate = useNavigate();

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });

  const { data: tariff, isLoading } = useGetAgeGroupTariffById(tariffId);

  if (isLoadingWorkspace) {
    return (
      <WorkspaceLayout title="Edit Age Tariff">
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
      <WorkspaceLayout title="Edit Tariff">
        <div className="p-6 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout title="Edit Age Tariff">
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/age-tariff",
                params: { workspaceId },
              })
            }
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Age Tariff</h1>
            <p className="text-muted-foreground mt-1">
              Update room age tariff details
            </p>
          </div>
        </div>
        <AgeGroupTariffForm
          workspaceId={workspaceId}
          tariffId={tariffId}
          initialData={
            tariff
              ? {
                  id: tariff.id,
                  eventRoomId: tariff.eventRoomId,
                  name: tariff.name,
                  minAge: tariff.minAge,
                  maxAge: tariff.maxAge,
                  price: tariff.price,
                }
              : null
          }
          isLoadingData={isLoading}
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
