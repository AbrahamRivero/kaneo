
import { cn } from "@/lib/cn";
import { TrendingDown, TrendingUp } from "lucide-react";

interface StatCard {
  title: string;
  value: number | string;
  change: number | null;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  isPercentage?: boolean;
}

interface SecondaryCard {
  title: string;
  value: number | string;
  change?: number | null;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  isAlert?: boolean;
}

function TrendIndicator({
  change,
  isPercentage,
}: {
  change: number | null;
  isPercentage?: boolean;
}) {
  if (change === null) return null;
  const isPositive = change >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tracking-tight",
        isPositive
          ? "bg-success/10 text-success"
          : "bg-destructive/10 text-destructive"
      )}
    >
      {isPositive ? (
        <TrendingUp className="size-3.5" />
      ) : (
        <TrendingDown className="size-3.5" />
      )}
      {isPositive ? "+" : ""}
      {change}
      {isPercentage ? "%" : ""}
    </span>
  );
}

function StatCardComponent({ card }: { card: StatCard }) {
  return (
    <div className="group relative rounded-xl border border-border/60 bg-card p-5 transition-all duration-300 hover:border-border hover:shadow-md">
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          {card.title}
        </p>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
            card.bgColor
          )}
        >
          {card.icon && <card.icon className={cn("size-5", card.color)} />}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-card-foreground">
          {card.value}
        </p>
        <TrendIndicator
          change={card.change}
          isPercentage={card.isPercentage}
        />
      </div>
    </div>
  );
}

function SecondaryCardComponent({ card }: { card: SecondaryCard }) {
  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card p-5 transition-all duration-300 hover:shadow-md",
        card.isAlert
          ? "border-destructive/30 hover:border-destructive/50"
          : "border-border/60 hover:border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-[13px] font-medium tracking-wide text-muted-foreground uppercase">
          {card.title}
        </p>
        <div
          className={cn(
            "flex size-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-105",
            card.bgColor
          )}
        >
          {card.icon && <card.icon className={cn("size-5", card.color)} />}
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="text-3xl font-semibold tracking-tight text-card-foreground">
          {card.value}
        </p>
        {card.change !== undefined && card.change !== null && (
          <TrendIndicator change={card.change} />
        )}
      </div>

      {card.subtitle && !card.change && (
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {card.subtitle}
        </p>
      )}
    </div>
  );
}

export { StatCardComponent, SecondaryCardComponent };
export type { StatCard, SecondaryCard };
