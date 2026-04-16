import updateScheduledPermission from "@/fetchers/workspace-user/update-scheduled-permission";
import type { UpdateScheduledPermissionRequest } from "@/types/scheduled-permission";
import { useMutation } from "@tanstack/react-query";

function useUpdateScheduledPermission() {
  return useMutation({
    mutationFn: (
      data: UpdateScheduledPermissionRequest & {
        workspaceId: string;
        userId: string;
        permissionId: string;
      },
    ) => updateScheduledPermission(data),
  });
}

export default useUpdateScheduledPermission;
