import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  useCreateEventRoom,
  useUpdateEventRoom,
} from "@/hooks/mutations/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod/v4";

const roomSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  capacity: z.number().min(1, { error: "Capacity must be at least 1" }),
  description: z.string().optional(),
  allowsMultipleReservations: z.boolean().optional(),
});

type RoomFormData = z.infer<typeof roomSchema>;

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  roomId?: string | null;
  initialData?: {
    id: string;
    name: string;
    capacity: number;
    description?: string | null;
    allowsMultipleReservations?: boolean | null;
  } | null;
  isLoadingData?: boolean;
}

export function RoomDialog({
  open,
  onOpenChange,
  workspaceId,
  roomId,
  initialData,
  isLoadingData,
}: RoomDialogProps) {
  const createRoom = useCreateEventRoom();
  const updateRoom = useUpdateEventRoom();

  const form = useForm<RoomFormData>({
    resolver: standardSchemaResolver(roomSchema),
    defaultValues: {
      name: "",
      capacity: 0,
      description: "",
      allowsMultipleReservations: false,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        capacity: initialData.capacity,
        description: initialData.description ?? "",
        allowsMultipleReservations:
          initialData.allowsMultipleReservations ?? false,
      });
    }
  }, [initialData, form]);

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
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error(error);
    }
  });

  const isEditing = Boolean(roomId);
  const isLoading = isLoadingData;
  const isPending = createRoom.isPending || updateRoom.isPending;

  const title = isLoading
    ? "Loading..."
    : isEditing
      ? "Edit Room"
      : "Create New Room";

  const descriptionText = isLoading
    ? "Fetching room details..."
    : isEditing
      ? "Update the room details below."
      : "Add a new event room for your workspace.";

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{descriptionText}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{descriptionText}</DialogDescription>
        </DialogHeader>
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
                  Enable this to allow multiple reservations at the same time
                  (e.g., pool events)
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
