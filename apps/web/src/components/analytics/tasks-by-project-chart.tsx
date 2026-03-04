import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { FolderKanban } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";

interface TasksByProjectChartProps {
  data: {
    projectName: string;
    count: number;
  }[];
}

const CHART_COLORS = [
  "#8b5cf6",
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#eab308",
  "#f97316",
  "#ef4444",
  "#ec4899",
];

export function TasksByProjectChart({ data }: TasksByProjectChartProps) {
  const chartData = data.map((item, index) => ({
    name: item.projectName,
    value: item.count,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  }));

  const chartConfig: ChartConfig = Object.fromEntries(
    data.map((item, index) => [
      item.projectName,
      {
        label: item.projectName,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  );

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2.5 border-b border-border/40 px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
            <FolderKanban className="size-4 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Tasks by Project
          </h3>
        </div>
        <div className="flex h-72 flex-col items-center justify-center gap-2 px-5">
          <p className="text-sm text-muted-foreground">
            No task data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-accent/10">
            <FolderKanban className="size-4 text-accent" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Tasks by Project
          </h3>
        </div>
        <span className="text-2xl font-semibold tracking-tight text-card-foreground">
          {total}
        </span>
      </div>
      <div className="px-5 py-4">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-64"
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel indicator="dot" />}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              strokeWidth={2}
              stroke="var(--color-card)"
              paddingAngle={2}
              dataKey="value"
              nameKey="name"
            >
              {chartData.map((entry) => (
                <Cell key={`cell-${entry.name}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartLegend
              content={<ChartLegendContent nameKey="name" />}
              verticalAlign="bottom"
            />
          </PieChart>
        </ChartContainer>
      </div>
    </div>
  );
}
