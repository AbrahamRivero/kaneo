import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetSurveyDetail } from "@/hooks/queries/survey/use-get-surveys";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ClipboardList,
  MessageSquareText,
  Star,
  Trash2,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import WorkspaceLayout from "@/components/common/workspace-layout";
import { useDeleteSurvey } from "@/hooks/mutations/survey";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/surveys/$surveyId",
)({
  component: SurveyDetailPage,
});

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a1a1aa"];

const PIE_COLORS = {
  excellent: "#22c55e",
  good: "#3b82f6",
  average: "#eab308",
  bad: "#ef4444",
  empty: "#a1a1aa",
};

function SurveyDetailPage() {
  const { workspaceId, surveyId } = Route.useParams();
  const navigate = useNavigate();
  const { data: survey, isLoading } = useGetSurveyDetail(surveyId);
  const deleteSurvey = useDeleteSurvey();

  const formatDate = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  };

  if (isLoading) {
    return (
      <WorkspaceLayout title="Survey Detail">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </WorkspaceLayout>
    );
}

  if (!survey) {
    return (
      <WorkspaceLayout title="Survey Detail">
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Survey not found</p>
        </div>
      </WorkspaceLayout>
    );
  }

  const { ratings, suggestions } = survey;

  const barChartConfig: ChartConfig = {
    rating: { label: "Rating", color: "#3b82f6" },
  };

  const barData = ratings.map((r) => ({
    name: r.categoryName || "Unknown",
    rating: r.score / 10,
    fill: "var(--color-rating)",
  }));

  const overallData = [
    { name: "Muy Bueno", value: survey.overallVeryGood, fill: "#22c55e" },
    { name: "Bueno", value: survey.overallGood, fill: "#3b82f6" },
    { name: "No Respondió", value: survey.overallNoAnswer, fill: "#a1a1aa" },
  ].filter((d) => d.value > 0);

  const pieChartConfig: ChartConfig = {
    excellent: { label: "Excelente", color: "#22c55e" },
    good: { label: "Bueno", color: "#3b82f6" },
    average: { label: "Regular", color: "#eab308" },
    bad: { label: "Malo", color: "#ef4444" },
    empty: { label: "Vacías", color: "#a1a1aa" },
  };

  return (
    <WorkspaceLayout title="Survey Detail">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/dashboard/workspace/$workspaceId/surveys", params: { workspaceId } })}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">
              {formatDate(survey.date)}
            </h1>
            <p className="text-muted-foreground mt-1">Customer Satisfaction Survey</p>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" disabled={deleteSurvey.isPending}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Survey</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this survey? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteSurvey.mutate({ id: survey.id, workspaceId })}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
              Aplicadas
            </p>
            <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-blue-500/10">
              <ClipboardList className="size-5 text-blue-500" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">
            {survey.totalApplied}
          </p>
        </div>
        <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
              Contestadas
            </p>
            <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-emerald-500/10">
              <MessageSquareText className="size-5 text-emerald-500" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">
            {survey.totalAnswered}
          </p>
        </div>
        <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
              Response Rate
            </p>
            <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-amber-500/10">
              <TrendingUp className="size-5 text-amber-500" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">
            {survey.totalApplied > 0
              ? `${Math.round((survey.totalAnswered / survey.totalApplied) * 100)}%`
              : "N/A"}
          </p>
        </div>
        <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
          <div className="flex items-start justify-between">
            <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
              Overall Avg
            </p>
            <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-purple-500/10">
              <Star className="size-5 text-purple-500" />
            </div>
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">
            {survey.totalAnswered > 0
              ? (
                  ratings.reduce((sum, r) => sum + r.score, 0) /
                  (ratings.length * 10)
                ).toFixed(1)
              : "N/A"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Ratings by Category</h3>
          </div>
          <ChartContainer config={barChartConfig} className="h-72 w-full">
            <BarChart data={barData} margin={{ top: 0, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
              <XAxis dataKey="name" tick={false} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 5]} tickLine={false} axisLine={false} fontSize={12} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toFixed(1)}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Bar dataKey="rating" radius={[4, 4, 0, 0]} barSize={40}>
                {barData.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
          <div className="flex flex-wrap gap-4 mt-2">
            {barData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="text-muted-foreground">{entry.name}</span>
                <span className="font-medium">{entry.rating.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Overall Satisfaction</h3>
          </div>
          <ChartContainer config={pieChartConfig} className="h-72 w-full">
            <PieChart>
              <Pie
                data={overallData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
              >
                {overallData.map((entry) => (
                  <Cell key={entry.name} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">{name}</span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(value).toLocaleString()}
                        </span>
                      </div>
                    )}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
          <div className="flex justify-center gap-4 mt-2">
            {overallData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {ratings.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {ratings.map((rating) => {
            const pieData = [
              { name: "Excelente", value: rating.excellent, fill: PIE_COLORS.excellent },
              { name: "Bueno", value: rating.good, fill: PIE_COLORS.good },
              { name: "Regular", value: rating.average, fill: PIE_COLORS.average },
              { name: "Malo", value: rating.bad, fill: PIE_COLORS.bad },
              { name: "Vacías", value: rating.empty, fill: PIE_COLORS.empty },
            ].filter((d) => d.value > 0);

            return (
              <div key={rating.categoryConfigId || rating.categoryName} className="rounded-xl border border-border/60 bg-card p-5">
                <h3 className="text-sm font-semibold mb-4">{rating.categoryName}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <ChartContainer
                      config={{
                        ...pieChartConfig,
                        excellent: { label: "Excelente", color: PIE_COLORS.excellent },
                        good: { label: "Bueno", color: PIE_COLORS.good },
                        average: { label: "Regular", color: PIE_COLORS.average },
                        bad: { label: "Malo", color: PIE_COLORS.bad },
                        empty: { label: "Vacías", color: PIE_COLORS.empty },
                      }}
                      className="h-48 w-full"
                    >
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <ChartTooltip
                          content={
                            <ChartTooltipContent
                              formatter={(value, name) => (
                                <div className="flex w-full items-center justify-between gap-4">
                                  <span className="text-muted-foreground">{name}</span>
                                  <span className="font-mono font-medium tabular-nums text-foreground">
                                    {Number(value).toLocaleString()}
                                  </span>
                                </div>
                              )}
                            />
                          }
                        />
                      </PieChart>
                    </ChartContainer>
                  </div>
                  <div className="space-y-1.5">
                    {pieData.map((d) => (
                      <div key={d.name} className="flex items-center gap-2 text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.fill }} />
                        <span className="text-muted-foreground w-14">{d.name}</span>
                        <span className="font-medium w-6 text-right">{d.value}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t mt-1">
                      <span className="text-xs font-semibold">
                        Avg: {(rating.score / 10).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquareText className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">
              Suggestions ({suggestions.length})
            </h3>
          </div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div
                key={s}
                className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground"
              >
                {s}
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </WorkspaceLayout>
  );
}
