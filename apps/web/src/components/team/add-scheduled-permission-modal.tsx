import useCreateScheduledPermission from "@/hooks/mutations/workspace-user/use-create-scheduled-permission";
import { SCHEDULED_ACTIONS } from "@/types/scheduled-permission";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

type Props = {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  userId: string;
  userName: string;
};

const scheduledPermissionSchema = z.object({
  action: z.enum(
    [
      "create_reservations",
      "edit_reservations",
      "delete_reservations",
      "create_services",
      "edit_services",
      "delete_services",
      "create_tariffs",
      "edit_tariffs",
      "delete_tariffs",
      "create_rooms",
      "edit_rooms",
      "delete_rooms",
      "create_tasks",
      "edit_tasks",
      "delete_tasks",
      "create_projects",
      "edit_projects",
      "delete_projects",
      "create_time_entries",
      "edit_time_entries",
      "delete_time_entries",
      "create_labels",
      "edit_labels",
      "delete_labels",
      "import_issues",
      "edit_github_integration",
      "manage_notifications",
      "edit_comments",
    ] as const,
    { message: "Please select an action" },
  ),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
});

type FormValues = z.infer<typeof scheduledPermissionSchema>;

function AddScheduledPermissionModal({
  open,
  onClose,
  workspaceId,
  userId,
  userName,
}: Props) {
  const { mutateAsync } = useCreateScheduledPermission();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: standardSchemaResolver(scheduledPermissionSchema),
    defaultValues: {
      action: "create_reservations",
      startTime: "17:00",
      endTime: "08:30",
    },
  });

  const onSubmit = async ({ action, startTime, endTime }: FormValues) => {
    try {
      const startDate = new Date();
      const [startHours, startMinutes] = startTime.split(":").map(Number);
      startDate.setHours(startHours, startMinutes, 0, 0);

      const endDate = new Date();
      const [endHours, endMinutes] = endTime.split(":").map(Number);
      endDate.setHours(endHours, endMinutes, 0, 0);

      await mutateAsync({
        workspaceId,
        userId,
        action,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
      });

      await queryClient.refetchQueries({
        queryKey: ["scheduled-permissions", workspaceId, userId],
      });

      form.reset();
      onClose();
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to create permission",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[360px] sm:max-w-[400px]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-base">
            Add Scheduled Permission for {userName}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="action"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 w-full text-sm">
                        <SelectValue placeholder="Select action" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SCHEDULED_ACTIONS.map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className="h-10 w-full text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="time"
                        {...field}
                        className="h-10 w-full text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Add Permission</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddScheduledPermissionModal;
