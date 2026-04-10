import { useMutation } from "@tanstack/react-query";
import createScheduledPermission from "@/fetchers/workspace-user/create-scheduled-permission";
import type { CreateScheduledPermissionRequest } from "@/types/scheduled-permission";

function useCreateScheduledPermission() {
  return useMutation({
    mutationFn: (data: CreateScheduledPermissionRequest) =>
      createScheduledPermission(data),
  });
}

export default useCreateScheduledPermission;