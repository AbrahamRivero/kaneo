import { and, desc, eq, isNotNull, ne } from "drizzle-orm";
import db from "../database";
import { projectTable, taskTable, userTable } from "../database/schema";

export interface OverdueTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: Date;
  daysOverdue: number;
}

export interface OverdueNotifications {
  tasks: OverdueTask[];
  total: number;
  byPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
}

async function getOverdueTasks(
  workspaceId: string,
): Promise<OverdueNotifications> {
  const now = new Date();

  const overdueTasksResult = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      status: taskTable.status,
      priority: taskTable.priority,
      projectId: taskTable.projectId,
      projectName: projectTable.name,
      assigneeId: taskTable.userId,
      assigneeName: userTable.name,
      dueDate: taskTable.dueDate,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        ne(taskTable.status, "completed"),
        isNotNull(taskTable.dueDate),
      ),
    )
    .orderBy(taskTable.dueDate);

  const tasks: OverdueTask[] = [];
  const byPriority = { urgent: 0, high: 0, medium: 0, low: 0 };

  for (const task of overdueTasksResult) {
    const dueDate = task.dueDate;
    if (!dueDate || dueDate >= now) continue;

    const daysOverdue = Math.floor(
      (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    tasks.push({
      id: task.id,
      title: task.title ?? "",
      status: task.status ?? "to-do",
      priority: task.priority ?? "low",
      projectId: task.projectId,
      projectName: task.projectName ?? "",
      assigneeId: task.assigneeId,
      assigneeName: task.assigneeName ?? null,
      dueDate,
      daysOverdue,
    });

    const priority = task.priority ?? "low";
    if (priority === "urgent") byPriority.urgent++;
    else if (priority === "high") byPriority.high++;
    else if (priority === "medium") byPriority.medium++;
    else byPriority.low++;
  }

  return {
    tasks,
    total: tasks.length,
    byPriority,
  };
}

export default getOverdueTasks;
