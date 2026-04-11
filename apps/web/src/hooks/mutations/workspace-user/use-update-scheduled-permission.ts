import { useMutation } from "@tanstack/react-query";
import updateScheduledPermission from "@/fetchers/workspace-user/update-scheduled-permission";
import type { UpdateScheduledPermissionRequest } from "@/types/scheduled-permission";

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
