import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/cn";
import {
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ListFilter,
} from "lucide-react";
import { useState } from "react";

const PAGE_SIZES = [5, 10, 15, 25];

export interface PeriodTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectName: string;
  assigneeName: string | null;
  createdAt: string;
  dueDate: string | null;
  isOverdue: boolean;
}

interface PeriodTasksTableProps {
  tasks: PeriodTask[];
}

const priorityConfig: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  urgent: {
    label: "Urgent",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
    dot: "bg-red-500",
  },
  high: {
    label: "High",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-500",
  },
};

const statusConfig: Record<
  string,
  { label: string; className: string; dot: string }
> = {
  backlog: {
    label: "Backlog",
    className:
      "bg-abbey-600/10 text-abbey-600 dark:text-abbey-400 border-abbey-600/20 dark:border-abbey-400/20",
    dot: "bg-abbey-600 dark:bg-abbey-400",
  },
  "to-do": {
    label: "To Do",
    className:
      "bg-zinc-500/10 text-zinc-400 dark:text-zinc-500 border-zinc-500/20 dark:border-zinc-500/20",
    dot: "bg-zinc-400 dark:bg-zinc-500",
  },
  "in-progress": {
    label: "In Progress",
    className:
      "bg-yellow-500/10 text-yellow-500 dark:text-yellow-400 border-yellow-500/20 dark:border-yellow-400/20",
    dot: "bg-yellow-500 dark:bg-yellow-400",
  },
  "technical-review": {
    label: "Technical Review",
    className:
      "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20 dark:border-emerald-400/20",
    dot: "bg-emerald-500 dark:bg-emerald-400",
  },
  archived: {
    label: "Archived",
    className:
      "bg-picton-blue-500/10 text-picton-blue-500 dark:text-picton-blue-600 border-picton-blue-500/20 dark:border-picton-blue-600/20",
    dot: "bg-picton-blue-500 dark:bg-picton-blue-600",
  },
  completed: {
    label: "Completed",
    className:
      "bg-medium-purple-500/10 text-medium-purple-500 dark:text-medium-purple-400 border-medium-purple-500/20 dark:border-medium-purple-400/20",
    dot: "bg-medium-purple-500 dark:bg-medium-purple-400",
  },
};

function StatusBadge({
  value,
  config,
}: {
  value: string;
  config: Record<string, { label: string; className: string; dot: string }>;
}) {
  const cfg = config[value] ?? {
    label: value,
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground/50",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        cfg.className,
      )}
    >
      <span className={cn("size-1.5 shrink-0 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function PeriodTasksTable({ tasks }: PeriodTasksTableProps) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(tasks.length / pageSize);
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  if (tasks.length === 0) {
    return (
      <div className="flex h-80 flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border/60 bg-muted/30">
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <ListFilter className="size-5 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">No tasks found</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Tasks for this period will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          <span className="font-medium text-foreground">
            {(currentPage - 1) * pageSize + 1}
            &ndash;
            {Math.min(currentPage * pageSize, tasks.length)}
          </span>{" "}
          of <span className="font-medium text-foreground">{tasks.length}</span>{" "}
          tasks
        </p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 w-[130px] rounded-lg border-border/60 text-xs">
            <SelectValue placeholder="Rows per page" />
          </SelectTrigger>
          <SelectContent align="end">
            {PAGE_SIZES.map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size} per page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border/60">
        <Table>
          <TableHeader>
            <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Task
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Project
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Priority
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Due Date
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTasks.map((task, index) => (
              <TableRow
                key={task.id}
                className={cn(
                  "border-border/40 transition-colors hover:bg-muted/30",
                  index % 2 === 0 ? "bg-card" : "bg-card/60",
                )}
              >
                <TableCell className="px-4 py-3.5">
                  <span className="font-medium text-foreground">
                    {task.title}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="text-muted-foreground">
                    {task.projectName}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusBadge value={task.priority} config={priorityConfig} />
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <StatusBadge value={task.status} config={statusConfig} />
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  {task.dueDate ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 text-sm",
                        task.isOverdue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {task.isOverdue && (
                        <AlertCircle className="size-3.5 shrink-0" />
                      )}
                      {!task.isOverdue && (
                        <Calendar className="size-3.5 shrink-0 text-muted-foreground/60" />
                      )}
                      {new Date(task.dueDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      {task.isOverdue && (
                        <span className="ml-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                          Overdue
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">&mdash;</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/60"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "size-8 rounded-lg text-xs font-medium",
                    currentPage === pageNum
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="icon"
              className="size-8 rounded-lg border-border/60"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
