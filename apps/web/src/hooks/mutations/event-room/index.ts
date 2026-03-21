import {
  createEventRoom,
  createReservation,
  deleteEventRoom,
  deleteReservation,
  updateEventRoom,
  updateReservation,
} from "@/fetchers/event-room";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useCreateEventRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createEventRoom,
    onSuccess: (data) => {
      toast.success("Event room created successfully");
      queryClient.invalidateQueries({ queryKey: ["event-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["event-room", data.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateEventRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: { id: string; payload: Parameters<typeof updateEventRoom>[1] }) =>
      updateEventRoom(id, payload),
    onSuccess: (_data, variables) => {
      toast.success("Event room updated successfully");
      queryClient.invalidateQueries({ queryKey: ["event-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["event-room", variables.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteEventRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteEventRoom,
    onSuccess: () => {
      toast.success("Event room deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["event-rooms"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      toast.success("Reservation created successfully");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: { id: string; payload: Parameters<typeof updateReservation>[1] }) =>
      updateReservation(id, payload),
    onSuccess: (_data, variables) => {
      toast.success("Reservation updated successfully");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
      queryClient.invalidateQueries({
        queryKey: ["reservation", variables.id],
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteReservation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteReservation,
    onSuccess: () => {
      toast.success("Reservation deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
