export interface EventRoom {
  id: string;
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string | null;
  allowsMultipleReservations?: boolean | null;
  createdAt: Date;
  updatedAt: Date;
}

export type DateRange = { from: string; to?: string };

export type SessionType =
  | "half_session"
  | "full_session"
  | "social_event"
  | "flat";

export interface Service {
  id: string;
  workspaceId: string;
  name: string;
  pricePerPax: number | null;
  serviceChargePercent: number;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoomTariff {
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
}

export interface ReservationService {
  id: string;
  reservationId: string;
  serviceId: string;
  pax: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  service?: Service;
}

export interface DayTariff {
  id: string;
  reservationId: string;
  date: string;
  roomTariffId: string | null;
  price: number;
  createdAt: string;
  sessionType: string | null;
}

export interface Reservation {
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
  roomChargeAmount?: number | null;
  serviceChargeAmount?: number | null;
  grandTotal?: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  services?: ReservationService[];
  dayTariffs?: DayTariff[];
  roomName?: string;
  roomCapacity?: number;
}

export interface ReservationWithRoom extends Reservation {
  eventRoom: EventRoom;
}
