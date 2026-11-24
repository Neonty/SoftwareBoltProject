import type { Room, Booking, Interval, AvailabilityResult } from '@/types';

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return NaN;
  return h * 60 + m;
}

export function overlaps(a: Interval, b: Interval): boolean {
  // touching endpoints are allowed => overlap only when strictly interleaved
  return a.start < b.end && b.start < a.end;
}

export function getRoomBookings(room: Room | undefined, bookings: Booking[]): Booking[] {
  if (room && room.bookings.length > 0) {
    return room.bookings;
  }
  const roomId = room?.id ?? '';
  return bookings.filter((b) => b.roomId === roomId);
}

export function checkAvailability(
  interval: Interval,
  room: Room | undefined,
  bookings: Booking[],
  currentMinutes: number
): AvailabilityResult {
  const { start, end } = interval;

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return { available: false, reason: 'Please enter valid start and end times.' };
  }

  // AC1: 0 ≤ start < end ≤ 1440, and start after current time
  if (start < 0 || end > 1440) {
    return { available: false, reason: 'Time must be between 00:00 and 24:00.' };
  }
  if (start >= end) {
    return { available: false, reason: 'Start time must be earlier than end time.' };
  }
  if (start <= currentMinutes) {
    return { available: false, reason: `Start time must be after the current time (${minutesToLabel(currentMinutes)}).` };
  }

  // AC2: reject bookings longer than 120 minutes
  if (end - start > 120) {
    return { available: false, reason: 'Booking cannot be longer than 120 minutes.' };
  }

  if (!room) {
    return { available: false, reason: 'Please select a room.' };
  }

  // AC3: reject when room is blocked
  if (room.blocked) {
    return { available: false, reason: `${room.name} is currently blocked and unavailable.` };
  }

  // AC4: reject overlapping intervals (touching allowed)
  const roomBookings = getRoomBookings(room, bookings);
  const conflict = roomBookings.find((b) => overlaps(interval, b));
  if (conflict) {
    return {
      available: false,
      reason: `Overlaps an existing booking (${minutesToLabel(conflict.start)}–${minutesToLabel(conflict.end)}, ${conflict.bookedBy}).`,
    };
  }

  return { available: true, reason: `${room.name} is available for this time slot.` };
}
