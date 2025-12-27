"use client";

import { useTasksStore } from "@/store/tasks-store";
import { TaskColumn } from "./task-column";
import { DEFAULT_COLUMNS } from "@/lib/constants/columns";
import useGetTasks from "@/hooks/queries/task/use-get-tasks";
import { useUserPreferencesStore } from "@/store/user-preferences";
import { useState } from "react";
import useGetActiveWorkspaceUsers from "@/hooks/queries/workspace-users/use-active-workspace-users";
import { useTaskFilters } from "@/hooks/use-task-filters";

interface Props {
  workspaceId: string;
  projectId: string;
}

export function TaskBoard({ projectId, workspaceId }: Props) {
  const { tasksByStatus } = useTasksStore();

  const { data } = useGetTasks(projectId);
  const { viewMode } = useUserPreferencesStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const { data: users } = useGetActiveWorkspaceUsers({ workspaceId });
  const {
    showAssignees,
    showPriority,
    showDueDates,
    showLabels,
    showTaskNumbers,
    toggleAssignees,
    togglePriority,
    toggleDueDates,
    toggleLabels,
    toggleTaskNumbers,
  } = useUserPreferencesStore();

  const {
    filters,
    updateFilter,
    filteredProject,
    hasActiveFilters,
    clearFilters,
  } = useTaskFilters(data);
  return (
    <div className="flex h-full gap-3 px-3 pt-4 pb-2 min-w-max overflow-hidden">
      {DEFAULT_COLUMNS.map((status) => (
        <TaskColumn
          key={status.id}
          status={status}
          tasks={
            filteredProject?.columns?.find((col) => col.id === status.id)
              ?.tasks ?? []
          }
        />
      ))}
    </div>
  );
}
