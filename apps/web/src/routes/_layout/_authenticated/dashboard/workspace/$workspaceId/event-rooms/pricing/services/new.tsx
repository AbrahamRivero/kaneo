import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateGastronomicService } from "@/hooks/mutations/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/services/new",
)({
  component: NewServicePage,
});

interface ServiceFormData {
  name: string;
  pricePerPax: string;
  description: string;
}

const initialServiceForm: ServiceFormData = {
  name: "",
  pricePerPax: "",
  description: "",
};

function NewServicePage() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });

  const createService = useCreateGastronomicService();

  const [form, setForm] = useState<ServiceFormData>(initialServiceForm);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error("Service name is required");
      return;
    }

    try {
      const payload = {
        workspaceId,
        name: form.name,
        pricePerPax: form.pricePerPax ? Number(form.pricePerPax) : null,
        description: form.description || undefined,
        isActive: true,
      };

      await createService.mutateAsync(payload);
      toast.success("Service created successfully");
      navigate({
        to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services",
        params: { workspaceId },
      });
    } catch {
      toast.error("Failed to create service");
    }
  };

  if (isLoadingWorkspace) {
    return (
      <WorkspaceLayout title="New Service">
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
      <WorkspaceLayout title="New Service">
        <div className="p-6 text-center text-muted-foreground">
          <p>Event rooms module is not enabled for this workspace.</p>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout title="New Service">
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
            <h1 className="text-2xl font-semibold">New Service</h1>
            <p className="text-muted-foreground mt-1">
              Create a new gastronomic service
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Service Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Coffee Break"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pricePerPax">Price per Pax (CUP)</Label>
              <Input
                id="pricePerPax"
                type="number"
                value={form.pricePerPax}
                onChange={(e) =>
                  setForm({ ...form, pricePerPax: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                placeholder="Optional description"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={createService.isPending}>
                {createService.isPending ? "Creating..." : "Create"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/services",
                    params: { workspaceId },
                  })
                }
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
