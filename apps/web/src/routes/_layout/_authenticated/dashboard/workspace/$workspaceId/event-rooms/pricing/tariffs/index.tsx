import WorkspaceLayout from "@/components/common/workspace-layout";
import { TariffsTable } from "@/components/event-room/tariffs-table";
import { Button } from "@/components/ui/button";
import { useDeleteRoomTariff } from "@/hooks/mutations/event-room";
import { useGetRoomTariffs } from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs/",
)({
  component: PricingTariffsRoute,
});

function PricingTariffsRoute() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: tariffsData, refetch } = useGetRoomTariffs(
    workspaceId,
    undefined,
    pagination.page,
    pagination.limit,
  );
  const deleteTariff = useDeleteRoomTariff();

  const handleDelete = async (id: string) => {
    try {
      await deleteTariff.mutateAsync(id);
      toast.success("Tariff deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete tariff");
    }
  };

  if (isLoadingWorkspace) {
    return (
      <WorkspaceLayout title="Room Tariffs">
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
      <WorkspaceLayout title="Room Tariffs">
        <div className="p-6 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  const tariffs = tariffsData?.data ?? [];
  const total = tariffsData?.total ?? 0;

  return (
    <WorkspaceLayout title="Room Tariffs">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Room Tariffs</h1>
            <p className="text-muted-foreground mt-1">
              Manage tariffs applied to each room and session type
            </p>
          </div>
          <Button
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs/new",
                params: { workspaceId },
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Tariff
          </Button>
        </div>

        {total === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No tariffs found
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create one to get started.
              </p>
            </div>
          </div>
        ) : (
          <TariffsTable
            tariffs={tariffs}
            total={total}
            page={pagination.page}
            limit={pagination.limit}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onLimitChange={(limit) => setPagination({ page: 1, limit })}
            onEdit={(tariff) =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs/$tariffId",
                params: { workspaceId, tariffId: tariff.id },
              })
            }
            onDelete={handleDelete}
          />
        )}
      </div>
    </WorkspaceLayout>
  );
}
