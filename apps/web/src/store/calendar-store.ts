import type { Reservation } from "@/types/event-room";
import { addDays, addWeeks, startOfWeek, subWeeks } from "date-fns";
import { create } from "zustand";

interface CalendarState {
  currentWeekStart: Date;
  searchQuery: string;
  reservationStatusFilter:
    | "all"
    | "pending"
    | "confirmed"
    | "cancelled"
    | "completed";
  goToNextWeek: () => void;
  goToPreviousWeek: () => void;
  goToToday: () => void;
  goToDate: (date: Date) => void;
  setSearchQuery: (query: string) => void;
  setReservationStatusFilter: (
    filter: "all" | "pending" | "confirmed" | "cancelled" | "completed",
  ) => void;
  getCurrentWeekReservations: (
    weekReservations: Reservation[],
  ) => Reservation[];
  getWeekDays: () => Date[];
}

/* function getDayOfWeek(date: Date): number {
  const day = getDay(date);
  return day === 0 ? 6 : day - 1;
} */

/* function getReservationsForWeek(startDate: Date): Reservation[] {
  const weekReservations: Reservation[] = [];

  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(startDate, i);
    const currentDayOfWeek = getDayOfWeek(currentDay);

    for (const reservation of reservations) {
      const reservationDate = new Date(reservation.date);
      const reservationDayOfWeek = getDayOfWeek(reservationDate);

      if (reservationDayOfWeek === currentDayOfWeek) {
        const eventDateStr = format(currentDay, "yyyy-MM-dd");
        weekReservations.push({
          ...reservation,
          id: `${reservation.id}-${eventDateStr}`,
          date: eventDateStr,
        });
      }
    };
  }

  return weekReservations;
} */

export const useCalendarStore = create<CalendarState>((set, get) => ({
  currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
  searchQuery: "",
  reservationStatusFilter: "all",

  goToNextWeek: () =>
    set((state) => ({
      currentWeekStart: addWeeks(state.currentWeekStart, 1),
    })),

  goToPreviousWeek: () =>
    set((state) => ({
      currentWeekStart: subWeeks(state.currentWeekStart, 1),
    })),

  goToToday: () =>
    set({
      currentWeekStart: startOfWeek(new Date(), { weekStartsOn: 1 }),
    }),

  goToDate: (date: Date) =>
    set({
      currentWeekStart: startOfWeek(date, { weekStartsOn: 1 }),
    }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setReservationStatusFilter: (
    filter: "all" | "pending" | "confirmed" | "cancelled" | "completed",
  ) => set({ reservationStatusFilter: filter }),

  getCurrentWeekReservations: (weekReservations: Reservation[]) => {
    const state = get();
    let filterWeekReservations: Reservation[] = weekReservations || [];

    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filterWeekReservations = filterWeekReservations.filter((reservation) =>
        reservation.companyName
          ? reservation.companyName.toLowerCase().includes(query)
          : reservation.clientName.toLowerCase().includes(query),
      );
    }

    if (state.reservationStatusFilter === "all") {
      filterWeekReservations = filterWeekReservations.filter(
        (event) => event.status === "pending" || event.status === "confirmed",
      );
    } else if (state.reservationStatusFilter === "pending") {
      filterWeekReservations = filterWeekReservations.filter(
        (event) => event.status === "pending",
      );
    } else if (state.reservationStatusFilter === "confirmed") {
      filterWeekReservations = filterWeekReservations.filter(
        (event) => event.status === "confirmed",
      );
    } else if (state.reservationStatusFilter === "cancelled") {
      filterWeekReservations = filterWeekReservations.filter(
        (event) => event.status === "cancelled",
      );
    } else if (state.reservationStatusFilter === "completed") {
      filterWeekReservations = filterWeekReservations.filter(
        (event) => event.status === "completed",
      );
    }

    return filterWeekReservations;
  },

  getWeekDays: () => {
    const state = get();
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(state.currentWeekStart, i));
    }
    return days;
  },
}));
