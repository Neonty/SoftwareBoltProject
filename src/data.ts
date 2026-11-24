import type { Room, Booking } from '@/types';

export const SAMPLE_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'Room 101',
    building: 'Engineering Block',
    capacity: 40,
    equipment: ['Projector', 'Whiteboard', 'AC'],
    blocked: false,
    bookings: [
      { id: 'b1', roomId: 'r1', start: 540, end: 600, bookedBy: 'CS Class' },
      { id: 'b2', roomId: 'r1', start: 720, end: 780, bookedBy: 'Study Group' },
    ],
  },
  {
    id: 'r2',
    name: 'Room 102',
    building: 'Engineering Block',
    capacity: 25,
    equipment: ['Whiteboard', 'AC'],
    blocked: true,
    bookings: [],
  },
  {
    id: 'r3',
    name: 'Room 201',
    building: 'Science Block',
    capacity: 60,
    equipment: ['Projector', 'Whiteboard', 'AC', 'Microphone'],
    blocked: false,
    bookings: [
      { id: 'b3', roomId: 'r3', start: 480, end: 540, bookedBy: 'Physics Lab' },
      { id: 'b4', roomId: 'r3', start: 900, end: 1020, bookedBy: 'Seminar' },
    ],
  },
  {
    id: 'r4',
    name: 'Room 202',
    building: 'Science Block',
    capacity: 30,
    equipment: ['Projector', 'AC'],
    blocked: false,
    bookings: [
      { id: 'b5', roomId: 'r4', start: 600, end: 660, bookedBy: 'Workshop' },
    ],
  },
  {
    id: 'r5',
    name: 'Lab 301',
    building: 'IT Block',
    capacity: 20,
    equipment: ['Whiteboard', 'Computers', 'AC'],
    blocked: false,
    bookings: [
      { id: 'b6', roomId: 'r5', start: 840, end: 900, bookedBy: 'Coding Club' },
    ],
  },
];

// Flat list derived from per-room bookings for backward compatibility with
// existing tests and checkAvailability callers.
export const SAMPLE_BOOKINGS: Booking[] = SAMPLE_ROOMS.flatMap((r) => r.bookings);

// Fictional "current time" — 10:30 AM (630 min) for demo consistency
export const SAMPLE_CURRENT_MINUTES = 630;

// Master list of equipment available across all rooms, for filter UI.
export const ALL_EQUIPMENT: string[] = Array.from(
  new Set(SAMPLE_ROOMS.flatMap((r) => r.equipment))
).sort();
