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

export interface GastronomicService {
  id: string;
  workspaceId: string;
  name: string;
  pricePerPax: number | null;
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
  gastronomicServiceId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  gastronomicService?: GastronomicService;
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
  adultPax: number;
  childrenPax: number;
  notes?: string | null;
  paymentConfirmed?: boolean | null;
  roomTariffId?: string | null;
  totalRoomPrice?: number | null;
  totalServicePrice?: number | null;
  serviceChargeAmount?: number | null;
  grandTotal?: number | null;
  totalPax?: number | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  services?: ReservationService[];
  roomName?: string;
  roomCapacity?: number;
}

export interface ReservationWithRoom extends Reservation {
  eventRoom: EventRoom;
}
