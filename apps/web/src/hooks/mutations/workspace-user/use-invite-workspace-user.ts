import inviteWorkspaceMember from "@/fetchers/workspace-user/invite-workspace-member";
import { useMutation } from "@tanstack/react-query";

function useInviteWorkspaceUser() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      email,
      role,
    }: {
      workspaceId: string;
      email: string;
      role?: "owner" | "member" | "viewer";
    }) => inviteWorkspaceMember({ workspaceId, email, role }),
  });
}

export default useInviteWorkspaceUser;
