import { useSortable } from "@dnd-kit/sortable";
import { useNavigate } from "@tanstack/react-router";
import { useUserPreferencesStore } from "@/store/user-preferences";
import { dueDateStatusColors, getDueDateStatus } from "@/lib/due-date-status";
import { format } from "date-fns";
import { CSS } from "@dnd-kit/utilities";
import {
  Calendar,
  CalendarClock,
  CalendarX,
  CheckCircle2,
  Hexagon,
  InfoIcon,
  Stars,
} from "lucide-react";
import type { CSSProperties } from "react";
import { ContextMenu, ContextMenuTrigger } from "../ui/context-menu";
import { cn } from "@/lib/cn";
import { StatusIcon } from "./status-icon";
import { Avatar, AvatarFallback } from "../ui/avatar";
import useProjectStore from "@/store/project";
import useWorkspaceStore from "@/store/workspace";
import type Task from "@/types/task";
import TaskCardContextMenuContent from "./task-card-context-menu/task-card-context-menu-content";
import TaskCardLabels from "./task-labels";

interface TaskCardProps {
  task: Task;
}

function TaskCard({ task }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  const { project } = useProjectStore();
  const { workspace } = useWorkspaceStore();
  const navigate = useNavigate();
  const { showDueDates, showLabels, showTaskNumbers } =
    useUserPreferencesStore();

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition:
      transition || "transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    opacity: isDragging ? 0.6 : 1,
    touchAction: "none",
    zIndex: isDragging ? 999 : "auto",
  };

  function handleTaskCardClick() {
    if (!project || !task || !workspace) return;

    navigate({
      to: "/dashboard/workspace/$workspaceId/project/$projectId/task/$taskId",
      params: {
        workspaceId: workspace.id,
        projectId: project.id,
        taskId: task.id,
      },
    });
  }

  const isCompleted = task.status === "completed";

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            onClick={handleTaskCardClick}
            className={cn(
              "group bg-background shrink-0 rounded-lg overflow-hidden border border-border cursor-move",
              isDragging
                ? "border-indigo-300 dark:border-indigo-600/70 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-400/5 bg-white dark:bg-zinc-800/80"
                : "border-zinc-200 dark:border-zinc-700/50 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md",
            )}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTaskCardClick();
            }}
          >
            <div className="px-3 py-2.5">
              {showTaskNumbers && (
                <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {project?.slug}-{task.number}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className="size-5 mt-0.5 shrink-0 flex items-center justify-center bg-muted rounded-sm p-1">
                  <StatusIcon statusId={task.status} />
                </div>
                <h3 className="text-sm font-medium leading-tight flex-1">
                  {task.title}
                </h3>
                {task.priority === "urgent" && !isCompleted && (
                  <Stars className="size-4 shrink-0 text-pink-500" />
                )}
                {task.priority === "high" && !isCompleted && (
                  <InfoIcon className="size-4 shrink-0 text-red-500" />
                )}
                {task.priority === "medium" && !isCompleted && (
                  <Hexagon className="size-4 shrink-0 text-cyan-500" />
                )}
                {isCompleted && (
                  <CheckCircle2 className="size-4 shrink-0 text-green-500" />
                )}
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {task.description}
              </p>

              {showLabels && <TaskCardLabels taskId={task.id} />}

              <div className="py-2.5 mt-1 border-t border-border border-dashed">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                    {showDueDates && (
                      <div
                        className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors ${
                          dueDateStatusColors[getDueDateStatus(task.dueDate)]
                        } group-hover:opacity-80`}
                      >
                        {getDueDateStatus(task.dueDate) === "overdue" && (
                          <CalendarX className="w-3 h-3" />
                        )}
                        {getDueDateStatus(task.dueDate) === "due-soon" && (
                          <CalendarClock className="w-3 h-3" />
                        )}
                        {(getDueDateStatus(task.dueDate) === "far-future" ||
                          getDueDateStatus(task.dueDate) === "no-due-date") && (
                          <Calendar className="w-3 h-3" />
                        )}
                        <span className="text-xs">
                          {task.dueDate
                            ? format(new Date(task.dueDate), "MMM d")
                            : "No due date"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex -space-x-2">
                    <Avatar
                      key={task.id}
                      className="size-5 border-2 border-background"
                    >
                      <AvatarFallback className="text-[10px] bg-purple-400 text-accent">
                        {task.assigneeName
                          ? task.assigneeName
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")
                          : "Usuario Desconocido"
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContextMenuTrigger>

        {project && workspace && (
          <TaskCardContextMenuContent
            task={task}
            taskCardContext={{
              projectId: project.id,
              worskpaceId: workspace.id,
            }}
          />
        )}
      </ContextMenu>
    </div>
  );
}

export default TaskCard;
