import { describe, it, expect } from 'vitest';
import { renderHook, act, render, screen, fireEvent } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { useRoomAvailability } from '@/useRoomAvailability';
import { RoomSelector } from '@/components/Controls';
import { RoomSchedule } from '@/components/RoomSchedule';
import { filterRooms } from '@/filters';
import { checkAvailability, getRoomBookings } from '@/availability';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS, SAMPLE_CURRENT_MINUTES } from '@/data';
import type { Room } from '@/types';

const CURRENT = SAMPLE_CURRENT_MINUTES; // 630 (10:30)

describe('F5: room switching refreshes schedule and availability context', () => {
  function room(id: string): Room | undefined {
    return SAMPLE_ROOMS.find((r) => r.id === id);
  }

  it('roomBookings updates when the selected room changes', () => {
    const { result, rerender } = renderHook(
      ({ initialRoomId }) =>
        useRoomAvailability({
          rooms: SAMPLE_ROOMS,
          bookings: SAMPLE_BOOKINGS,
          currentMinutes: CURRENT,
          initialRoomId,
          initialStartLabel: '11:00',
          initialEndLabel: '12:00',
        }),
      { initialProps: { initialRoomId: 'r1' } }
    );

    // r1 has 2 bookings
    expect(result.current.roomBookings).toHaveLength(2);
    expect(result.current.selectedRoom?.id).toBe('r1');

    // switch to r3 which has 2 bookings (b3, b4)
    act(() => {
      result.current.setRoomId('r3');
    });
    rerender({ initialRoomId: 'r3' });

    expect(result.current.selectedRoom?.id).toBe('r3');
    expect(result.current.roomBookings).toHaveLength(2);
    expect(result.current.roomBookings.map((b) => b.id)).toEqual(['b3', 'b4']);
  });

  it('selecting a room via RoomSelector triggers onSelect with room id', () => {
    let selectedId = 'r1';
    const { rerender } = render(
      <RoomSelector
        rooms={filterRooms(SAMPLE_ROOMS, { minCapacity: 1, requiredEquipment: [] })}
        selectedId={selectedId}
        onSelect={(id) => { selectedId = id; }}
      />
    );
    const labBtn = screen.getByText('Lab 301').closest('button')!;
    fireEvent.click(labBtn);
    expect(selectedId).toBe('r5');

    // re-render with the new selected id and verify Lab 301 is highlighted
    rerender(
      <RoomSelector
        rooms={filterRooms(SAMPLE_ROOMS, { minCapacity: 1, requiredEquipment: [] })}
        selectedId={selectedId}
        onSelect={(id) => { selectedId = id; }}
      />
    );
    const labBtnAfter = screen.getByText('Lab 301').closest('button')!;
    expect(labBtnAfter.className).toContain('sky');
  });

  it('RoomSchedule renders bookings for the selected room only', () => {
    const r3Bookings = getRoomBookings(room('r3'), SAMPLE_BOOKINGS);
    const html = renderToString(
      <RoomSchedule bookings={r3Bookings} roomName="Room 201" currentMinutes={CURRENT} />
    );
    expect(html).toContain('Physics Lab');
    expect(html).toContain('Seminar');
    expect(html).not.toContain('CS Class');
  });

  it('clears the availability verdict when the time inputs change (R-02)', () => {
    const { result } = renderHook(() =>
      useRoomAvailability({
        rooms: SAMPLE_ROOMS,
        bookings: SAMPLE_BOOKINGS,
        currentMinutes: CURRENT,
        initialRoomId: 'r1',
        initialStartLabel: '11:00',
        initialEndLabel: '12:00',
      })
    );
    act(() => {
      result.current.handleCheck();
    });
    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.setStartLabel('11:30');
    });
    expect(result.current.result).toBeNull();
  });

  it('checkAvailability result differs for two rooms with the same time slot', () => {
    // 660–720 (11:00–12:00): r1 is free, r3 overlaps nothing but let's check r1 vs r1-overlap
    const r1 = room('r1')!;
    const r4 = room('r4')!;
    // r4 has booking b5: 600–660, so 660–720 touches at 660 => available
    const r1Result = checkAvailability({ start: 660, end: 720 }, r1, SAMPLE_BOOKINGS, CURRENT);
    const r4Result = checkAvailability({ start: 660, end: 720 }, r4, SAMPLE_BOOKINGS, CURRENT);
    expect(r1Result.available).toBe(true);
    expect(r4Result.available).toBe(true);
    expect(r1Result.reason).toContain('Room 101');
    expect(r4Result.reason).toContain('Room 202');
  });
});
