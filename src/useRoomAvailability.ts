import { useState, useMemo, useEffect, useCallback } from 'react';
import type { AvailabilityResult, Room, Booking } from '@/types';
import { checkAvailability, labelToMinutes, getRoomBookings } from '@/availability';
import { filterRooms, type RoomFilter } from '@/filters';

interface UseRoomAvailabilityArgs {
  rooms: Room[];
  bookings: Booking[];
  currentMinutes: number;
  initialRoomId: string;
  initialStartLabel: string;
  initialEndLabel: string;
}

export function useRoomAvailability({
  rooms,
  bookings,
  currentMinutes,
  initialRoomId,
  initialStartLabel,
  initialEndLabel,
}: UseRoomAvailabilityArgs) {
  const [minCapacity, setMinCapacity] = useState<number>(1);
  const [requiredEquipment, setRequiredEquipment] = useState<string[]>([]);
  const [roomId, setRoomId] = useState<string>(initialRoomId);
  const [startLabel, setStartLabel] = useState(initialStartLabel);
  const [endLabel, setEndLabel] = useState(initialEndLabel);
  const [result, setResult] = useState<AvailabilityResult | null>(null);

  const start = labelToMinutes(startLabel);
  const end = labelToMinutes(endLabel);
  const duration = end - start;

  const filter: RoomFilter = useMemo(
    () => ({ minCapacity, requiredEquipment }),
    [minCapacity, requiredEquipment]
  );

  const filteredRooms = useMemo(() => filterRooms(rooms, filter), [rooms, filter]);

  // Clear a stale verdict whenever any input it was computed against changes.
  useEffect(() => {
    setResult(null);
  }, [startLabel, endLabel, roomId]);

  // F5: when filters change and the currently selected room is no longer in the
  // filtered list, auto-select the first matching room (or clear if none).
  useEffect(() => {
    const stillVisible = filteredRooms.some((r) => r.id === roomId);
    if (!stillVisible) {
      const next = filteredRooms[0];
      setRoomId(next ? next.id : '');
    }
  }, [filteredRooms, roomId]);

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === roomId),
    [rooms, roomId]
  );

  const roomBookings = useMemo(
    () => getRoomBookings(selectedRoom, bookings),
    [bookings, selectedRoom]
  );

  const handleCheck = useCallback(() => {
    const r = checkAvailability({ start, end }, selectedRoom, bookings, currentMinutes);
    setResult(r);
  }, [start, end, selectedRoom, bookings, currentMinutes]);

  const handleReset = useCallback(() => {
    setResult(null);
  }, []);

  const toggleEquipment = useCallback((item: string) => {
    setRequiredEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  }, []);

  return {
    minCapacity,
    setMinCapacity,
    requiredEquipment,
    toggleEquipment,
    filteredRooms,
    roomId,
    setRoomId,
    startLabel,
    setStartLabel,
    endLabel,
    setEndLabel,
    result,
    start,
    end,
    duration,
    selectedRoom,
    roomBookings,
    handleCheck,
    handleReset,
  };
}
