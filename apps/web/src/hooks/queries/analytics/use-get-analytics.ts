import getAnalytics, {
  getProjectAnalytics,
  type QueryParams,
  type AnalyticsData,
  type ProjectAnalyticsData,
} from "@/fetchers/analytics/get-analytics";
import type { DateRange } from "@/fetchers/analytics/get-analytics";
import { client } from "@palcodesk/libs";
import { useQuery } from "@tanstack/react-query";
function useGetAnalytics(workspaceId: string, query?: QueryParams) {
  return useQuery({
    queryKey: ["analytics", workspaceId, query],
    queryFn: () => getAnalytics(workspaceId, query),
    refetchInterval: 60000,
    enabled: !!workspaceId,
  });
}
function useGetProjectAnalytics(
  workspaceId: string,
  projectId: string,
  dateRange?: DateRange,
) {
  return useQuery({
    queryKey: ["analytics", "project", workspaceId, projectId, dateRange],
    queryFn: () => getProjectAnalytics(workspaceId, projectId, { dateRange }),
    refetchInterval: 60000,
    enabled: !!workspaceId && !!projectId,
  });
}
interface OverdueTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  projectName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string;
  daysOverdue: number;
}
interface OverdueNotifications {
  tasks: OverdueTask[];
  total: number;
  byPriority: { urgent: number; high: number; medium: number; low: number };
}
async function getOverdueTasks(
  workspaceId: string,
): Promise<OverdueNotifications> {
  const response = await client.analytics[":workspaceId"].overdue.$get({
    param: { workspaceId },
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }
  return response.json() as Promise<OverdueNotifications>;
}
function useGetOverdueTasks(workspaceId: string) {
  return useQuery({
    queryKey: ["overdue-tasks", workspaceId],
    queryFn: () => getOverdueTasks(workspaceId),
    refetchInterval: 300000,
    enabled: !!workspaceId,
  });
}
export default useGetAnalytics;
export type { DateRange, QueryParams, AnalyticsData, ProjectAnalyticsData };
export { useGetProjectAnalytics, useGetOverdueTasks };
