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
import {
  useCreateEventRoom,
  useUpdateEventRoom,
} from "@/hooks/mutations/event-room";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod/v4";

const roomSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  capacity: z.number().min(1, { error: "Capacity must be at least 1" }),
  description: z.string().optional(),
});

export type EventRoomFormValues = {
  name: string
  capacity: number
  description?: string
}

interface RoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  room?: {
    id: string;
    name: string;
    capacity: number;
    description?: string | null;
  };
  isLoading?: boolean;
}

export function RoomDialog({
  open,
  onOpenChange,
  workspaceId,
  room,
  isLoading,
}: RoomDialogProps) {
  const createRoom = useCreateEventRoom();
  const updateRoom = useUpdateEventRoom();

  const form = useForm<EventRoomFormValues>({
    resolver: standardSchemaResolver(roomSchema),
    defaultValues: {
      name: room?.name ?? "",
      capacity: room?.capacity ?? 0,
      description: room?.description ?? ""
    }
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (room) {
      form.reset({
        name: room.name,
        capacity: room.capacity,
        description: room.description ?? "",
      });
    } else {
       form.reset({ name: "", capacity: 0, description: "" });
    }
  }, [room, open]);

  const onSubmitHandler = async (formData: EventRoomFormValues) => {
    try {
      if (room?.id) {
        await updateRoom.mutateAsync({
          id: room.id,
          payload: {
            name: formData.name,
            capacity: formData.capacity,
            description: formData.description,
          },
        });
      } else {
        await createRoom.mutateAsync({
          workspaceId,
          name: formData.name,
          capacity: formData.capacity,
          description: formData.description,
        });
      }
      onOpenChange(false);
      form.reset()
    } catch (err) {
      console.log(err instanceof Error ? err.message : "An error occurred");
    }
  };

  const isEditing = Boolean(room) && !isLoading;
  const title = isLoading ? "Loading…" : isEditing ? "Edit Room" : "Create New Room";
  const description = isLoading
    ? "Fetching room details…"
    : isEditing
    ? "Update the room details below."
    : "Add a new event room for your workspace.";

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
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
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmitHandler)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Conference Room A"
                {...form.register("name")}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                placeholder="20"
                {...form.register("capacity", {
                  valueAsNumber: true,
                })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                placeholder="Room description"
                {...form.register("description")}
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
            <Button type="submit">
              {isEditing ? "Save Changes" : "Create Room"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
