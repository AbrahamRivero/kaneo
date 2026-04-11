import { useMutation } from "@tanstack/react-query";
import deleteScheduledPermission from "@/fetchers/workspace-user/delete-scheduled-permission";

function useDeleteScheduledPermission() {
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      userId: string;
      permissionId: string;
    }) => deleteScheduledPermission(data),
  });
}

export default useDeleteScheduledPermission;
