import { and, count, desc, eq, gte, lt, lte, sql } from "drizzle-orm";
import db from "../database";
import { projectTable, taskTable, userTable } from "../database/schema";

export type DateRange =
  | "this-month"
  | "last-month"
  | "last-30-days"
  | "this-quarter"
  | "this-week";

export interface QueryParams {
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
}

export interface AnalyticsData {
  period: {
    start: Date;
    end: Date;
    label: string;
  };
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueTasks: number;
    dueSoonTasks: number;
    avgTasksPerDay: number;
  };
  trends: {
    totalTasksChange: number;
    completionRateChange: number;
    completedTasksChange: number;
  };
  tasksByStatus: {
    completed: number;
    todo: number;
    inProgress: number;
    technicalReview: number;
  };
  tasksByProject: Array<{
    projectName: string;
    projectId: string;
    count: number;
    completionRate: number;
  }>;
  tasksByAssignee: Array<{
    userId: string;
    userName: string;
    totalAssigned: number;
    completed: number;
    completionRate: number;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    projectName: string;
    assigneeName: string | null;
    createdAt: Date;
    dueDate: Date | null;
    isOverdue: boolean;
  }>;
}

function getDateRange(
  range: DateRange | undefined,
  startDate?: string,
  endDate?: string,
): { start: Date; end: Date; label: string } {
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );

  if (startDate && endDate) {
    return {
      start: new Date(startDate),
      end: new Date(endDate),
      label: "Custom",
    };
  }

  switch (range) {
    case "this-week": {
      const start = new Date(now);
      start.setDate(now.getDate() - now.getDay());
      start.setHours(0, 0, 0, 0);
      return { start, end: today, label: "This Week" };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end, label: "Last Month" };
    }
    case "last-30-days": {
      const start = new Date(now);
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end: today, label: "Last 30 Days" };
    }
    case "this-quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      return { start, end: today, label: "This Quarter" };
    }
    case "this-month":
    default: {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end: today, label: "This Month" };
    }
  }
}

function getPreviousPeriod(start: Date, end: Date): { start: Date; end: Date } {
  const diff = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - diff - 1),
    end: new Date(start.getTime() - 1),
  };
}

