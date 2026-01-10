import { and, count, desc, eq, gte } from "drizzle-orm";
import db from "../database";
import { projectTable, taskTable, userTable } from "../database/schema";

export interface AnalyticsData {
  tasksByStatus: {
    completed: number;
    todo: number;
    inProgress: number;
    technicalReview: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    projectName: string;
    assigneeName: string | null;
    createdAt: Date;
  }>;
  tasksByProject: Array<{
    projectName: string;
    count: number;
  }>;
}

async function getAnalytics(workspaceId: string): Promise<AnalyticsData> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const tasksByStatusResult = await db
    .select({
      status: taskTable.status,
      count: count(),
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        gte(taskTable.createdAt, startOfMonth),
      ),
    )
    .groupBy(taskTable.status);

  const tasksByStatus: AnalyticsData["tasksByStatus"] = {
    completed: 0,
    todo: 0,
    inProgress: 0,
    technicalReview: 0,
  };

  for (const row of tasksByStatusResult) {
    if (!row.status) continue;
    switch (row.status) {
      case "completed":
        tasksByStatus.completed = row.count;
        break;
      case "to-do":
        tasksByStatus.todo = row.count;
        break;
      case "in-progress":
        tasksByStatus.inProgress = row.count;
        break;
      case "technical-review":
        tasksByStatus.technicalReview = row.count;
        break;
    }
  }

  const projectWithMostTasksResult = await db
    .select({
      projectId: projectTable.id,
      projectName: projectTable.name,
      taskCount: count(),
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        gte(taskTable.createdAt, startOfMonth),
      ),
    )
    .groupBy(projectTable.id, projectTable.name)
    .orderBy(desc(count()))
    .limit(1);

  const recentTasks: AnalyticsData["recentTasks"] = [];

  if (projectWithMostTasksResult.length > 0 && projectWithMostTasksResult[0]) {
    const projectWithMostTasksId = projectWithMostTasksResult[0].projectId;

    const recentTasksResult = await db
      .select({
        id: taskTable.id,
        title: taskTable.title,
        status: taskTable.status,
        priority: taskTable.priority,
        projectName: projectTable.name,
        assigneeName: userTable.name,
        createdAt: taskTable.createdAt,
      })
      .from(taskTable)
      .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
      .leftJoin(userTable, eq(taskTable.userId, userTable.id))
      .where(
        and(
          eq(projectTable.id, projectWithMostTasksId),
          gte(taskTable.createdAt, startOfMonth),
        ),
      )
      .orderBy(desc(taskTable.createdAt))
      .limit(15);

    for (const task of recentTasksResult) {
      recentTasks.push({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        projectName: task.projectName,
        assigneeName: task.assigneeName ?? null,
        createdAt: task.createdAt,
      });
    }
  }

  const tasksByProjectResult = await db
    .select({
      projectName: projectTable.name,
      count: count(),
    })
    .from(taskTable)
    .innerJoin(projectTable, eq(taskTable.projectId, projectTable.id))
    .where(
      and(
        eq(projectTable.workspaceId, workspaceId),
        gte(taskTable.createdAt, startOfMonth),
      ),
    )
    .groupBy(projectTable.id, projectTable.name)
    .orderBy(desc(count()));

  const tasksByProject: AnalyticsData["tasksByProject"] =
    tasksByProjectResult.map((row) => ({
      projectName: row.projectName,
      count: row.count,
    }));

  return {
    tasksByStatus,
    recentTasks,
    tasksByProject,
  };
}

export default getAnalytics;
