import { client } from "@kaneo/libs";
const base = import.meta.env.VITE_API_URL || "";

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

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

export type SessionType =
  | "half_session"
  | "full_session"
  | "social_event"
  | "flat";

export type Service = {
  id: string;
  workspaceId: string;
  name: string;
  pricePerPax: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ReservationService = {
  id: string;
  reservationId: string;
  serviceId: string;
  pax: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
  service?: Partial<Service> & { name: string };
};

export type RoomTariff = {
  id: string;
  workspaceId: string;
  eventRoomId: string;
  sessionType: SessionType;
  price: number | null;
  serviceChargePercent: number;
  modificationCharge: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roomName?: string;
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
  dateRange: string;
  notes?: string | null;
  paymentConfirmed?: boolean | null;
  roomTariffId?: string | null;
  totalRoomPrice?: number | null;
  totalServicePrice?: number | null;
  serviceChargeAmount?: number | null;
  grandTotal?: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  roomName?: string;
  roomCapacity?: number;
  services?: ReservationService[];
  dayTariffs?: DayTariff[];
};

export type DayTariff = {
  id: string;
  reservationId: string;
  date: string;
  roomTariffId: string | null;
  price: number;
  createdAt: string;
  sessionType: string | null;
};

export type DateRange = { from: string; to?: string };

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
  dateRange: DateRange;
  notes?: string;
  roomTariffId?: string;
  totalRoomPrice?: number;
  totalServicePrice?: number;
  serviceChargeAmount?: number;
  grandTotal?: number;
  services?: {
    serviceId: string;
    pax: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  dayTariffs?: {
    date: string;
    roomTariffId: string;
    price: number;
  }[];
};

export type UpdateReservationPayload = {
  eventRoomId?: string;
  title?: string;
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  dateRange?: DateRange;
  notes?: string;
  paymentConfirmed?: boolean;
  roomTariffId?: string;
  totalRoomPrice?: number;
  totalServicePrice?: number;
  serviceChargeAmount?: number;
  grandTotal?: number;
  services?: {
    serviceId: string;
    pax: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  dayTariffs?: {
    date: string;
    roomTariffId: string;
    price: number;
  }[];
  status?: "pending" | "confirmed" | "completed";
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

export const getServices = async (
  workspaceId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<Service>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  const url = `${base ? base : ""}/event-room/${workspaceId}/gastronomic-services?${params}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const getServiceById = async (id: string): Promise<Service> => {
  const url = `${base ? base : ""}/event-room/gastronomic-services/${id}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const createService = async (
  payload: Omit<Service, "id" | "createdAt" | "updatedAt">,
): Promise<Service> => {
  const url = `${base ? base : ""}/event-room/gastronomic-services`;
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

export const updateService = async (
  id: string,
  payload: Partial<
    Omit<Service, "id" | "workspaceId" | "createdAt" | "updatedAt">
  >,
): Promise<Service> => {
  const url = `${base ? base : ""}/event-room/gastronomic-services/${id}`;
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

export const deleteService = async (
  id: string,
): Promise<{ success: boolean }> => {
  const url = `${base ? base : ""}/event-room/gastronomic-services/${id}`;
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

export const getRoomTariffs = async (
  workspaceId: string,
  page = 1,
  limit = 10,
): Promise<PaginatedResponse<RoomTariff>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  const url = `${base ? base : ""}/event-room/${workspaceId}/room-tariffs?${params}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const getRoomTariffById = async (id: string): Promise<RoomTariff> => {
  const url = `${base ? base : ""}/event-room/room-tariffs/${id}`;
  const response = await fetch(url, { credentials: "include" });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const createRoomTariff = async (
  payload: Omit<RoomTariff, "id" | "createdAt" | "updatedAt" | "roomName">,
): Promise<RoomTariff> => {
  const url = `${base ? base : ""}/event-room/room-tariffs`;
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

export const updateRoomTariff = async (
  id: string,
  payload: Partial<
    Omit<
      RoomTariff,
      "id" | "workspaceId" | "createdAt" | "updatedAt" | "roomName"
    >
  >,
): Promise<RoomTariff> => {
  const url = `${base ? base : ""}/event-room/room-tariffs/${id}`;
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

export const deleteRoomTariff = async (
  id: string,
): Promise<{ success: boolean }> => {
  const url = `${base ? base : ""}/event-room/room-tariffs/${id}`;
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
