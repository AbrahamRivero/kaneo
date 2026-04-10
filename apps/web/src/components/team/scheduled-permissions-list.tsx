import useDeleteScheduledPermission from "@/hooks/mutations/workspace-user/use-delete-scheduled-permission";
import useGetScheduledPermissions from "@/hooks/queries/workspace-user/use-get-scheduled-permissions";
import { formatActionLabel, type ScheduledAction } from "@/types/scheduled-permission";
import { useQueryClient } from "@tanstack/react-query";
import { Clock, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Props = {
  workspaceId: string;
  userId: string;
  onAddNew: () => void;
};

function ScheduledPermissionsList({ workspaceId, userId, onAddNew }: Props) {
  const { data: permissions, isLoading } = useGetScheduledPermissions({
    workspaceId,
    userId,
  });

  const { mutateAsync: deletePermission } = useDeleteScheduledPermission();
  const queryClient = useQueryClient();

  const handleDelete = async (permissionId: string) => {
    try {
      await deletePermission({
        workspaceId,
        userId,
        permissionId,
      });
      await queryClient.refetchQueries({
        queryKey: ["scheduled-permissions", workspaceId, userId],
      });
      toast.success("Permission deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete permission");
    }
  };

  if (isLoading) {
    return <span className="text-xs text-muted-foreground">Loading...</span>;
  }

  if (!permissions || permissions.length === 0) {
    return (
      <button
        type="button"
        onClick={onAddNew}
        className="text-xs text-primary hover:underline"
      >
        + Add scheduled permission
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {permissions.map((permission) => (
        <div
          key={permission.id}
          className="flex items-center justify-between gap-2 text-xs bg-muted/50 px-2 py-1.5 rounded"
        >
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="font-medium">{formatActionLabel(permission.action as ScheduledAction)}</span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>
                {new Date(permission.startTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} -{" "}
                {new Date(permission.endTime).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleDelete(permission.id)}
            className="p-1 hover:bg-destructive/10 rounded text-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={onAddNew}
        className="text-xs text-primary hover:underline"
      >
        + Add another
      </button>
    </div>
  );
}

export default ScheduledPermissionsList;