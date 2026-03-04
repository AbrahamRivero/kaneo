import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface ProductivityByUserChartProps {
  data: {
    userName: string;
    completed: number;
    totalAssigned: number;
  }[];
}

const chartConfig: ChartConfig = {
  completed: {
    label: "Completed",
    color: "#8b5cf6",
  },
  totalAssigned: {
    label: "Total Assigned",
    color: "#6366f1",
  },
};

export function ProductivityByUserChart({
  data,
}: ProductivityByUserChartProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-border/60 bg-card">
        <div className="flex items-center gap-2.5 border-b border-border/40 px-5 py-4">
          <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10">
            <Users className="size-4 text-chart-2" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Productivity by User
          </h3>
        </div>
        <div className="flex h-72 flex-col items-center justify-center gap-2 px-5">
          <p className="text-sm text-muted-foreground">
            No user data available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card transition-all duration-300 hover:border-border hover:shadow-md">
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-8 items-center justify-center rounded-lg bg-chart-2/10">
            <Users className="size-4 text-chart-2" />
          </div>
          <h3 className="text-sm font-semibold text-card-foreground">
            Productivity by User
          </h3>
        </div>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {data.length} {data.length === 1 ? "member" : "members"}
        </span>
      </div>
      <div className="px-5 py-4">
        <ChartContainer config={chartConfig} className="h-72 w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
            barGap={4}
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
              dataKey="userName"
              type="category"
              tickLine={false}
              axisLine={false}
              width={80}
              fontSize={12}
              tickFormatter={(value: string) =>
                value.length > 12 ? `${value.slice(0, 12)}...` : value
              }
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="completed"
              fill="#8b5cf6"
              radius={[0, 6, 6, 0]}
              barSize={14}
            />
            <Bar
              dataKey="totalAssigned"
              fill="#6366f1"
              radius={[0, 6, 6, 0]}
              barSize={14}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  );
}
