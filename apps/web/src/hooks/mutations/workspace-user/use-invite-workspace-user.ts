import inviteWorkspaceMember from "@/fetchers/workspace-user/invite-workspace-member";
import { useMutation } from "@tanstack/react-query";

function useInviteWorkspaceUser() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      email,
    }: { workspaceId: string; email: string }) =>
      inviteWorkspaceMember({ workspaceId, email }),
  });
}

export default useInviteWorkspaceUser;
