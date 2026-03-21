import {
  getEventRoomById,
  getEventRooms,
  getReservation,
  getReservations,
} from "@/fetchers/event-room";
import { useQuery } from "@tanstack/react-query";

export function useGetEventRooms(workspaceId: string) {
  return useQuery({
    queryKey: ["event-rooms", workspaceId],
    queryFn: () => getEventRooms(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useGetEventRoomById(id?: string) {
  return useQuery({
    queryKey: ["event-room", id],
    queryFn: () => getEventRoomById(id as string),
    enabled: Boolean(id),
  });
}

export function useGetReservations(workspaceId: string, date?: string) {
  return useQuery({
    queryKey: ["reservations", workspaceId, date],
    queryFn: () => getReservations(workspaceId, date),
    enabled: !!workspaceId,
  });
}

export function useGetReservationById(id?: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id as string),
    enabled: Boolean(id),
  });
}
