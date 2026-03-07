import { getEventRooms, getReservations } from "@/fetchers/event-room";
import { useQuery } from "@tanstack/react-query";

export function useGetEventRooms(workspaceId: string) {
  return useQuery({
    queryKey: ["event-rooms", workspaceId],
    queryFn: () => getEventRooms(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useGetReservations(
  workspaceId: string,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: ["reservations", workspaceId, startDate, endDate],
    queryFn: () => getReservations(workspaceId, startDate, endDate),
    enabled: !!workspaceId,
  });
}
