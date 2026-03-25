import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateRoomTariff,
  useUpdateRoomTariff,
} from "@/hooks/mutations/event-room";
import { useGetEventRooms } from "@/hooks/queries/event-room";
import type { SessionType } from "@/types/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";

type SelectOption = { value: string; label: string };

const sessionTypeOptions: SelectOption[] = [
  { value: "half_session", label: "Half Session" },
  { value: "full_session", label: "Full Session" },
  { value: "social_event", label: "Social Event" },
  { value: "flat", label: "Flat Rate" },
];

const roomTariffSchema = z.object({
  eventRoomId: z.string().min(1, { error: "Room is required" }),
  sessionType: z.enum(["half_session", "full_session", "social_event", "flat"]),
  price: z.string().optional(),
  serviceChargePercent: z
    .string()
    .min(1, { error: "Service charge is required" }),
  modificationCharge: z
    .string()
    .min(1, { error: "Modification charge is required" }),
});

export type RoomTariffFormData = {
  eventRoomId: string;
  sessionType: SessionType;
  price?: string;
  serviceChargePercent: string;
  modificationCharge: string;
};

interface RoomTariffFormProps {
  workspaceId: string;
  tariffId?: string;
  initialData?: {
    id: string;
    eventRoomId: string;
    sessionType: SessionType;
    price: number | null;
    serviceChargePercent: number;
    modificationCharge: number;
  } | null;
  isLoadingData?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoomTariffForm({
  workspaceId,
  tariffId,
  initialData,
  isLoadingData,
  onSuccess,
  onCancel,
}: RoomTariffFormProps) {
  const { data: eventRooms = [] } = useGetEventRooms(workspaceId);
  const createTariff = useCreateRoomTariff();
  const updateTariff = useUpdateRoomTariff();

  const form = useForm<RoomTariffFormData>({
    resolver: standardSchemaResolver(roomTariffSchema),
    defaultValues: {
      eventRoomId: "",
      sessionType: "half_session",
      price: "",
      serviceChargePercent: "10",
      modificationCharge: "2000",
    },
    values: initialData
      ? {
          eventRoomId: initialData.eventRoomId,
          sessionType: initialData.sessionType,
          price: initialData.price?.toString() ?? "",
          serviceChargePercent: initialData.serviceChargePercent.toString(),
          modificationCharge: initialData.modificationCharge.toString(),
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const payload = {
      workspaceId,
      eventRoomId: data.eventRoomId,
      sessionType: data.sessionType,
      price: data.price ? Number(data.price) : null,
      serviceChargePercent: Number(data.serviceChargePercent),
      modificationCharge: Number(data.modificationCharge),
      isActive: true,
    };

    try {
      if (tariffId) {
        await updateTariff.mutateAsync({ id: tariffId, payload });
      } else {
        await createTariff.mutateAsync(payload);
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  });

  const isEditing = Boolean(tariffId);
  const isPending = createTariff.isPending || updateTariff.isPending;

  if (isLoadingData) {
    return (
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-28 bg-muted rounded animate-pulse" />
          <div className="h-10 w-full bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="eventRoomId">Room</Label>
          <Controller
            control={form.control}
            name="eventRoomId"
            render={({ field }) => {
              const roomItems: SelectOption[] = eventRooms.map((room) => ({
                value: room.id,
                label: room.name,
              }));
              const selectedRoom = roomItems.find(
                (r) => r.value === field.value,
              );
              return (
                <Combobox
                  value={selectedRoom ?? null}
                  onValueChange={(val) => field.onChange(val?.value ?? "")}
                  items={roomItems}
                  itemToStringValue={(item) => item?.label ?? ""}
                >
                  <ComboboxInput placeholder="Select room" showClear />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxEmpty>No room found</ComboboxEmpty>
                      {roomItems.map((room) => (
                        <ComboboxItem key={room.value} value={room}>
                          {room.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              );
            }}
          />
          {form.formState.errors.eventRoomId && (
            <p className="text-xs text-destructive">
              {form.formState.errors.eventRoomId.message as string}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="sessionType">Session Type</Label>
          <Controller
            control={form.control}
            name="sessionType"
            render={({ field }) => {
              const selectedOption = sessionTypeOptions.find(
                (o) => o.value === field.value,
              );
              return (
                <Combobox
                  value={selectedOption ?? null}
                  onValueChange={(val) => field.onChange(val?.value ?? "")}
                  items={sessionTypeOptions}
                  itemToStringValue={(item) => item?.label ?? ""}
                >
                  <ComboboxInput placeholder="Select session type" showClear />
                  <ComboboxContent>
                    <ComboboxList>
                      {sessionTypeOptions.map((option) => (
                        <ComboboxItem key={option.value} value={option}>
                          {option.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              );
            }}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="price">Price (CUP)</Label>
          <Input
            id="price"
            type="number"
            placeholder="0.00"
            {...form.register("price")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="serviceChargePercent">Service Charge %</Label>
          <Input
            id="serviceChargePercent"
            type="number"
            placeholder="10"
            {...form.register("serviceChargePercent")}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="modificationCharge">Modification Charge (CUP)</Label>
          <Input
            id="modificationCharge"
            type="number"
            placeholder="2000"
            {...form.register("modificationCharge")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : isEditing
              ? "Save Changes"
              : "Create Tariff"}
        </Button>
      </div>
    </form>
  );
}