async function getAnalytics(
  workspaceId: string,
  query?: QueryParams,
): Promise<AnalyticsData> {
  const period = getDateRange(
    query?.dateRange,
    query?.startDate,
    query?.endDate,
  );
  const previousPeriod = getPreviousPeriod(period.start, period.end);
  const now = new Date();

  const tasksInPeriodResult = await db
    .select({
      status: taskTable.status,
      priority: taskTable.priority,
      dueDate: taskTable.dueDate,
      userId: taskTable.userId,
      projectId: taskTable.projectId,
      projectName: projectTable.name,
      createdAt: taskTable.createdAt,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(and(eq(projectTable.workspaceId, workspaceId)));

  const tasksInPeriod = tasksInPeriodResult.filter(
    (t) => t.createdAt >= period.start && t.createdAt <= period.end,
  );

  const tasksPreviousPeriod = tasksInPeriodResult.filter(
    (t) =>
      t.createdAt >= previousPeriod.start && t.createdAt <= previousPeriod.end,
  );

  const tasksByStatus: AnalyticsData["tasksByStatus"] = {
    completed: 0,
    todo: 0,
    inProgress: 0,
    technicalReview: 0,
  };

  let overdueTasks = 0;
  let dueSoonTasks = 0;
  const tasksByProjectMap = new Map<
    string,
    { name: string; total: number; completed: number }
  >();
  const tasksByAssigneeMap = new Map<
    string,
    { name: string; total: number; completed: number }
  >();
  const recentTasksData: AnalyticsData["recentTasks"] = [];

  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const task of tasksInPeriod) {
    if (!task.status) continue;

    switch (task.status) {
      case "completed":
        tasksByStatus.completed++;
        break;
      case "to-do":
        tasksByStatus.todo++;
        break;
      case "in-progress":
        tasksByStatus.inProgress++;
        break;
      case "technical-review":
        tasksByStatus.technicalReview++;
        break;
    }

    if (task.status !== "completed") {
      if (task.dueDate && task.dueDate < now) {
        overdueTasks++;
      } else if (task.dueDate && task.dueDate <= sevenDaysFromNow) {
        dueSoonTasks++;
      }
    }

    const projectKey = task.projectId;
    if (!tasksByProjectMap.has(projectKey)) {
      tasksByProjectMap.set(projectKey, {
        name: task.projectName,
        total: 0,
        completed: 0,
      });
    }
    const projectData = tasksByProjectMap.get(projectKey)!;
    projectData.total++;
    if (task.status === "completed") projectData.completed++;

    if (task.userId) {
      if (!tasksByAssigneeMap.has(task.userId)) {
        tasksByAssigneeMap.set(task.userId, {
          name: "Unknown",
          total: 0,
          completed: 0,
        });
      }
      const userData = tasksByAssigneeMap.get(task.userId)!;
      userData.total++;
      if (task.status === "completed") userData.completed++;
    }
  }

  const userIds = Array.from(tasksByAssigneeMap.keys());
  if (userIds.length > 0) {
    const usersResult = await db
      .select({ id: userTable.id, name: userTable.name })
      .from(userTable)
      .where(eq(userTable.id, userIds[0] as string));

    for (const user of usersResult) {
      if (tasksByAssigneeMap.has(user.id)) {
        tasksByAssigneeMap.get(user.id)!.name = user.name ?? "Unknown";
      }
    }
  }

  const tasksByProject: AnalyticsData["tasksByProject"] = Array.from(
    tasksByProjectMap.entries(),
  ).map(([projectId, data]) => ({
    projectId,
    projectName: data.name,
    count: data.total,
    completionRate:
      data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  const tasksByAssignee: AnalyticsData["tasksByAssignee"] = Array.from(
    tasksByAssigneeMap.entries(),
  ).map(([userId, data]) => ({
    userId,
    userName: data.name,
    totalAssigned: data.total,
    completed: data.completed,
    completionRate:
      data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  const recentTasksResult = await db
    .select({
      id: taskTable.id,
      title: taskTable.title,
      status: taskTable.status,
      priority: taskTable.priority,
      projectName: projectTable.name,
      assigneeName: userTable.name,
      createdAt: taskTable.createdAt,
      dueDate: taskTable.dueDate,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(eq(projectTable.workspaceId, workspaceId))
    .orderBy(desc(taskTable.createdAt))
    .limit(15);

  for (const task of recentTasksResult) {
    recentTasksData.push({
      id: task.id,
      title: task.title,
      status: task.status ?? "to-do",
      priority: task.priority ?? "low",
      projectName: task.projectName,
      assigneeName: task.assigneeName ?? null,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      isOverdue: task.dueDate
        ? task.dueDate < now && task.status !== "completed"
        : false,
    });
  }

  const totalTasks = tasksInPeriod.length;
  const completedTasks = tasksByStatus.completed;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTasksPrevious = tasksPreviousPeriod.length;
  const completedTasksPrevious = tasksPreviousPeriod.filter(
    (t) => t.status === "completed",
  ).length;
  const completionRatePrevious =
    totalTasksPrevious > 0
      ? Math.round((completedTasksPrevious / totalTasksPrevious) * 100)
      : 0;

  const daysDiff = Math.max(
    1,
    Math.ceil(
      (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const avgTasksPerDay =
    totalTasks > 0 ? Math.round((completedTasks / daysDiff) * 10) / 10 : 0;

  const totalTasksChange =
    totalTasksPrevious > 0
      ? Math.round(
          ((totalTasks - totalTasksPrevious) / totalTasksPrevious) * 100,
        )
      : 0;
  const completionRateChange =
    completionRatePrevious > 0
      ? Math.round(completionRate - completionRatePrevious)
      : 0;
  const completedTasksChange =
    completedTasksPrevious > 0
      ? Math.round(
          ((completedTasks - completedTasksPrevious) / completedTasksPrevious) *
            100,
        )
      : 0;

  return {
    period,
    summary: {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks,
      dueSoonTasks,
      avgTasksPerDay,
    },
    trends: {
      totalTasksChange,
      completionRateChange,
      completedTasksChange,
    },
    tasksByStatus,
    tasksByProject: tasksByProject.sort((a, b) => b.count - a.count),
    tasksByAssignee: tasksByAssignee.sort((a, b) => b.completed - a.completed),
    recentTasks: recentTasksData,
  };
}

export default getAnalytics;
