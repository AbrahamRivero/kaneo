import {
  getAllServices,
  getAgeGroupTariffById,
  getAgeGroupTariffs,
  getEventRoomById,
  getEventRooms,
  getReservation,
  getReservations,
  getRoomTariffById,
  getRoomTariffs,
  getServiceById,
  getServices,
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
    refetchInterval: 7000,
  });
}

export function useGetReservationById(id?: string) {
  return useQuery({
    queryKey: ["reservation", id],
    queryFn: () => getReservation(id as string),
    enabled: Boolean(id),
  });
}

export function useGetServices(
  workspaceId: string,
  page = 1,
  limit = 10,
  search?: string,
) {
  return useQuery({
    queryKey: ["services", workspaceId, page, limit, search],
    queryFn: () => getServices(workspaceId, page, limit, search),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetServiceById(id?: string) {
  return useQuery({
    queryKey: ["service", id],
    queryFn: () => getServiceById(id as string),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetRoomTariffs(workspaceId: string, page = 1, limit = 10) {
  return useQuery({
    queryKey: ["room-tariffs", workspaceId, page, limit],
    queryFn: () => getRoomTariffs(workspaceId, page, limit),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetRoomTariffById(id?: string) {
  return useQuery({
    queryKey: ["room-tariff", id],
    queryFn: () => getRoomTariffById(id as string),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetAgeGroupTariffs(
  workspaceId: string,
  eventRoomId?: string,
  page = 1,
  limit = 10,
) {
  return useQuery({
    queryKey: ["age-group-tariffs", workspaceId, eventRoomId, page, limit],
    queryFn: () => getAgeGroupTariffs(workspaceId, eventRoomId, page, limit),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetAgeGroupTariffById(id?: string) {
  return useQuery({
    queryKey: ["age-group-tariff", id],
    queryFn: () => getAgeGroupTariffById(id as string),
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnMount: "always",
  });
}

export function useGetAllServices(workspaceId: string, search?: string) {
  return useQuery({
    queryKey: ["all-services", workspaceId, search],
    queryFn: () => getAllServices(workspaceId, search),
    enabled: !!workspaceId,
    staleTime: 0,
    refetchOnMount: "always",
  });
}
