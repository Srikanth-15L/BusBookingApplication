export interface Booking {
  bookingId: string;
  seats: string[];
}

export interface SeatPosition {
  row: number;
  column: string;
  distance: number;
}

export interface BoardingSequence {
  sequence: number;
  bookingId: string;
  seats: string[];
  maxDistance: number;
  minDistance: number;
}