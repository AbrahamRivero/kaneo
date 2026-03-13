import { useAuth } from "@/components/providers/auth-provider/hooks/use-auth";
import useWorkspaceStore from "@/store/workspace";

export type PermissionLevel = "owner" | "member" | "viewer";

export function useWorkspacePermission() {
  const { workspace } = useWorkspaceStore();
  const { user } = useAuth();

  const isOwner = workspace?.ownerId === user?.id;

  const currentUserRole = workspace?.currentUserRole as
    | "owner"
    | "member"
    | "viewer"
    | undefined;

  const isViewer = currentUserRole === "viewer";

  const checkPermission = (
    requiredRole: PermissionLevel = "member",
  ): boolean => {
    if (!workspace || !user) return false;

    if (requiredRole === "owner") {
      return isOwner;
    }

    if (requiredRole === "viewer") {
      return (
        isOwner || currentUserRole === "member" || currentUserRole === "viewer"
      );
    }

    return isOwner || currentUserRole === "member";
  };

  return {
    isOwner,
    isViewer,
    currentUserRole,
    checkPermission,
  };
}
