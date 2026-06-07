import WorkspaceLayout from "@/components/common/workspace-layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { useGetSurveys, useGetSurveyStats } from "@/hooks/queries/survey/use-get-surveys";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  ClipboardCheck,
  FileUp,
  MessageSquareText,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import CreateSurveyModal from "@/components/survey/create-survey-modal";
import ImportCSVModal from "@/components/survey/import-csv-modal";
import { useDeleteSurvey } from "@/hooks/mutations/survey";

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/surveys/",
)({
  component: RouteComponent,
});

const COLORS = ["#22c55e", "#3b82f6", "#eab308", "#ef4444", "#a1a1aa"];

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { data: surveys, isLoading } = useGetSurveys(workspaceId);
  const { data: stats } = useGetSurveyStats(workspaceId);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const deleteSurvey = useDeleteSurvey();

  const formatDate = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  };

  const formatShortDate = (d: string) => {
    const dt = new Date(d + "T12:00:00");
    return dt.toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  };

  const totalSurveys = surveys?.length ?? 0;
  const totalAnswered = surveys?.reduce((s, x) => s + x.totalAnswered, 0) ?? 0;

  const allRatings = surveys?.flatMap((s) => s.ratings) ?? [];
  const avgOverall =
    allRatings.length > 0
      ? (allRatings.reduce((s, r) => s + r.score, 0) / (allRatings.length * 10)).toFixed(1)
      : "N/A";

  const trendData =
    stats?.categoryStats
      ?.filter((cs) => cs.trend.length > 0)
      .map((cs) => ({
        name: cs.name,
        data: cs.trend.map((t) => ({
          label: formatShortDate(t.date),
          rating: t.score / 10,
        })),
      })) || [];

  const trendChartConfig: ChartConfig = {};
  if (trendData.length > 0) {
    trendData.forEach((td, i) => {
      trendChartConfig[td.name] = {
        label: td.name,
        color: COLORS[i % COLORS.length],
      };
    });
  }

  if (isLoading) {
    return (
      <WorkspaceLayout
        title="Surveys"
        headerActions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>
              <FileUp className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Plus className="w-4 h-4 mr-2" />
              New Survey
            </Button>
          </div>
        }
      >
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
          <div className="overflow-hidden rounded-xl border border-border/60">
            <Table>
              <TableHeader>
                <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Date</TableHead>
                  <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Aplicadas</TableHead>
                  <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Contestadas</TableHead>
                  <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Overall</TableHead>
                  <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2, 3].map((i) => (
                  <TableRow key={i} className="border-border/40">
                    <TableCell className="px-4 py-3.5"><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="px-4 py-3.5"><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell className="px-4 py-3.5"><Skeleton className="h-8 w-8 rounded-md" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!surveys || surveys.length === 0) {
    return (
      <WorkspaceLayout
        title="Surveys"
        headerActions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
              <FileUp className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Survey
            </Button>
          </div>
        }
      >
        <div className="p-6">
          <div className="flex h-80 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border/60 bg-muted/30">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
              <ClipboardList className="size-6 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1.5">
              <p className="text-sm font-medium text-foreground">No surveys yet</p>
              <p className="text-xs text-muted-foreground">Create your first customer satisfaction survey.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                New Survey
              </Button>
              <Button variant="outline" onClick={() => setIsImportOpen(true)}>
                <FileUp className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </div>
          </div>
        </div>

        <CreateSurveyModal
          open={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          workspaceId={workspaceId}
        />
        <ImportCSVModal
          open={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          workspaceId={workspaceId}
        />
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout
      title="Surveys"
      headerActions={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsImportOpen(true)}>
            <FileUp className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Survey
          </Button>
        </div>
      }
    >
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
            <div className="flex items-start justify-between">
              <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Total Surveys</p>
              <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-blue-500/10">
                <ClipboardCheck className="size-5 text-blue-500" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">{totalSurveys}</p>
          </div>
          <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
            <div className="flex items-start justify-between">
              <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Total Contestadas</p>
              <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-emerald-500/10">
                <MessageSquareText className="size-5 text-emerald-500" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">{totalAnswered}</p>
          </div>
          <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
            <div className="flex items-start justify-between">
              <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">Average Rating</p>
              <div className="flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105 bg-amber-500/10">
                <TrendingUp className="size-5 text-amber-500" />
              </div>
            </div>
            <p className="mt-4 text-3xl font-semibold tracking-tight text-card-foreground">{avgOverall}</p>
          </div>
        </div>

        {trendData.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Trend Over Time</h3>
            </div>
            <ChartContainer config={trendChartConfig} className="h-72 w-full">
              <LineChart
                data={
                  trendData[0]?.data.map((_, i) => {
                    const point: Record<string, string | number> = {
                      label: trendData[0]?.data[i]?.label || "",
                    };
                    for (const td of trendData) {
                      point[td.name] = td.data[i]?.rating ?? null;
                    }
                    return point;
                  }) || []
                }
                margin={{ top: 0, right: 12, left: -20, bottom: 0 }}
              >
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeOpacity={0.5} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
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
                {trendData.map((td, i) => (
                  <Line
                    key={td.name}
                    type="monotone"
                    dataKey={td.name}
                    stroke={COLORS[i % COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-4 mt-2">
              {trendData.map((td, i) => (
                <div key={td.name} className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-muted-foreground">{td.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-border/60">
          <Table>
            <TableHeader>
              <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Date</TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Aplicadas</TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Contestadas</TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Overall</TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Ratings</TableHead>
                <TableHead className="h-11 px-4 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {surveys.map((survey) => (
                <TableRow
                  key={survey.id}
                  className="cursor-pointer border-border/40 transition-colors hover:bg-muted/30"
                  onClick={() =>
                    navigate({
                      to: "/dashboard/workspace/$workspaceId/surveys/$surveyId",
                      params: { workspaceId, surveyId: survey.id },
                    })
                  }
                >
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <span className="font-medium text-foreground">{formatDate(survey.date)}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-muted-foreground">{survey.totalApplied}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <span className="text-muted-foreground">{survey.totalAnswered}</span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600">
                        {survey.overallVeryGood} MB
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                        {survey.overallGood} B
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3.5">
                    <div className="flex gap-4">
                      {survey.ratings.map((r) => (
                        <span key={r.categoryId} className="text-xs text-muted-foreground whitespace-nowrap">
                          <span className="font-medium text-foreground">{r.categoryName}</span>{" "}
                          {(r.score / 10).toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4" />
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
                          <AlertDialogAction onClick={() => deleteSurvey.mutate({ id: survey.id, workspaceId })}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <CreateSurveyModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        workspaceId={workspaceId}
      />
      <ImportCSVModal
        open={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        workspaceId={workspaceId}
      />
    </WorkspaceLayout>
  );
}
