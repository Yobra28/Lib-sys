export type ReservationStatus = 'PENDING' | 'APPROVED' | 'CANCELLED' | 'COMPLETED';

export interface Reservation {
  id: string;
  userId: string;
  seatId: string;
  reservationDate: string; // YYYY-MM-DD
  startTime: string;       // HH:mm
  endTime: string;         // HH:mm
  status: ReservationStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
