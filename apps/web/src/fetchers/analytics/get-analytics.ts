import { client } from "@palcodesk/libs";
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
  period: { start: string; end: string; label: string };
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
  weeklyTrend: Array<{ week: string; completed: number; created: number }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    projectName: string;
    assigneeName: string | null;
    createdAt: string;
    dueDate: string | null;
    isOverdue: boolean;
  }>;
}
export interface ProjectAnalyticsData {
  project: { id: string; name: string; description?: string };
  period: { start: string; end: string; label: string };
  summary: {
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
    overdueTasks: number;
    dueSoonTasks: number;
    avgCompletionDays: number;
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
  tasksByAssignee: Array<{
    userId: string;
    userName: string;
    totalAssigned: number;
    completed: number;
    inProgress: number;
    completionRate: number;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    assigneeName: string | null;
    createdAt: string;
    dueDate: string | null;
    isOverdue: boolean;
  }>;
  history: Array<{ week: string; created: number; completed: number }>;
}
async function getAnalytics(workspaceId: string, query?: QueryParams) {
  const response = await client.analytics[":workspaceId"].$get({
    param: { workspaceId },
    query: query as Record<string, string>,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  const data = await response.json();
  return data as AnalyticsData;
}
async function getProjectAnalytics(
  workspaceId: string,
  projectId: string,
  query?: { dateRange?: DateRange },
) {
  const response = await client.analytics[":workspaceId"].project[
    ":projectId"
  ].$get({
    param: { workspaceId, projectId },
    query: query as Record<string, string>,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  const data = await response.json();
  return data as ProjectAnalyticsData;
}
export default getAnalytics;
export { getProjectAnalytics };
