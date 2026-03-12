import type { Reservation } from "@/fetchers/event-room";
import {
  Banknote,
  CheckCheck,
  CheckCircle,
  Clock,
  Coffee,
  Users,
  Utensils,
  Wine,
  XCircle,
} from "lucide-react";
import { getEventDuration } from "./calendar-utils";

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

function getServiceIcons(event: Reservation) {
  const icons = [];
  if (event.coffeeBreak)
    icons.push(
      <Coffee
        key="coffee"
        className="size-2.5 text-amber-600 dark:text-amber-500"
      />,
    );
  if (event.lunch)
    icons.push(<Utensils key="lunch" className="size-2.5 text-orange-600" />);
  if (event.cocktail || event.canapes)
    icons.push(<Wine key="cocktail" className="size-2.5 text-purple-600" />);
  return icons;
}

export function EventCard({ event, onClick, style }: EventCardProps) {
  const duration = getEventDuration(event.startTime, event.endTime);
  const timeStr = `${event.startTime} - ${event.endTime}`;
  const subtitle = event.companyName
    ? `${event.clientName} - ${event.companyName}`
    : event.clientName;
  const statusIcon = getStatusIcon(event.status);
  const serviceIcons = getServiceIcons(event);
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
          <h4
            className={`text-xs font-semibold text-foreground mb-1 ${
              duration <= 60 ? "truncate whitespace-nowrap" : "line-clamp-2"
            } flex-1`}
          >
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
          {timeStr}
        </p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground truncate">
            {subtitle}
          </p>
        )}

        <p className="text-[11px] text-muted-foreground font-semibold truncate">
          {event.roomName}
        </p>

        {serviceIcons.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-border/50">
            <div className="flex gap-1">{serviceIcons}</div>
          </div>
        )}
      </div>
    </div>
  );
}
