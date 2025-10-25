export enum SeatStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  OCCUPIED = 'OCCUPIED',
  MAINTENANCE = 'MAINTENANCE'
}

export interface Seat {
  id: string;
  seatNumber: string;
  floor: number;
  section: string;
  status: SeatStatus;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}
