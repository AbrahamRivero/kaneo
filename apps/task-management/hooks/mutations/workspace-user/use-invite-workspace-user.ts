import inviteWorkspaceMember from "@/lib/fetchers/workspace-user/invite-workspace-member";
import { useMutation } from "@tanstack/react-query";

function useInviteWorkspaceUser() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
    }: { workspaceId: string; userId: string }) =>
      inviteWorkspaceMember({ workspaceId, userId }),
  });
}

export default useInviteWorkspaceUser;
