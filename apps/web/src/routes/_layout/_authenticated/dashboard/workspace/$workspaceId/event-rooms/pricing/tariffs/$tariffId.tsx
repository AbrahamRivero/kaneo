import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateRoomTariff } from "@/hooks/mutations/event-room";
import {
  useGetEventRooms,
  useGetRoomTariffById,
} from "@/hooks/queries/event-room";
import useGetWorkspace from "@/hooks/queries/workspace/use-get-workspace";
import type { SessionType } from "@/types/event-room";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs/$tariffId",
)({
  loader: ({ params }) => ({
    workspaceId: params.workspaceId,
    tariffId: params.tariffId,
  }),
  component: EditTariffPage,
});

interface TariffFormData {
  eventRoomId: string;
  sessionType: SessionType;
  price: string;
  serviceChargePercent: string;
  modificationCharge: string;
}

const initialTariffForm: TariffFormData = {
  eventRoomId: "",
  sessionType: "half_session",
  price: "",
  serviceChargePercent: "10",
  modificationCharge: "2000",
};

const sessionTypeLabels: Record<SessionType, string> = {
  half_session: "Half Session",
  full_session: "Full Session",
  social_event: "Social Event",
  flat: "Flat Rate",
};

function EditTariffPage() {
  const { workspaceId, tariffId } = Route.useParams();
  const navigate = useNavigate();

  const { data: workspace, isLoading: isLoadingWorkspace } = useGetWorkspace({
    id: workspaceId,
  });
  const { data: eventRooms = [] } = useGetEventRooms(workspaceId);

  const { data: tariff, isLoading: isLoadingTariff } =
    useGetRoomTariffById(tariffId);

  const updateTariff = useUpdateRoomTariff();

  const [form, setForm] = useState<TariffFormData>(initialTariffForm);

  useEffect(() => {
    if (tariff) {
      setForm({
        eventRoomId: tariff.eventRoomId,
        sessionType: tariff.sessionType,
        price: tariff.price?.toString() || "",
        serviceChargePercent: tariff.serviceChargePercent.toString(),
        modificationCharge: tariff.modificationCharge.toString(),
      });
    }
  }, [tariff]);

  const handleSave = async () => {
    if (!form.eventRoomId) {
      toast.error("Please select a room");
      return;
    }

    try {
      const payload = {
        workspaceId,
        eventRoomId: form.eventRoomId,
        sessionType: form.sessionType,
        price: form.price ? Number(form.price) : null,
        serviceChargePercent: Number(form.serviceChargePercent),
        modificationCharge: Number(form.modificationCharge),
        isActive: true,
      };

      await updateTariff.mutateAsync({ id: tariffId, payload });
      toast.success("Tariff updated successfully");
      navigate({
        to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs",
        params: { workspaceId },
      });
    } catch {
      toast.error("Failed to update tariff");
    }
  };

  if (isLoadingWorkspace || isLoadingTariff) {
    return (
      <WorkspaceLayout title="Edit Tariff">
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
    <WorkspaceLayout title="Edit Tariff">
      <div className="p-6 space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              navigate({
                to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs",
                params: { workspaceId },
              })
            }
          >
            <ArrowLeft className="size-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Tariff</h1>
            <p className="text-muted-foreground mt-1">
              Update room tariff details
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tariff Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="eventRoom">Room</Label>
              <Select
                value={form.eventRoomId}
                onValueChange={(value) =>
                  setForm({ ...form, eventRoomId: value })
                }
              >
                <SelectTrigger id="eventRoom">
                  <SelectValue placeholder="Select room" />
                </SelectTrigger>
                <SelectContent>
                  {eventRooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="sessionType">Session Type</Label>
              <Select
                value={form.sessionType}
                onValueChange={(value) =>
                  setForm({ ...form, sessionType: value as SessionType })
                }
              >
                <SelectTrigger id="sessionType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(sessionTypeLabels) as SessionType[]).map(
                    (type) => (
                      <SelectItem key={type} value={type}>
                        {sessionTypeLabels[type]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="price">Price (CUP)</Label>
              <Input
                id="price"
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="serviceChargePercent">Service Charge %</Label>
              <Input
                id="serviceChargePercent"
                type="number"
                value={form.serviceChargePercent}
                onChange={(e) =>
                  setForm({ ...form, serviceChargePercent: e.target.value })
                }
                placeholder="10"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="modificationCharge">
                Modification Charge (CUP)
              </Label>
              <Input
                id="modificationCharge"
                type="number"
                value={form.modificationCharge}
                onChange={(e) =>
                  setForm({ ...form, modificationCharge: e.target.value })
                }
                placeholder="2000"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={updateTariff.isPending}>
                {updateTariff.isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  navigate({
                    to: "/dashboard/workspace/$workspaceId/event-rooms/pricing/tariffs",
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
