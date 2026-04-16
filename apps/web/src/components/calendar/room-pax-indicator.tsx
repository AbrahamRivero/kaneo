import type { EventRoom, Reservation } from "@/fetchers/event-room";

interface RoomPaxIndicatorProps {
  room: EventRoom;
  reservations: Reservation[];
}

function getCapacityColor(percentage: number): string {
  if (percentage < 70) return "bg-green-500";
  if (percentage < 90) return "bg-amber-500";
  return "bg-red-500";
}

export function RoomPaxIndicator({
  room,
  reservations,
}: RoomPaxIndicatorProps) {
  const roomReservations = reservations.filter(
    (res) => res.eventRoomId === room.id,
  );

  const totalPax = roomReservations.reduce((sum, res) => {
    if (res.expectedPax) {
      return sum + res.expectedPax;
    }
    return sum;
  }, 0);

  const capacity = room.capacity;
  const percentage = capacity > 0 ? (totalPax / capacity) * 100 : 0;
  const barColor = getCapacityColor(percentage);

  if (!room.allowsMultipleReservations || totalPax === 0) return null;

  return (
    <div className="flex flex-col gap-1 p-1.5 bg-muted/30 rounded-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-foreground truncate flex-1">
          {room.name}
        </span>
        <span className="text-[10px] font-bold text-muted-foreground">
          {totalPax}/{capacity}
        </span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300 rounded-full`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}
