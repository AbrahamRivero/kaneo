import { client } from "@kaneo/libs";

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
    createdAt: string;
  }>;
  tasksByProject: Array<{
    projectName: string;
    count: number;
  }>;
}

async function getAnalytics(workspaceId: string) {
  const response = await client.analytics[":workspaceId"].$get({
    param: { workspaceId },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  const data = await response.json();

  return data as AnalyticsData;
}

export default getAnalytics;
