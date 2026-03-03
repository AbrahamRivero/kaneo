import { client } from "@kaneo/libs";

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
    start: string;
    end: string;
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
    createdAt: string;
    dueDate: string | null;
    isOverdue: boolean;
  }>;
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

export default getAnalytics;
