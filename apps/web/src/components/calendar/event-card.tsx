import { Avatar, AvatarImage } from "@/components/ui/avatar";
import type { Event } from "@/mock-data/events";
import { getEventDuration } from "./calendar-utils";

interface EventCardProps {
  event: Event;
  style: React.CSSProperties;
  onClick?: () => void;
}

export function EventCard({ event, style, onClick }: EventCardProps) {
  const duration = getEventDuration(event.startTime, event.endTime);
  const isVeryShortEvent = duration < 30;
  const isMediumEvent = duration >= 25 && duration < 60;
  const timeStr = `${event.startTime} - ${event.endTime}${
    event.timezone ? ` (${event.timezone})` : ""
  }`;
  const hasMultipleParticipants = event.participants.length > 3;

  if (isVeryShortEvent) {
    return (
// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
<div
        className="absolute left-2 right-2 bg-card border border-border rounded-lg px-2 py-1 z-10 flex items-center gap-1.5 cursor-pointer hover:bg-muted transition-colors"
        style={style}
        onClick={onClick}
      >
        <div className="size-1.5 rounded-full bg-cyan-500 shrink-0" />
        <h4 className="text-[10px] font-semibold text-foreground truncate flex-1">
          {event.title}
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
        <div className="flex flex-col gap-1 h-full">
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-cyan-500 shrink-0" />
            <h4 className="text-[10px] font-semibold text-foreground truncate flex-1">
              {event.title}
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
      <div className="flex flex-col gap-1 h-full">
        <div className="flex-1 min-h-0">
          <h4
            className={`text-xs font-semibold text-foreground mb-1 ${
              duration <= 60 ? "truncate whitespace-nowrap" : "line-clamp-2"
            }`}
          >
            {event.title}
          </h4>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-2">
            {timeStr}
          </p>

          {event.participants.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex -space-x-1.5">
                {event.participants.slice(0, 3).map((participant, idx) => (
                  <Avatar
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    key={idx}
                    className="size-5 border-2 border-background"
                  >
                    <AvatarImage
                      src={`https://api.dicebear.com/9.x/glass/svg?seed=${participant}`}
                    />
                  </Avatar>
                ))}
              </div>
              {hasMultipleParticipants && (
                <span className="text-[10px] text-muted-foreground">
                  +{event.participants.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
