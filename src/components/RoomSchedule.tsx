import { minutesToLabel } from '@/availability';
import type { Booking } from '@/types';

interface ScheduleProps {
  bookings: Booking[];
  roomName: string;
  currentMinutes: number;
}

export function RoomSchedule({ bookings, roomName, currentMinutes }: ScheduleProps) {
  if (bookings.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No existing bookings for {roomName}.
      </p>
    );
  }

  const sorted = [...bookings].sort((a, b) => a.start - b.start);

  return (
    <div className="space-y-1.5">
      {sorted.map((b) => (
        <div
          key={b.id}
          className="flex items-center justify-between rounded-lg bg-slate-100 px-3 py-2 text-sm"
        >
          <span className="font-medium text-slate-700">{b.bookedBy}</span>
          <span className="text-slate-500 tabular-nums">
            {minutesToLabel(b.start)} – {minutesToLabel(b.end)}
          </span>
        </div>
      ))}
      <p className="text-xs text-slate-400 pt-1">
        Current time: {minutesToLabel(currentMinutes)}
      </p>
    </div>
  );
}
