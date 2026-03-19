import type { Workspace } from "@/types/workspace";
import { create } from "zustand";

export type WorkspaceWithRole = Workspace & {
  currentUserRole?: "owner" | "member" | "viewer";
};

const useWorkspaceStore = create<{
  workspace: Workspace | undefined;
  currentUserRole: "owner" | "member" | "viewer" | undefined;
  setWorkspace: (updatedWorkspace: Workspace | undefined) => void;
  setCurrentUserRole: (role: "owner" | "member" | "viewer" | undefined) => void;
}>((set) => ({
  workspace: undefined,
  currentUserRole: undefined,
  setWorkspace: (updatedWorkspace) =>
    set(() => ({ workspace: updatedWorkspace })),
  setCurrentUserRole: (role) => set(() => ({ currentUserRole: role })),
}));

export default useWorkspaceStore;
