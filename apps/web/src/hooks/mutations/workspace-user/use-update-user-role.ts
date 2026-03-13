import updateUserRole from "@/fetchers/workspace-user/update-user-role";
import { useMutation } from "@tanstack/react-query";

function useUpdateUserRole() {
  return useMutation({
    mutationFn: ({
      workspaceId,
      userId,
      role,
    }: {
      workspaceId: string;
      userId: string;
      role: "owner" | "member" | "viewer";
    }) => updateUserRole({ workspaceId, userId, role }),
  });
}

export default useUpdateUserRole;
