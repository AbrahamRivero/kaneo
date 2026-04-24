import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useCreateAgeGroupTariff,
  useUpdateAgeGroupTariff,
} from "@/hooks/mutations/event-room";
import { useGetEventRooms } from "@/hooks/queries/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Controller, useForm } from "react-hook-form";
import { Calendar as CalendarIcon } from "lucide-react";
import { z } from "zod/v4";

const ageGroupTariffSchema = z.object({
  eventRoomId: z.string().min(1, { error: "Room is required" }),
  minAge: z.string().min(1, { error: "Minimum age is required" }),
  maxAge: z.string().optional(),
  price: z.string().min(1, { error: "Price is required" }),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
});

export type AgeGroupTariffFormData = {
  eventRoomId: string;
  minAge: string;
  maxAge?: string;
  price: string;
  validFrom?: string;
  validTo?: string;
};

function parseDateString(value: string): Date {
  const datePart = value.split("T")[0];
  const [year, month, day] = datePart.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateInputString(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateInputValue(value?: string | null): string {
  if (!value) return "";
  const date = parseDateString(value);
  if (Number.isNaN(date.getTime())) return "";
  return toDateInputString(date);
}

function formatDateLabel(value?: string): string {
  if (!value) return "";
  const date = parseDateString(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface AgeGroupTariffFormProps {
  workspaceId: string;
  tariffId?: string;
  initialData?: {
    id: string;
    eventRoomId: string;
    name: string;
    minAge: number;
    maxAge: number | null;
    price: number;
    validFrom?: string;
    validTo?: string;
  } | null;
  isLoadingData?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgeGroupTariffForm({
  workspaceId,
  tariffId,
  initialData,
  isLoadingData,
  onSuccess,
  onCancel,
}: AgeGroupTariffFormProps) {
  const { data: eventRooms = [] } = useGetEventRooms(workspaceId);
  const createTariff = useCreateAgeGroupTariff();
  const updateTariff = useUpdateAgeGroupTariff();

  const form = useForm<AgeGroupTariffFormData>({
    resolver: standardSchemaResolver(ageGroupTariffSchema),
    defaultValues: {
      eventRoomId: "",
      minAge: "",
      maxAge: "",
      price: "",
      validFrom: "",
      validTo: "",
    },
    values: initialData
      ? {
          eventRoomId: initialData.eventRoomId,
          minAge: initialData.minAge.toString(),
          maxAge: initialData.maxAge?.toString() ?? "",
          price: initialData.price.toString(),
          validFrom: formatDateInputValue(initialData.validFrom),
          validTo: formatDateInputValue(initialData.validTo),
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    const payload = {
      workspaceId,
      eventRoomId: data.eventRoomId,
      minAge: Number(data.minAge),
      maxAge: data.maxAge ? Number(data.maxAge) : null,
      price: Number(data.price),
      validFrom: data.validFrom || undefined,
      validTo: data.validTo || undefined,
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
              const roomItems = eventRooms.map((room) => ({
                value: room.id,
                label: room.name,
              }));
              const selectedRoom = roomItems.find((r) => r.value === field.value);
              return (
                <Combobox
                  value={selectedRoom ?? null}
                  onValueChange={(val) => field.onChange(val?.value ?? "")}
                  items={roomItems}
                  itemToStringValue={(item) => item?.label ?? ""}
                >
                  <ComboboxInput placeholder="Select a room" showClear />
                  <ComboboxContent>
                    <ComboboxList>
                      <ComboboxEmpty>No rooms found</ComboboxEmpty>
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
            <p className="text-sm text-red-500">
              {form.formState.errors.eventRoomId.message as string}
            </p>
          )}
        </div>

        <div className="grid gap-2">
          <Label>Tariff Name (Auto-derived)</Label>
          <div className="flex items-center h-10 px-3 rounded-md border border-input bg-muted text-sm font-medium">
            {(() => {
              const minAge = Number(form.watch("minAge")) || 0;
              const maxAge = form.watch("maxAge") ? Number(form.watch("maxAge")) : null;
              if (minAge >= 13) return "Adult";
              if (minAge >= 5 && (maxAge === null || maxAge <= 12)) return "Child";
              if (minAge >= 0 && (maxAge === null || maxAge <= 4)) return "Infant";
              return maxAge !== null ? `${minAge}-${maxAge}` : `${minAge}+`;
            })()}
          </div>
          <span className="text-xs text-muted-foreground">
            Name is automatically derived from age range
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="minAge">Min Age (years)</Label>
            <Input
              id="minAge"
              type="number"
              placeholder="0"
              {...form.register("minAge")}
            />
            {form.formState.errors.minAge && (
              <p className="text-sm text-red-500">
                {form.formState.errors.minAge.message as string}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="maxAge">Max Age (years)</Label>
            <Input
              id="maxAge"
              type="number"
              placeholder="Leave empty for no limit"
              {...form.register("maxAge")}
            />
            {form.formState.errors.maxAge && (
              <p className="text-sm text-red-500">
                {form.formState.errors.maxAge.message as string}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="price">Price (CUP)</Label>
          <Input
            id="price"
            type="number"
            placeholder="2500"
            {...form.register("price")}
          />
          {form.formState.errors.price && (
            <p className="text-sm text-red-500">
              {form.formState.errors.price.message as string}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="validFrom">Valid From</Label>
            <Controller
              control={form.control}
              name="validFrom"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary"
                    >
                      <span>
                        {field.value
                          ? formatDateLabel(field.value)
                          : "Pick a start date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseDateString(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? toDateInputString(date) : "")
                      }
                      className="w-auto border-none"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <span className="text-xs text-muted-foreground">
              Leave empty to start immediately
            </span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="validTo">Valid To</Label>
            <Controller
              control={form.control}
              name="validTo"
              render={({ field }) => (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm text-foreground transition-colors hover:border-primary"
                    >
                      <span>
                        {field.value
                          ? formatDateLabel(field.value)
                          : "Pick an end date"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseDateString(field.value) : undefined}
                      onSelect={(date) =>
                        field.onChange(date ? toDateInputString(date) : "")
                      }
                      className="w-auto border-none"
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            />
            <span className="text-xs text-muted-foreground">
              Leave empty for no expiration
            </span>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? "Saving..."
            : isEditing
              ? "Update Tariff"
              : "Create Tariff"}
        </Button>
      </div>
    </form>
  );
}