import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { BarChart3 } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface TasksByStatusChartProps {
  todo: number;
  inProgress: number;
  technicalReview: number;
  completed: number;
  archived: number;
}

const chartConfig: ChartConfig = {
  value: {
    label: "Tasks",
  },
  todo: {
    label: "To Do",
    color: "#a1a1aa",
  },
  inProgress: {
    label: "In Progress",
    color: "#eab308",
  },
  technicalReview: {
    label: "Technical Review",
    color: "#10b981",
  },
  completed: {
    label: "Completed",
    color: "#8b5cf6",
  },
  archived: {
    label: "Archived",
    color: "#0ea5e9",
  },
  backlog: {
    label: "Backlog",
    color: "#53565a",
  },
};

export function TasksByStatusChart({
  todo,
  inProgress,
  technicalReview,
  completed,
  archived,
}: TasksByStatusChartProps) {
  const chartData = [
    { name: "To Do", value: todo, fill: "var(--color-todo)" },
    { name: "In Progress", value: inProgress, fill: "var(--color-inProgress)" },
    {
      name: "Review",
      value: technicalReview,
      fill: "var(--color-technicalReview)",
    },
    { name: "Completed", value: completed, fill: "var(--color-completed)" },
    { name: "Archived", value: archived, fill: "var(--color-archived)" },
  ];

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-chart-1/10">
            <BarChart3 className="size-4 text-chart-1" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Tasks by Status
          </h3>
        </div>
        <span className="text-2xl font-semibold tracking-tight text-card-foreground">
          {total}
        </span>
      </div>
      <div className="px-5 py-4">
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              horizontal={false}
              stroke="var(--color-border)"
              strokeOpacity={0.5}
            />
            <XAxis
              type="number"
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              fontSize={12}
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel indicator="line" />}
            />
            <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20} />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Status summary row */}
      <div className="flex items-center gap-4 border-t border-border/40 px-5 py-3">
        {chartData
          .filter((d) => d.value > 0)
          .map((d) => (
            <div key={d.name} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: d.fill }}
              />
              <span className="text-xs text-muted-foreground">{d.name}</span>
              <span className="text-xs font-medium text-card-foreground">
                {d.value}
              </span>
            </div>
          ))}
      </div>
    </div>
  );
}
