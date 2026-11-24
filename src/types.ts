export interface Room {
  id: string;
  name: string;
  building: string;
  capacity: number;
  equipment: string[];
  blocked: boolean;
  bookings: Booking[];
}

export interface Booking {
  id: string;
  roomId: string;
  start: number; // minutes since midnight
  end: number;   // minutes since midnight
  bookedBy: string;
}

export interface AvailabilityResult {
  available: boolean;
  reason: string;
}

export interface Interval {
  start: number;
  end: number;
}
