import { and, count, eq, inArray, sql } from "drizzle-orm";
import db from "../database";
import { projectTable, taskTable, userTable } from "../database/schema";

export type DateRange =
  | "this-month"
  | "last-month"
  | "this-quarter"
  | "this-week";

export interface QueryParams {
  dateRange?: DateRange;
  startDate?: string;
  endDate?: string;
  projectId?: string;
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
    activeProjects: number;
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
    archived: number;
  };
  tasksByPriority: {
    urgent: number;
    high: number;
    medium: number;
    low: number;
  };
  tasksByProject: Array<{
    projectName: string;
    projectId: string;
    count: number;
    completed: number;
    completionRate: number;
    overdue: number;
    inProgress: number;
  }>;
  projectsStalled: Array<{
    projectId: string;
    projectName: string;
    daysSinceLastUpdate: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  tasksByAssignee: Array<{
    userId: string;
    userName: string;
    totalAssigned: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  }>;
  weeklyTrend: Array<{
    week: string;
    completed: number;
    created: number;
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
      const day = (now.getDay() + 6) % 7; // Monday as first day of week
      start.setDate(now.getDate() - day);
      start.setHours(0, 0, 0, 0);
      return { start, end: today, label: "This Week" };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      return { start, end, label: "Last Month" };
    }
    case "this-quarter": {
      const quarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), quarter * 3, 1);
      return { start, end: today, label: "This Quarter" };
    }
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

  const allTasksInWorkspace = await db
    .select({
      title: taskTable.title,
      id: taskTable.id,
      status: taskTable.status,
      priority: taskTable.priority,
      dueDate: taskTable.dueDate,
      userId: taskTable.userId,
      projectId: taskTable.projectId,
      projectName: projectTable.name,
      assigneeName: userTable.name,
      createdAt: taskTable.createdAt,
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .leftJoin(userTable, eq(taskTable.userId, userTable.id))
    .where(and(eq(projectTable.workspaceId, workspaceId)));

  const tasksInPeriodRaw = allTasksInWorkspace.filter((t) => {
    const effectiveDate = t.dueDate ?? t.createdAt;
    return effectiveDate >= period.start && effectiveDate <= period.end;
  });

  const currentPeriodExcludesArchived =
    query?.dateRange === "this-week" || query?.dateRange === "this-month";
  const effectiveTasksInPeriod = currentPeriodExcludesArchived
    ? tasksInPeriodRaw.filter((t) => t.status !== "archived")
    : tasksInPeriodRaw;

  const tasksPreviousPeriod = allTasksInWorkspace.filter((t) => {
    const effectiveDate = t.dueDate ?? t.createdAt;
    return (
      effectiveDate >= previousPeriod.start &&
      effectiveDate <= previousPeriod.end
    );
  });

  const tasksByStatus: AnalyticsData["tasksByStatus"] = {
    completed: 0,
    todo: 0,
    inProgress: 0,
    technicalReview: 0,
    archived: 0,
  };

  const tasksByPriority: AnalyticsData["tasksByPriority"] = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  let overdueTasks = 0;
  let dueSoonTasks = 0;

  const tasksByProjectMap = new Map<
    string,
    {
      name: string;
      total: number;
      completed: number;
      overdue: number;
      inProgress: number;
    }
  >();
  const tasksByAssigneeMap = new Map<
    string,
    { name: string; total: number; completed: number; inProgress: number }
  >();
  const recentTasksData: AnalyticsData["recentTasks"] = [];

  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  for (const task of effectiveTasksInPeriod) {
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
      case "archived":
        tasksByStatus.archived++;
        break;
    }

    const priority = task.priority ?? "low";
    switch (priority) {
      case "urgent":
        tasksByPriority.urgent++;
        break;
      case "high":
        tasksByPriority.high++;
        break;
      case "medium":
        tasksByPriority.medium++;
        break;
      case "low":
        tasksByPriority.low++;
        break;
    }

    if (task.status !== "completed" && task.status !== "archived") {
      if (task.dueDate && task.dueDate < now) overdueTasks++;
      else if (task.dueDate && task.dueDate <= sevenDaysFromNow) dueSoonTasks++;
    }

    const projectKey = task.projectId;
    if (!tasksByProjectMap.has(projectKey)) {
      tasksByProjectMap.set(projectKey, {
        name: task.projectName,
        total: 0,
        completed: 0,
        overdue: 0,
        inProgress: 0,
      });
    }
    const projectData = tasksByProjectMap.get(projectKey);
    if (!projectData) continue;
    projectData.total++;
    if (task.status === "completed" || task.status === "archived")
      projectData.completed++;
    else if (task.status === "in-progress") projectData.inProgress++;
    if (
      task.status !== "completed" &&
      task.status !== "archived" &&
      task.dueDate &&
      task.dueDate < now
    )
      projectData.overdue++;

    if (task.userId) {
      if (!tasksByAssigneeMap.has(task.userId)) {
        tasksByAssigneeMap.set(task.userId, {
          name: "Unknown",
          total: 0,
          completed: 0,
          inProgress: 0,
        });
      }
      const userData = tasksByAssigneeMap.get(task.userId);
      if (!userData) continue;
      userData.total++;
      if (task.status === "completed" || task.status === "archived")
        userData.completed++;
      else if (task.status === "in-progress") userData.inProgress++;
    }
  }

  const userIds = Array.from(tasksByAssigneeMap.keys());
  if (userIds.length > 0) {
    const usersResult = await db
      .select({ id: userTable.id, name: userTable.name })
      .from(userTable)
      .where(inArray(userTable.id, userIds as string[]));
    for (const user of usersResult) {
      if (tasksByAssigneeMap.has(user.id)) {
        const userData = tasksByAssigneeMap.get(user.id);
        if (userData) userData.name = user.name ?? "Unknown";
      }
    }
  }

  const projectsWithTasks = await db
    .select({
      id: projectTable.id,
      name: projectTable.name,
      lastTaskCreated: sql`MAX(${taskTable.createdAt})`.as("last_task_created"),
      totalTasks: count(),
      completedTasks:
        sql`COUNT(CASE WHEN ${taskTable.status} = 'completed' THEN 1 END)`.as(
          "completed_tasks",
        ),
    })
    .from(projectTable)
    .leftJoin(taskTable, eq(taskTable.projectId, projectTable.id))
    .where(eq(projectTable.workspaceId, workspaceId))
    .groupBy(projectTable.id, projectTable.name);

  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const projectsStalled: AnalyticsData["projectsStalled"] = [];

  for (const project of projectsWithTasks) {
    const lastTaskVal = project.lastTaskCreated as unknown;
    const lastTask = lastTaskVal instanceof Date ? lastTaskVal : null;
    if (lastTask && lastTask < fourteenDaysAgo && project.totalTasks > 0) {
      const daysSinceUpdate = Math.floor(
        (now.getTime() - lastTask.getTime()) / (1000 * 60 * 60 * 24),
      );
      projectsStalled.push({
        projectId: project.id,
        projectName: project.name,
        daysSinceLastUpdate: daysSinceUpdate,
        totalTasks: project.totalTasks || 0,
        completedTasks: Number(project.completedTasks) || 0,
      });
    }
  }

  const tasksByProject: AnalyticsData["tasksByProject"] = Array.from(
    tasksByProjectMap.entries(),
  ).map(([projectId, data]) => ({
    projectId,
    projectName: data.name,
    count: data.total,
    completed: data.completed,
    completionRate:
      data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    overdue: data.overdue,
    inProgress: data.inProgress,
  }));

  const tasksByAssignee: AnalyticsData["tasksByAssignee"] = Array.from(
    tasksByAssigneeMap.entries(),
  ).map(([userId, data]) => ({
    userId,
    userName: data.name,
    totalAssigned: data.total,
    completed: data.completed,
    inProgress: data.inProgress,
    completionRate:
      data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
  }));

  const weekMap = new Map<string, { completed: number; created: number }>();
  const daysInPeriod = Math.ceil(
    (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysInPeriod <= 35) {
    for (const task of effectiveTasksInPeriod) {
      const effectiveDate = task.dueDate ?? task.createdAt;
      if (!effectiveDate) continue;
      const weekStart = new Date(effectiveDate);
      const day = (weekStart.getDay() + 6) % 7; // Monday as first day of week
      weekStart.setDate(weekStart.getDate() - day);
      const weekKey = weekStart.toISOString().split("T")[0] ?? "";
      if (!weekMap.has(weekKey))
        weekMap.set(weekKey, { completed: 0, created: 0 });
      const weekData = weekMap.get(weekKey);
      if (!weekData) continue;
      weekData.created++;
      if (task.status === "completed") weekData.completed++;
    }
  }

  const weeklyTrend: AnalyticsData["weeklyTrend"] = Array.from(
    weekMap.entries(),
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, data]) => ({
      week: new Date(week).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      completed: data.completed,
      created: data.created,
    }));

  const periodTasksSorted = [...tasksInPeriodRaw].sort((a, b) => {
    const aDate = (a.dueDate ?? a.createdAt)?.getTime() ?? 0;
    const bDate = (b.dueDate ?? b.createdAt)?.getTime() ?? 0;
    return bDate - aDate;
  });

  for (const task of periodTasksSorted) {
    recentTasksData.push({
      id: task.id,
      title: task.title ?? "",
      status: task.status ?? "to-do",
      priority: task.priority ?? "low",
      projectName: task.projectName ?? "",
      assigneeName: task.assigneeName ?? null,
      createdAt: task.createdAt,
      dueDate: task.dueDate,
      isOverdue: task.dueDate
        ? task.dueDate < now &&
          task.status !== "completed" &&
          task.status !== "archived"
        : false,
    });
  }

  const totalTasks = effectiveTasksInPeriod.length;
  const completedTasks = tasksByStatus.completed + tasksByStatus.archived;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalTasksPrevious = tasksPreviousPeriod.length;
  const completedTasksPrevious = tasksPreviousPeriod.filter(
    (t) => t.status === "completed" || t.status === "archived",
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

  const activeProjects = tasksByProject.length;

  return {
    period,
    summary: {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks,
      dueSoonTasks,
      avgTasksPerDay,
      activeProjects,
    },
    trends: { totalTasksChange, completionRateChange, completedTasksChange },
    tasksByStatus,
    tasksByPriority,
    tasksByProject: tasksByProject.sort((a, b) => b.count - a.count),
    projectsStalled: projectsStalled.sort(
      (a, b) => b.daysSinceLastUpdate - a.daysSinceLastUpdate,
    ),
    tasksByAssignee: tasksByAssignee.sort((a, b) => b.completed - a.completed),
    weeklyTrend,
    recentTasks: recentTasksData,
  };
}

export default getAnalytics;
