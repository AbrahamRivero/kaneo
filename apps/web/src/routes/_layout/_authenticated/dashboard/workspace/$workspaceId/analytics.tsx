import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import { ExportAnalyticsButton } from "@/components/analytics/export-analytics-button";
import { PeriodTasksTableWrapper } from "@/components/analytics/period-tasks-table-wrapper";
import {
  SecondaryCardComponent,
  StatCardComponent,
} from "@/components/analytics/stat-cards";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DEFAULT_COLUMNS } from "@/constants/columns";
import useGetAnalytics, {
  type DateRange,
} from "@/hooks/queries/analytics/use-get-analytics";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CircleCheck,
  Clock2,
  TrendingUp,
} from "lucide-react";
import { Suspense, lazy, useState } from "react";

const TasksByProjectChart = lazy(() =>
  import("@/components/analytics/tasks-by-project-chart").then((m) => ({
    default: m.TasksByProjectChart,
  })),
);

const TasksByStatusChart = lazy(() =>
  import("@/components/analytics/tasks-by-status-chart").then((m) => ({
    default: m.TasksByStatusChart,
  })),
);

const ProductivityByUserChart = lazy(() =>
  import("@/components/analytics/productivity-by-user-chart").then((m) => ({
    default: m.ProductivityByUserChart,
  })),
);

const chartFallback = (
  <Card>
    <CardHeader className="pb-4">
      <Skeleton className="h-6 w-40" />
    </CardHeader>
    <CardContent className="pt-0">
      <div className="h-72">
        <Skeleton className="h-full w-full" />
      </div>
    </CardContent>
  </Card>
);

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/analytics",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const [dateRange, setDateRange] = useState<DateRange>("this-month");
  const { data, isLoading, error } = useGetAnalytics(workspaceId, {
    dateRange,
  });

  const tasks = data?.recentTasks || [];

  if (isLoading) {
    return (
      <WorkspaceLayout title="Analytics">
        <div className="px-6 py-8 space-y-8">
          <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-4">
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-9 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-72">
                  <Skeleton className="h-full w-full" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-40" />
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (error) {
    return (
      <WorkspaceLayout title="Analytics">
        <div className="flex items-center justify-center min-h-[60vh] px-6">
          <div className="text-center space-y-6">
            <BarChart3 className="w-20 h-20 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-xl font-semibold">Error loading analytics</h3>
              <p className="text-muted-foreground">
                {error.message ||
                  "An error occurred while loading analytics data"}
              </p>
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  const completedColumn = DEFAULT_COLUMNS.find((col) => col.id === "completed");
  const todoColumn = DEFAULT_COLUMNS.find((col) => col.id === "to-do");
  const inProgressColumn = DEFAULT_COLUMNS.find(
    (col) => col.id === "in-progress",
  );

  const statCards = [
    {
      title: completedColumn?.name ?? "Completed",
      value: data?.summary.completedTasks ?? 0,
      change: data?.trends.completedTasksChange ?? 0,
      icon: CircleCheck,
      color: completedColumn?.color ?? "text-medium-purple-500",
      bgColor: "bg-medium-purple-500/10",
    },
    {
      title: todoColumn?.name ?? "To Do",
      value: data?.tasksByStatus.todo ?? 0,
      change: null,
      icon: CircleCheck,
      color: todoColumn?.color ?? "text-abbey-600",
      bgColor: "bg-abbey-600/10",
    },
    {
      title: inProgressColumn?.name ?? "In Progress",
      value: data?.tasksByStatus.inProgress ?? 0,
      change: null,
      icon: Clock2,
      color: inProgressColumn?.color ?? "text-supernova-400",
      bgColor: "bg-supernova-400/10",
    },
    {
      title: "Completion Rate",
      value: `${data?.summary.completionRate ?? 0}%`,
      change: data?.trends.completionRateChange ?? 0,
      icon: TrendingUp,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      isPercentage: true,
    },
  ];

  const secondaryCards = [
    {
      title: "Total Tasks",
      value: data?.summary.totalTasks ?? 0,
      change: data?.trends.totalTasksChange ?? 0,
      icon: BarChart3,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Overdue",
      value: data?.summary.overdueTasks ?? 0,
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      isAlert: true,
    },
    {
      title: "Due Soon",
      value: data?.summary.dueSoonTasks ?? 0,
      subtitle: "Next 7 days",
      icon: Calendar,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
    {
      title: "Avg/Day",
      value: data?.summary.avgTasksPerDay ?? 0,
      subtitle: "Completed",
      icon: TrendingUp,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
    },
  ];

  return (
    <WorkspaceLayout title="Analytics">
      <div className="px-6 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">
              {data?.period.label || "Analytics"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {data?.period.start && data?.period.end
                ? `${new Date(data.period.start).toLocaleDateString()} - ${new Date(data.period.end).toLocaleDateString()}`
                : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
            {data && (
              <ExportAnalyticsButton data={data} dateRangeLabel={dateRange} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <StatCardComponent key={card.title} card={card} />
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryCards.map((card) => (
            <SecondaryCardComponent key={card.title} card={card} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Suspense fallback={chartFallback}>
            <TasksByProjectChart data={data?.tasksByProject ?? []} />
          </Suspense>

          <Suspense fallback={chartFallback}>
            <TasksByStatusChart
              todo={data?.tasksByStatus.todo ?? 0}
              inProgress={data?.tasksByStatus.inProgress ?? 0}
              technicalReview={data?.tasksByStatus.technicalReview ?? 0}
              completed={data?.tasksByStatus.completed ?? 0}
              archived={data?.tasksByStatus.archived ?? 0}
            />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Suspense fallback={chartFallback}>
            <ProductivityByUserChart
              data={
                data?.tasksByAssignee.map((item) => ({
                  userName: item.userName,
                  completed: item.completed,
                  totalAssigned: item.totalAssigned,
                })) ?? []
              }
            />
          </Suspense>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">Period Tasks</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <PeriodTasksTableWrapper tasks={tasks} />
          </CardContent>
        </Card>
      </div>
    </WorkspaceLayout>
  );
}
