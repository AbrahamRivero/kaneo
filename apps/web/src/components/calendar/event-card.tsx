import type { DateRange, Reservation } from "@/fetchers/event-room";
import { format } from "date-fns";
import {
  Banknote,
  CheckCheck,
  CheckCircle,
  Clock,
  Users,
  XCircle,
} from "lucide-react";

interface EventCardProps {
  event: Reservation;
  onClick?: () => void;
  style?: React.CSSProperties;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="size-3 text-green-500" />;
    case "pending":
      return <Clock className="size-3 text-amber-500" />;
    case "cancelled":
      return <XCircle className="size-3 text-red-500 dark:text-red-400" />;
    case "completed":
      return <CheckCheck className="size-3 text-blue-500" />;
    default:
      return null;
  }
}

function parseDateRange(dateRangeStr: string): DateRange {
  try {
    return JSON.parse(dateRangeStr) as DateRange;
  } catch {
    return { from: "", to: "" };
  }
}

export function EventCard({ event, onClick, style }: EventCardProps) {
  const dateRange = parseDateRange(event.dateRange);
  const dateStr =
    dateRange.from === dateRange.to || !dateRange.to
      ? format(new Date(`${dateRange.from}T00:00:00`), "MMM d")
      : `${format(new Date(`${dateRange.from}T00:00:00`), "MMM d")} - ${format(new Date(`${dateRange.to}T00:00:00`), "MMM d")}`;
  const subtitle = event.companyName
    ? `${event.clientName} - ${event.companyName}`
    : event.clientName;
  const statusIcon = getStatusIcon(event.status);
  const totalGuests = event.adultPax + event.childrenPax;
  const hasGuests = totalGuests > 0;

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="relative bg-card border border-border rounded-lg p-3 z-10 cursor-pointer hover:bg-muted transition-colors"
      style={style}
      onClick={onClick}
    >
      <div className="absolute -top-1.5 -left-1.5 flex gap-0.5">
        {statusIcon && (
          <div className="bg-background rounded-full shadow-sm">
            {statusIcon}
          </div>
        )}
        {event.paymentConfirmed && (
          <div className="bg-background rounded-full">
            <Banknote className="size-3 text-green-600 dark:text-green-400" />
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 h-full">
        <div className="flex items-start justify-between gap-1">
          <h4 className="text-xs font-semibold text-foreground mb-1 truncate whitespace-nowrap flex-1">
            {event.title || event.clientName}
          </h4>
          {hasGuests && (
            <div className="flex items-center gap-0.5 shrink-0 bg-muted px-1.5 py-0.5 rounded">
              <Users className="size-3 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground font-medium">
                {totalGuests}
              </span>
            </div>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
          {dateStr}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground truncate">
            {subtitle}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground font-semibold truncate">
          {event.roomName}
        </p>
      </div>
    </div>
  );
}
