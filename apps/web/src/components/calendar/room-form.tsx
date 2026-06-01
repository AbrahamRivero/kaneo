import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useCreateEventRoom,
  useUpdateEventRoom,
} from "@/hooks/mutations/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";

const roomSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  capacity: z.number().min(1, { error: "Capacity must be at least 1" }),
  description: z.string().optional(),
  allowsMultipleReservations: z.boolean().optional(),
  hasAgeBasedPricing: z.boolean().optional(),
});

export type RoomFormData = z.infer<typeof roomSchema>;

interface RoomFormProps {
  workspaceId: string;
  roomId?: string;
  initialData?: {
    id: string;
    name: string;
    capacity: number;
    description?: string | null;
    allowsMultipleReservations?: boolean | null;
    hasAgeBasedPricing?: boolean | null;
  } | null;
  isLoadingData?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoomForm({
  workspaceId,
  roomId,
  initialData,
  isLoadingData,
  onSuccess,
  onCancel,
}: RoomFormProps) {
  const createRoom = useCreateEventRoom();
  const updateRoom = useUpdateEventRoom();

  const form = useForm<RoomFormData>({
    resolver: standardSchemaResolver(roomSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      description: "",
      allowsMultipleReservations: false,
      hasAgeBasedPricing: false,
    },
    values: initialData
      ? {
          name: initialData.name,
          capacity: initialData.capacity,
          description: initialData.description ?? "",
          allowsMultipleReservations:
            initialData.allowsMultipleReservations ?? false,
          hasAgeBasedPricing: initialData.hasAgeBasedPricing ?? false,
        }
      : undefined,
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      if (roomId) {
        await updateRoom.mutateAsync({
          id: roomId,
          payload: data,
        });
      } else {
        await createRoom.mutateAsync({
          workspaceId,
          ...data,
        });
      }
      onSuccess?.();
    } catch (error) {
      console.error(error);
    }
  });

  const isEditing = Boolean(roomId);
  const isPending = createRoom.isPending || updateRoom.isPending;

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
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Conference Room A"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">
              {form.formState.errors.name.message as string}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="capacity">Capacity</Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            placeholder="20"
            {...form.register("capacity", { valueAsNumber: true })}
          />
          {form.formState.errors.capacity && (
            <p className="text-xs text-destructive">
              {form.formState.errors.capacity.message as string}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            placeholder="Room description"
            {...form.register("description")}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <Label
              htmlFor="allowsMultipleReservations"
              className="text-sm font-medium"
            >
              Allow multiple reservations
            </Label>
            <span className="text-xs text-muted-foreground">
              Enable this to allow multiple reservations at the same time (e.g.,
              pool events)
            </span>
          </div>
          <Controller
            control={form.control}
            name="allowsMultipleReservations"
            render={({ field }) => (
              <Switch
                id="allowsMultipleReservations"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <div className="flex flex-col gap-1">
            <Label htmlFor="hasAgeBasedPricing" className="text-sm font-medium">
              Age-based pricing
            </Label>
            <span className="text-xs text-muted-foreground">
              Enable this to use different prices by age (e.g., pool tickets)
            </span>
          </div>
          <Controller
            control={form.control}
            name="hasAgeBasedPricing"
            render={({ field }) => (
              <Switch
                id="hasAgeBasedPricing"
                checked={field.value ?? false}
                onCheckedChange={field.onChange}
              />
            )}
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
          {isPending ? "Saving..." : isEditing ? "Save Changes" : "Create Room"}
        </Button>
      </div>
    </form>
  );
}
