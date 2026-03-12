import { client } from "@kaneo/libs";
const base = import.meta.env.VITE_API_URL || "";

export type EventRoom = {
  id: string;
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string | null;
  allowsMultipleReservations?: boolean | null;
  createdAt: string;
  updatedAt: string;
};

export type Reservation = {
  id: string;
  workspaceId: string;
  eventRoomId: string;
  title?: string | null;
  clientName: string;
  companyName?: string | null;
  phone?: string | null;
  email?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  adultPax: number;
  childrenPax: number;
  notes?: string | null;
  paymentConfirmed?: boolean | null;
  coffeeBreak?: boolean | null;
  lunch?: boolean | null;
  cocktail?: boolean | null;
  canapes?: boolean | null;
  openBar?: boolean | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  roomName?: string;
  roomCapacity?: number;
};

export type CreateEventRoomPayload = {
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string;
  allowsMultipleReservations?: boolean;
};

export type UpdateEventRoomPayload = {
  name?: string;
  capacity?: number;
  description?: string;
  allowsMultipleReservations?: boolean;
};

export type CreateReservationPayload = {
  workspaceId: string;
  eventRoomId: string;
  title?: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  date: string;
  startTime: string;
  endTime: string;
  adultPax: number;
  childrenPax: number;
  notes?: string;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
};

export type UpdateReservationPayload = {
  eventRoomId?: string;
  title?: string;
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  adultPax?: number;
  childrenPax?: number;
  notes?: string;
  paymentConfirmed?: boolean;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
};

export const getEventRooms = async (
  workspaceId: string,
): Promise<EventRoom[]> => {
  const url = `${base ? base : ""}/event-room/${workspaceId}/rooms`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const getEventRoomById = async (id: string): Promise<EventRoom> => {
  const response = await client["event-room"].rooms[":id"].$get({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const createEventRoom = async (
  payload: CreateEventRoomPayload,
): Promise<EventRoom> => {
  const url = `${base ? base : ""}/event-room/rooms`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const updateEventRoom = async (
  id: string,
  payload: UpdateEventRoomPayload,
): Promise<EventRoom> => {
  const url = `${base ? base : ""}/event-room/rooms/${id}`;
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const deleteEventRoom = async (
  id: string,
): Promise<{ success: boolean }> => {
  const url = `${base ? base : ""}/event-room/rooms/${id}`;
  const response = await fetch(url, {
    method: "DELETE",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const getReservations = async (
  workspaceId: string,
  startDate?: string,
  endDate?: string,
  eventRoomId?: string,
): Promise<Reservation[]> => {
  const queryParams: Record<string, string> = {};
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;
  if (eventRoomId) queryParams.eventRoomId = eventRoomId;

  const url = new URLSearchParams(queryParams).toString();
  const baseUrl = `${base ? base : ""}/event-room/${workspaceId}/reservations`;
  const response = await fetch(`${baseUrl}${url ? `?${url}` : ""}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const createReservation = async (
  payload: CreateReservationPayload,
): Promise<Reservation> => {
  const response = await client["event-room"].reservations.$post({
    json: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const getReservation = async (id: string): Promise<Reservation> => {
  const response = await client["event-room"].reservations[":id"].$get({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const updateReservation = async (
  id: string,
  payload: UpdateReservationPayload,
): Promise<Reservation> => {
  const response = await client["event-room"].reservations[":id"].$put({
    param: { id },
    json: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const deleteReservation = async (
  id: string,
): Promise<{ success: boolean }> => {
  const response = await client["event-room"].reservations[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};
