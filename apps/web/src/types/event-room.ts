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

export interface Reservation {
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationWithRoom extends Reservation {
  eventRoom: EventRoom;
}
