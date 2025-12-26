import type { ProjectWithTasks } from "@/lib/types/project";
import { create } from "zustand";

export enum ProjectStatus {
  INPROGRESS = "in-progress",
  COMPLETED = "completed",
  INACTIVE = "inactive",
}

const useProjectStore = create<{
  project: ProjectWithTasks | undefined;
  setProject: (updatedProject: ProjectWithTasks | undefined) => void;
  searchQuery: string;
  statusFilter: ProjectStatus | "all";
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: ProjectStatus | "all") => void;
  clearAllFilters: () => void;
}>((set) => ({
  project: undefined,
  setProject: (updatedProject) => set(() => ({ project: updatedProject })),
  searchQuery: "",
  statusFilter: "all",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  clearAllFilters: () =>
    set({
      searchQuery: "",
      statusFilter: "all",
      project: undefined,
    }),
}));

export default useProjectStore;
