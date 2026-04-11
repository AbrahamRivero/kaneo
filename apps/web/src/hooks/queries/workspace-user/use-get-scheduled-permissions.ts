import { useQuery } from "@tanstack/react-query";
import type { ScheduledPermission } from "@/types/scheduled-permission";
import getScheduledPermissions from "@/fetchers/workspace-user/get-scheduled-permissions";

function useGetScheduledPermissions({
  workspaceId,
  userId,
}: {
  workspaceId: string;
  userId: string;
}) {
  return useQuery({
    queryKey: ["scheduled-permissions", workspaceId, userId],
    queryFn: () => getScheduledPermissions({ workspaceId, userId }),
    enabled: !!workspaceId && !!userId,
  });
}

export default useGetScheduledPermissions;

export type { ScheduledPermission };
