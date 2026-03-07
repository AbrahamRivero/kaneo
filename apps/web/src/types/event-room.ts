export interface EventRoom {
  id: string;
  workspaceId: string;
  name: string;
  capacity: number;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reservation {
  id: string;
  workspaceId: string;
  eventRoomId: string;
  clientName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  startDate: Date;
  endDate: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface ReservationWithRoom extends Reservation {
  eventRoom: EventRoom;
}
