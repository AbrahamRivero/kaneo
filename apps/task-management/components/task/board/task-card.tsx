"use client";

import { Calendar, CheckCircle, InfoIcon, Hexagon, Stars } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import "react-circular-progressbar/dist/styles.css";
import type Task from "@/lib/types/task";
import { StatusIcon } from "@/mock-data/statuses";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const isCompleted = task.status === "completed";

  return (
    <div className="bg-background shrink-0 rounded-lg overflow-hidden border border-border">
      <div className="px-3 py-2.5">
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
            <CheckCircle className="size-4 shrink-0 text-green-500" />
          )}
        </div>

        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
          {task.description}
        </p>

        {/*   {task.labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {task.labels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className={cn(
                  "text-[10px] px-1.5 py-0.5 font-medium",
                  label.color
                )}
              >
                {label.name}
              </Badge>
            ))}
          </div>
        )} */}
      </div>

      <div className="px-3 py-2.5 border-t border-border border-dashed">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {task.dueDate && (
              <div className="flex items-center gap-1.5 border border-border rounded-sm py-1 px-2">
                <Calendar className="size-3" />
                <span>{task.dueDate}</span>
              </div>
            )}
            {/* {task.comments > 0 && (
              <div className="flex items-center gap-1.5 border border-border rounded-sm py-1 px-2">
                <MessageSquare className="size-3" />
                <span>{task.comments}</span>
              </div>
            )}
            {task.attachments > 0 && (
              <div className="flex items-center gap-1.5 border border-border rounded-sm py-1 px-2">
                <FileText className="size-3" />
                <span>{task.attachments}</span>
              </div>
            )}
            {task.links > 0 && (
              <div className="flex items-center gap-1.5 border border-border rounded-sm py-1 px-2">
                <Link className="size-3" />
                <span>{task.links}</span>
              </div>
            )} */}
          </div>

          <div className="flex -space-x-2">
            <Avatar key={task.id} className="size-5 border-2 border-background">
              <AvatarFallback className="text-[10px]">
                {task.assigneeName
                  ? task.assigneeName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "Usuario Desconocido"
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </div>
  );
}
