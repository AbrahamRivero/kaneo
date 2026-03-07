import type { Reservation } from "@/fetchers/event-room";
import { CheckCheck, CheckCircle, Clock, XCircle } from "lucide-react";
import { getEventDuration } from "./calendar-utils";

interface EventCardProps {
  event: Reservation;
  style: React.CSSProperties;
  onClick?: () => void;
}

function getStatusIcon(status?: string) {
  switch (status) {
    case "confirmed":
      return <CheckCircle className="size-3 text-green-500" />;
    case "pending":
      return <Clock className="size-3 text-amber-500" />;
    case "cancelled":
      return <XCircle className="size-3 text-red-500" />;
    case "completed":
      return <CheckCheck className="size-3 text-blue-500" />;
    default:
      return null;
  }
}

export function EventCard({ event, style, onClick }: EventCardProps) {
  const duration = getEventDuration(event.startTime, event.endTime);
  const isVeryShortEvent = duration < 30;
  const isMediumEvent = duration >= 25 && duration < 60;
  const timeStr = `${event.startTime} - ${event.endTime}`;
  const subtitle = event.companyName
    ? `${event.clientName} - ${event.companyName}`
    : event.clientName;
  const statusIcon = getStatusIcon(event.status);

  if (isVeryShortEvent) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
      <div
        className="absolute left-2 right-2 bg-card border border-border rounded-lg px-2 py-1 z-10 flex items-center gap-1.5 cursor-pointer hover:bg-muted transition-colors"
        style={style}
        onClick={onClick}
      >
        {statusIcon && (
          <div className="absolute -top-1 -left-1 bg-white rounded-full">{statusIcon}</div>
        )}
        <div className="size-1.5 rounded-full bg-cyan-500 shrink-0" />
        <h4 className="text-[10px] font-semibold text-foreground truncate flex-1">
          {event.title || subtitle}
        </h4>
        <span className="text-[9px] text-muted-foreground shrink-0">
          {event.startTime}
        </span>
      </div>
    );
  }

  if (isMediumEvent) {
    return (
      // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
      <div
        className="absolute left-2 right-2 bg-card border border-border rounded-lg px-2.5 py-2 z-10 cursor-pointer hover:bg-muted transition-colors"
        style={style}
        onClick={onClick}
      >
        {statusIcon && (
          <div className="absolute -top-1 -left-1 bg-white rounded-full">{statusIcon}</div>
        )}
        <div className="flex flex-col gap-1 h-full">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-cyan-500 shrink-0" />
            <h4 className="text-[10px] font-semibold text-foreground truncate flex-1">
              {event.title || subtitle}
            </h4>
          </div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wide">
            {timeStr}
          </p>
        </div>
      </div>
    );
  }

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
    <div
      className="absolute left-2 right-2 bg-card border border-border rounded-lg p-3 z-10 cursor-pointer hover:bg-muted transition-colors"
      style={style}
      onClick={onClick}
    >
      {statusIcon && (
        <div className="absolute -top-1 -left-1 bg-white rounded-full">{statusIcon}</div>
      )}
      <div className="flex flex-col gap-1 h-full">
        <div className="flex items-start justify-between gap-1">
          <h4
            className={`text-xs font-semibold text-foreground mb-1 ${
              duration <= 60 ? "truncate whitespace-nowrap" : "line-clamp-2"
            } flex-1`}
          >
            {event.title || subtitle}
          </h4>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
          {timeStr}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
