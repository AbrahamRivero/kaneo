import { client } from "@kaneo/libs";

export type EventRoom = {
  id: string;
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

export type Reservation = {
  id: string;
  workspaceId: string;
  eventRoomId: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  startDate: string;
  endDate: string;
  adultPax: number;
  childrenPax: number;
  notes?: string;
  paymentConfirmed: boolean;
  coffeeBreak: boolean;
  lunch: boolean;
  cocktail: boolean;
  canapes: boolean;
  openBar: boolean;
  status: "all" | "pending" | "confirmed" | "cancelled" | "completed";
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
};

export type UpdateEventRoomPayload = {
  name?: string;
  capacity?: number;
  description?: string;
};

export type CreateReservationPayload = {
  workspaceId: string;
  eventRoomId: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  startDate: string;
  endDate: string;
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
  clientName?: string;
  companyName?: string;
  phone?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
  adultPax?: number;
  childrenPax?: number;
  notes?: string;
  paymentConfirmed?: boolean;
  coffeeBreak?: boolean;
  lunch?: boolean;
  cocktail?: boolean;
  canapes?: boolean;
  openBar?: boolean;
  status?: "all" | "pending" | "confirmed" | "cancelled" | "completed";
};

export const getEventRooms = async (
  workspaceId: string,
): Promise<EventRoom[]> => {
  const response = await client.eventRoom[":workspaceId"].rooms.$get({
    param: { workspaceId },
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
  const response = await client.eventRoom.rooms.$post({
    json: payload,
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
  const response = await client.eventRoom.rooms[":id"].$put({
    param: { id },
    json: payload,
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
  const response = await client.eventRoom.rooms[":id"].$delete({
    param: { id },
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
): Promise<Reservation[]> => {
  const queryParams: Record<string, string> = {};
  if (startDate) queryParams.startDate = startDate;
  if (endDate) queryParams.endDate = endDate;

  const response = await client.eventRoom[":workspaceId"].reservations.$get({
    param: { workspaceId },
    query: Object.keys(queryParams).length > 0 ? queryParams : undefined,
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
  const response = await client.eventRoom.reservations.$post({
    json: payload,
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};

export const getReservation = async (id: string): Promise<Reservation> => {
  const response = await client.eventRoom.reservations[":id"].$get({
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
  const response = await client.eventRoom.reservations[":id"].$put({
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
  const response = await client.eventRoom.reservations[":id"].$delete({
    param: { id },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error);
  }

  return response.json();
};
