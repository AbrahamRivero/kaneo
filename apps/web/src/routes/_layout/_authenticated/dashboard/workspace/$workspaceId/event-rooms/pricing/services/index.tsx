import WorkspaceLayout from "@/components/common/workspace-layout";
import { ServicesTable } from "@/components/event-room/services-table";
import { Button } from "@/components/ui/button";
import { useDeleteService } from "@/hooks/mutations/event-room";
import { useGetServices } from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/services/",
)({
  component: PricingServicesRoute,
});

function PricingServicesRoute() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: servicesData, refetch } = useGetServices(
    workspaceId,
    pagination.page,
    pagination.limit,
  );
  const deleteService = useDeleteService();

  const handleDelete = async (id: string) => {
    try {
      await deleteService.mutateAsync(id);
      toast.success("Service deleted successfully");
      refetch();
    } catch {
      toast.error("Failed to delete service");
    }
  };

  if (isLoadingWorkspace) {
    return (
      <WorkspaceLayout title="Gastronomic Services">
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
      <WorkspaceLayout title="Gastronomic Services">
        <div className="p-6 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  const services = servicesData?.data ?? [];
  const total = servicesData?.total ?? 0;

  return (
    <WorkspaceLayout title="Gastronomic Services">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gastronomic Services</h1>
            <p className="text-muted-foreground mt-1">
              Manage all services offered for event room reservations
            </p>
          </div>
          <Button
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services/new",
                params: { workspaceId },
              })
            }
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </div>

        {total === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30">
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                No services found
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Create one to get started.
              </p>
            </div>
          </div>
        ) : (
          <ServicesTable
            services={services}
            total={total}
            page={pagination.page}
            limit={pagination.limit}
            onPageChange={(page) =>
              setPagination((prev) => ({ ...prev, page }))
            }
            onLimitChange={(limit) => setPagination({ page: 1, limit })}
            onEdit={(service) =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services/$serviceId",
                params: { workspaceId, serviceId: service.id },
              })
            }
            onDelete={handleDelete}
          />
        )}
      </div>
    </WorkspaceLayout>
  );
}
