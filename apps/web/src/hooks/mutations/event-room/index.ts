import {
  createAgeGroupTariff,
  createEventRoom,
  createReservation,
  createRoomTariff,
  createService,
  deleteAgeGroupTariff,
  deleteEventRoom,
  deleteReservation,
  deleteRoomTariff,
  deleteService,
  updateAgeGroupTariff,
  updateEventRoom,
  updatePaymentStatus,
  updateReservation,
  updateRoomTariff,
  updateService,
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

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createService,
    onSuccess: async (data) => {
      toast.success("Service created successfully");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["services"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["service", data.id],
          refetchType: "all",
        }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateService>[1];
    }) => updateService(id, payload),
    onSuccess: async (_data, variables) => {
      toast.success("Service updated successfully");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["services"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["service", variables.id],
          refetchType: "all",
        }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteService,
    onSuccess: async () => {
      toast.success("Service deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["services"],
        refetchType: "all",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateRoomTariff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRoomTariff,
    onSuccess: async (data) => {
      toast.success("Room tariff created successfully");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["room-tariffs"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["room-tariff", data.id],
          refetchType: "all",
        }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateRoomTariff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateRoomTariff>[1];
    }) => updateRoomTariff(id, payload),
    onSuccess: async (_data, variables) => {
      toast.success("Room tariff updated successfully");
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["room-tariffs"],
          refetchType: "all",
        }),
        queryClient.invalidateQueries({
          queryKey: ["room-tariff", variables.id],
          refetchType: "all",
        }),
      ]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteRoomTariff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRoomTariff,
    onSuccess: async () => {
      toast.success("Room tariff deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["room-tariffs"],
        refetchType: "all",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      paymentConfirmed,
    }: {
      id: string;
      paymentConfirmed: boolean;
    }) => updatePaymentStatus(id, paymentConfirmed),
    onSuccess: () => {
      toast.success("Payment status updated");
      queryClient.invalidateQueries({ queryKey: ["reservations"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useCreateAgeGroupTariff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAgeGroupTariff,
    onSuccess: () => {
      toast.success("Age group tariff created successfully");
      queryClient.invalidateQueries({ queryKey: ["age-group-tariffs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateAgeGroupTariff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof updateAgeGroupTariff>[1];
    }) => updateAgeGroupTariff(id, payload),
    onSuccess: () => {
      toast.success("Age group tariff updated successfully");
      queryClient.invalidateQueries({ queryKey: ["age-group-tariffs"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

export function useDeleteAgeGroupTariff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAgeGroupTariff,
    onSuccess: async () => {
      toast.success("Age group tariff deleted successfully");
      await queryClient.invalidateQueries({
        queryKey: ["age-group-tariffs"],
        refetchType: "all",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
