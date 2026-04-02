import type { DateRange, Reservation } from "@/fetchers/event-room";
import { format } from "date-fns";
import { Banknote, CheckCheck, CheckCircle, Clock, Users } from "lucide-react";

interface EventCardProps {
  event: Reservation;
  onClick?: () => void;
  style?: React.CSSProperties;
  allowsMultipleReservations?: boolean;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="size-3 text-green-500" />;
    case "pending":
      return <Clock className="size-3 text-amber-500" />;
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

export function EventCard({
  event,
  onClick,
  style,
  allowsMultipleReservations,
}: EventCardProps) {
  const dateRange = parseDateRange(event.dateRange);
  const dateStr =
    dateRange.from === dateRange.to || !dateRange.to
      ? format(new Date(`${dateRange.from}T00:00:00`), "MMM d")
      : `${format(new Date(`${dateRange.from}T00:00:00`), "MMM d")} - ${format(new Date(`${dateRange.to}T00:00:00`), "MMM d")}`;
  const statusIcon = getStatusIcon(event.status);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="relative bg-card border border-border rounded-lg p-2 z-10 cursor-pointer hover:bg-muted transition-colors w-full"
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
      <div className="flex flex-col gap-0.5 h-full">
        {event.title ? (
          <>
            <h4 className="text-xs font-semibold text-foreground truncate">
              {event.title}
            </h4>
            <p className="text-[9px] text-muted-foreground truncate">
              {event.clientName}
            </p>
            {event.companyName && (
              <p className="text-[9px] text-muted-foreground truncate">
                {event.companyName}
              </p>
            )}
          </>
        ) : (
          <p className="text-xs font-semibold text-foreground truncate">
            {event.clientName}
          </p>
        )}

        <p className="text-[10px] text-muted-foreground font-semibold truncate">
          {event.roomName}
        </p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
          {dateStr}
        </p>
        {allowsMultipleReservations && (event.expectedPax ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <Users className="size-3" />
            <span>{event.expectedPax}</span>
          </div>
        )}
      </div>
    </div>
  );
}
