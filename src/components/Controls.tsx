import { Clock, Users, MapPin, Monitor, SlidersHorizontal } from 'lucide-react';
import type { Room } from '@/types';

interface RoomSelectorProps {
  rooms: Room[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function RoomSelector({ rooms, selectedId, onSelect }: RoomSelectorProps) {
  if (rooms.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm font-semibold text-slate-600">No rooms match your filters</p>
        <p className="text-xs text-slate-400 mt-1">
          Try reducing the required capacity or equipment.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {rooms.map((room) => {
        const selected = room.id === selectedId;
        return (
          <button
            key={room.id}
            type="button"
            onClick={() => onSelect(room.id)}
            className={`text-left rounded-xl border p-3 transition-all duration-200 ${
              selected
                ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-500/20'
                : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-slate-50'
            } ${room.blocked ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">{room.name}</span>
              {room.blocked ? (
                <span className="text-xs font-bold uppercase tracking-wide text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  Blocked
                </span>
              ) : (
                <span className="text-xs font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Open
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {room.building}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {room.capacity} seats
              </span>
            </div>
            {room.equipment.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {room.equipment.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                  >
                    <Monitor className="w-2.5 h-2.5" /> {item}
                  </span>
                ))}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface FilterBarProps {
  minCapacity: number;
  onCapacityChange: (val: number) => void;
  equipmentOptions: string[];
  selectedEquipment: string[];
  onToggleEquipment: (item: string) => void;
  matchCount: number;
}

export function FilterBar({
  minCapacity,
  onCapacityChange,
  equipmentOptions,
  selectedEquipment,
  onToggleEquipment,
  matchCount,
}: FilterBarProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <span className="text-sm font-semibold text-slate-700">Filter Rooms</span>
        <span className="ml-auto text-xs text-slate-400">{matchCount} match{matchCount === 1 ? '' : 'es'}</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Minimum Capacity (attendees)
        </label>
        <input
          type="number"
          min={1}
          max={200}
          value={minCapacity}
          onChange={(e) => onCapacityChange(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Required Equipment
        </label>
        <div className="flex flex-wrap gap-1.5">
          {equipmentOptions.map((item) => {
            const active = selectedEquipment.includes(item);
            return (
              <button
                key={item}
                type="button"
                onClick={() => onToggleEquipment(item)}
                className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                  active
                    ? 'bg-sky-600 text-white border border-sky-600'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-sky-300'
                }`}
              >
                <Monitor className="w-3 h-3" /> {item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface TimePickerProps {
  startLabel: string;
  endLabel: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
}

export function TimePicker({ startLabel, endLabel, onStartChange, onEndChange }: TimePickerProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Start Time
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="time"
            value={startLabel}
            onChange={(e) => onStartChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          End Time
        </label>
        <div className="relative">
          <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="time"
            value={endLabel}
            onChange={(e) => onEndChange(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-slate-800 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 outline-none transition"
          />
        </div>
      </div>
    </div>
  );
}
