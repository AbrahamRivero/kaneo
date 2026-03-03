import { DateRangeFilter } from "@/components/analytics/date-range-filter";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Radar,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const technicalReviewColumn = DEFAULT_COLUMNS.find(
    (col) => col.id === "technical-review",
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

  const pieColors = [
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#f97316",
    "#14b8a6",
    "#eab308",
    "#22c55e",
    "#64748b",
  ];

  const pieData =
    data?.tasksByProject.map((item, index) => ({
      name: item.projectName,
      value: item.count,
      fill: pieColors[index % pieColors.length],
    })) ?? [];

  const assigneeData =
    data?.tasksByAssignee.map((item, index) => ({
      name: item.userName,
      completed: item.completed,
      total: item.totalAssigned,
      fill: pieColors[index % pieColors.length],
    })) ?? [];

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
      high: "bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400",
      medium:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
      low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
    };
    return (
      <Badge
        variant="outline"
        className={colors[priority as keyof typeof colors]}
      >
        {priority}
      </Badge>
    );
  };

  const TrendIndicator = ({
    change,
    isPercentage,
  }: { change: number | null; isPercentage?: boolean }) => {
    if (change === null) return null;
    const isPositive = change >= 0;
    return (
      <div
        className={`flex items-center text-xs ${isPositive ? "text-emerald-500" : "text-red-500"}`}
      >
        {isPositive ? (
          <TrendingUp className="w-3 h-3 mr-1" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-1" />
        )}
        {isPositive ? "+" : ""}
        {change}
        {isPercentage ? "%" : ""}
      </div>
    );
  };

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
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <Card key={card.title}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                    {card.icon && (
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{card.value}</div>
                  <TrendIndicator
                    change={card.change}
                    isPercentage={card.isPercentage}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {secondaryCards.map((card) => (
            <Card
              key={card.title}
              className={
                card.isAlert ? "border-red-200 dark:border-red-800" : ""
              }
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div className={`p-2.5 rounded-lg ${card.bgColor}`}>
                    {card.icon && (
                      <card.icon className={`w-5 h-5 ${card.color}`} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-end gap-2">
                  <div className="text-3xl font-bold">{card.value}</div>
                  {card.subtitle && (
                    <div className="text-xs text-muted-foreground mb-1">
                      {card.subtitle}
                    </div>
                  )}
                </div>
                {card.change !== undefined && card.change !== null && (
                  <TrendIndicator change={card.change} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tasks by Project</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {pieData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name}: ${percent != null ? (percent * 100).toFixed(0) : "0"}%`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry) => (
                          <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <p>No task data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Tasks by Status</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      {
                        name: "To Do",
                        value: data?.tasksByStatus.todo ?? 0,
                        fill: "#64748b",
                      },
                      {
                        name: "In Progress",
                        value: data?.tasksByStatus.inProgress ?? 0,
                        fill: "#f97316",
                      },
                      {
                        name: "Technical Review",
                        value: data?.tasksByStatus.technicalReview ?? 0,
                        fill: "#8b5cf6",
                      },
                      {
                        name: "Completed",
                        value: data?.tasksByStatus.completed ?? 0,
                        fill: "#22c55e",
                      },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <CardTitle className="text-lg">Productivity by User</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {assigneeData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={assigneeData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={80} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="completed"
                        name="Completed"
                        fill="#22c55e"
                        radius={[0, 4, 4, 0]}
                      />
                      <Bar
                        dataKey="total"
                        name="Total"
                        fill="#64748b"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <p>No user data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Recent Tasks</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {data?.recentTasks && data.recentTasks.length > 0 ? (
                <div className="overflow-x-auto -mx-2 px-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="py-3">Task</TableHead>
                        <TableHead className="py-3">Project</TableHead>
                        <TableHead className="py-3">Priority</TableHead>
                        <TableHead className="py-3">Status</TableHead>
                        <TableHead className="py-3">Due</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTasks.slice(0, 10).map((task) => (
                        <TableRow key={task.id}>
                          <TableCell className="py-3 font-medium">
                            {task.title}
                          </TableCell>
                          <TableCell className="py-3">
                            {task.projectName}
                          </TableCell>
                          <TableCell className="py-3">
                            {getPriorityBadge(task.priority)}
                          </TableCell>
                          <TableCell className="py-3">
                            <Badge
                              variant="outline"
                              className={
                                task.status === "completed"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : task.status === "in-progress"
                                    ? "bg-orange-100 text-orange-700"
                                    : "bg-gray-100 text-gray-700"
                              }
                            >
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-3">
                            {task.dueDate ? (
                              <span
                                className={
                                  task.isOverdue
                                    ? "text-red-500 font-medium"
                                    : "text-muted-foreground"
                                }
                              >
                                {new Date(task.dueDate).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                                {task.isOverdue && " (Overdue)"}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center text-muted-foreground">
                  <p>No recent tasks available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
