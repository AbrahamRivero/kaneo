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
import useGetAnalytics from "@/hooks/queries/analytics/use-get-analytics";
import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Circle, CircleCheck, Clock2, Radar } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/analytics",
)({
  component: RouteComponent,
});

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const { data, isLoading, error } = useGetAnalytics(workspaceId);

  if (isLoading) {
    return (
      <WorkspaceLayout title="Analytics">
        <div className="px-6 py-8 space-y-8">
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
      value: data?.tasksByStatus.completed ?? 0,
      icon: CircleCheck,
      color: completedColumn?.color ?? "text-medium-purple-500",
      bgColor: "bg-medium-purple-500/10",
    },
    {
      title: todoColumn?.name ?? "To Do",
      value: data?.tasksByStatus.todo ?? 0,
      icon: Circle,
      color: todoColumn?.color ?? "text-abbey-600",
      bgColor: "bg-abbey-600/10",
    },
    {
      title: inProgressColumn?.name ?? "In Progress",
      value: data?.tasksByStatus.inProgress ?? 0,
      icon: Clock2,
      color: inProgressColumn?.color ?? "text-supernova-400",
      bgColor: "bg-supernova-400/10",
    },
    {
      title: technicalReviewColumn?.name ?? "Technical Review",
      value: data?.tasksByStatus.technicalReview ?? 0,
      icon: Radar,
      color: technicalReviewColumn?.color ?? "text-emerald-500",
      bgColor: "bg-emerald-500/10",
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

  return (
    <WorkspaceLayout title="Analytics">
      <div className="px-6 py-8 space-y-8">
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
                <div className="text-3xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                Tasks by Project (This Month)
              </CardTitle>
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
                  <p>No task data available for this month</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                Recent Tasks (Most Active Project)
              </CardTitle>
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
                        <TableHead className="py-3">Assignee</TableHead>
                        <TableHead className="py-3">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.recentTasks.map((task) => (
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
                          <TableCell className="py-3 text-muted-foreground">
                            {task.assigneeName || "Unassigned"}
                          </TableCell>
                          <TableCell className="py-3 text-muted-foreground">
                            {new Date(task.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              },
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
