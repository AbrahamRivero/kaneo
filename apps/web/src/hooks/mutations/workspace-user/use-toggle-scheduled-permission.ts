import { useMutation } from "@tanstack/react-query";
import toggleScheduledPermission from "@/fetchers/workspace-user/toggle-scheduled-permission";

function useToggleScheduledPermission() {
  return useMutation({
    mutationFn: (data: {
      workspaceId: string;
      userId: string;
      permissionId: string;
      isActive: boolean;
    }) => toggleScheduledPermission(data),
  });
}

export default useToggleScheduledPermission;