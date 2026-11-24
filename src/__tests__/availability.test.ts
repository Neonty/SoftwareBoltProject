import { describe, it, expect } from 'vitest';
import {
  checkAvailability,
  overlaps,
  minutesToLabel,
  labelToMinutes,
} from '@/availability';
import { filterRooms } from '@/filters';
import { SAMPLE_ROOMS, SAMPLE_BOOKINGS, SAMPLE_CURRENT_MINUTES, ALL_EQUIPMENT } from '@/data';
import type { Room, Booking, Interval } from '@/types';

const CURRENT = SAMPLE_CURRENT_MINUTES; // 630 (10:30)

function room(id: string): Room | undefined {
  return SAMPLE_ROOMS.find((r) => r.id === id);
}

describe('AC1: reject start >= end and past requests', () => {
  // AC1 requires 0 <= start < end <= 1440 and start > current_time.
  // A start time before the current clock means the request is in the past,
  // which must be rejected even if ordering and range are otherwise valid.
  it('rejects a start time at or before the current time (past request)', () => {
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 600, end: 660 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(false);
    expect(result.reason).toContain('after the current time');
  });

  // AC1 requires start < end. When the interval is reversed the booking is
  // invalid regardless of range or room selection.
  it('rejects a reversed interval (start >= end)', () => {
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 720, end: 660 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(false);
    expect(result.reason).toContain('Start time must be earlier than end time');
  });
});

describe('AC2: reject bookings longer than 120 minutes', () => {
  // AC2 caps duration at 120 minutes. A 121-minute request exceeds the cap by
  // exactly one minute and must be rejected, while a 120-minute request is the
  // boundary that should be accepted (when no other AC fails).
  it('rejects a 121-minute booking', () => {
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 660, end: 781 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(false);
    expect(result.reason).toContain('cannot be longer than 120 minutes');
  });

  it('accepts a 120-minute booking when no other AC fails', () => {
    // Room r4 has one booking 600–660. 660–780 touches at 660 and is 120 min.
    const r4 = room('r4')!;
    const result = checkAvailability(
      { start: 660, end: 780 },
      r4,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(true);
  });
});

describe('AC3: reject blocked rooms', () => {
  // AC3 requires that any room flagged as blocked is unavailable regardless of
  // the requested time. Room r2 is blocked in the sample data.
  it('rejects a blocked room even with a valid time slot', () => {
    const r2 = room('r2')!;
    const result = checkAvailability(
      { start: 660, end: 720 },
      r2,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(false);
    expect(result.reason).toContain('blocked');
  });
});

describe('AC4: reject overlaps, allow touching endpoints', () => {
  // AC4 rejects intervals that strictly interleave with an existing booking
  // (a.start < b.end && b.start < a.end). Room r1 has booking b1: 540–600 and
  // b2: 720–780. A request of 690–750 overlaps b2 (690 < 780 && 720 < 750).
  it('rejects an overlapping booking', () => {
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 690, end: 750 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(false);
    expect(result.reason).toContain('Overlaps an existing booking');
  });

  // AC4 explicitly allows intervals that touch only at endpoints. A request
  // ending exactly at an existing booking's start does not overlap, and a
  // request starting exactly at an existing booking's end does not overlap.
  it('allows a booking that touches an existing booking at the start endpoint', () => {
    // Request 660–720 starts at b2's start (720)? No — ends at 720 = b2.start.
    // 660 < 780 (b2.end) is true, but 720 < 720 is false => no overlap.
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 660, end: 720 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result.available).toBe(true);
  });

  it('allows a booking that touches an existing booking at the end endpoint', () => {
    // Request 600–660 starts at b1.end (600). 600 < 600 (b1.end) is false => no overlap.
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 600, end: 660 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    // start=600 <= CURRENT=630 => rejected by AC1 (past time).
    expect(result.available).toBe(false);
    expect(result.reason).toMatch(/after the current time/);

    // r5 booking b6: 840–900. Request 900–960 starts at b6.end.
    const r5 = room('r5')!;
    const result2 = checkAvailability(
      { start: 900, end: 960 },
      r5,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result2.available).toBe(true);
  });
});

describe('AC4 (unit): overlaps boundary logic', () => {
  // Directly tests the exported overlaps predicate to lock the boundary
  // semantics independently of checkAvailability's surrounding validation.
  it('returns false for intervals touching only at endpoints (a.end === b.start)', () => {
    const a: Interval = { start: 600, end: 660 };
    const b: Interval = { start: 660, end: 720 };
    expect(overlaps(a, b)).toBe(false);
  });

  it('returns false for intervals touching only at endpoints (a.start === b.end)', () => {
    const a: Interval = { start: 660, end: 720 };
    const b: Interval = { start: 600, end: 660 };
    expect(overlaps(a, b)).toBe(false);
  });

  it('returns true for partially overlapping intervals', () => {
    const a: Interval = { start: 690, end: 750 };
    const b: Interval = { start: 720, end: 780 };
    expect(overlaps(a, b)).toBe(true);
  });

  it('returns true for a fully-contained interval', () => {
    const a: Interval = { start: 730, end: 740 };
    const b: Interval = { start: 720, end: 780 };
    expect(overlaps(a, b)).toBe(true);
  });
});

describe('AC5: decision without mutating booking data', () => {
  // AC5 requires the availability decision to be returned without modifying
  // the bookings array or any booking object. We snapshot the bookings before
  // and after the call and assert deep equality.
  it('does not mutate the bookings array or its elements', () => {
    const r1 = room('r1')!;
    const snapshot: Booking[] = SAMPLE_BOOKINGS.map((b) => ({ ...b }));
    checkAvailability({ start: 660, end: 720 }, r1, SAMPLE_BOOKINGS, CURRENT);
    expect(SAMPLE_BOOKINGS).toEqual(snapshot);
  });

  it('returns a result object with available and reason fields', () => {
    const r1 = room('r1')!;
    const result = checkAvailability(
      { start: 660, end: 720 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    expect(result).toHaveProperty('available');
    expect(typeof result.available).toBe('boolean');
    expect(result).toHaveProperty('reason');
    expect(typeof result.reason).toBe('string');
  });
});

describe('AC6: validation feedback is clear and present on all rejections', () => {
  // AC6 requires clear validation feedback. Each rejection reason must be a
  // non-empty, human-readable string — not an empty string, null, or generic
  // error. This test covers all six rejection paths.
  it('returns a non-empty reason for every rejection path', () => {
    const r1 = room('r1')!;
    const r2 = room('r2')!;

    const reversed = checkAvailability(
      { start: 720, end: 660 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    const past = checkAvailability(
      { start: 600, end: 660 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    const tooLong = checkAvailability(
      { start: 660, end: 781 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    const blocked = checkAvailability(
      { start: 660, end: 720 },
      r2,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    const overlap = checkAvailability(
      { start: 690, end: 750 },
      r1,
      SAMPLE_BOOKINGS,
      CURRENT
    );
    const noRoom = checkAvailability(
      { start: 660, end: 720 },
      undefined,
      SAMPLE_BOOKINGS,
      CURRENT
    );

    for (const result of [reversed, past, tooLong, blocked, overlap, noRoom]) {
      expect(result.available).toBe(false);
      expect(result.reason).toBeTruthy();
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });
});

describe('Fixture integrity: sample data unchanged', () => {
  // Regression guard: the sample rooms and bookings must stay structurally
  // stable so that availability decisions remain deterministic across refactors.
  it('has exactly 5 sample rooms with expected IDs', () => {
    expect(SAMPLE_ROOMS).toHaveLength(5);
    expect(SAMPLE_ROOMS.map((r) => r.id)).toEqual([
      'r1',
      'r2',
      'r3',
      'r4',
      'r5',
    ]);
  });

  it('has exactly 6 sample bookings with expected IDs', () => {
    expect(SAMPLE_BOOKINGS).toHaveLength(6);
    expect(SAMPLE_BOOKINGS.map((b) => b.id)).toEqual([
      'b1',
      'b2',
      'b3',
      'b4',
      'b5',
      'b6',
    ]);
  });

  it('sets SAMPLE_CURRENT_MINUTES to 630 (10:30)', () => {
    expect(SAMPLE_CURRENT_MINUTES).toBe(630);
  });

  it('marks only r2 as blocked', () => {
    const blocked = SAMPLE_ROOMS.filter((r) => r.blocked);
    expect(blocked).toHaveLength(1);
    expect(blocked[0].id).toBe('r2');
  });
});

describe('Pure utility functions', () => {
  // Locks the label <-> minutes conversion so AC6 feedback strings stay correct.
  it('minutesToLabel converts minutes to HH:MM', () => {
    expect(minutesToLabel(630)).toBe('10:30');
    expect(minutesToLabel(0)).toBe('00:00');
    expect(minutesToLabel(1440)).toBe('24:00');
  });

  it('labelToMinutes converts HH:MM to minutes', () => {
    expect(labelToMinutes('10:30')).toBe(630);
    expect(labelToMinutes('00:00')).toBe(0);
    expect(labelToMinutes('24:00')).toBe(1440);
  });

  it('labelToMinutes returns NaN for invalid input', () => {
    expect(Number.isNaN(labelToMinutes('abc'))).toBe(true);
  });
});

describe('F1: capacity filter', () => {
  it('excludes rooms below the requested capacity', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, { minCapacity: 30, requiredEquipment: [] });
    const ids = filtered.map((r) => r.id);
    expect(ids).not.toContain('r5'); // capacity 20
    expect(ids).not.toContain('r2'); // capacity 25 but also blocked
    expect(ids).toContain('r1'); // capacity 40
    expect(ids).toContain('r3'); // capacity 60
    expect(ids).toContain('r4'); // capacity 30
  });

  it('includes a room whose capacity exactly matches the request', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, { minCapacity: 30, requiredEquipment: [] });
    expect(filtered.map((r) => r.id)).toContain('r4'); // capacity 30
  });
});

describe('F2: equipment filter', () => {
  it('includes only rooms that have ALL selected equipment', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, {
      minCapacity: 1,
      requiredEquipment: ['Projector', 'Whiteboard'],
    });
    const ids = filtered.map((r) => r.id);
    expect(ids).toContain('r1'); // Projector, Whiteboard, AC
    expect(ids).toContain('r3'); // Projector, Whiteboard, AC, Microphone
    expect(ids).not.toContain('r4'); // Projector, AC — no Whiteboard
    expect(ids).not.toContain('r5'); // Whiteboard, Computers, AC — no Projector
  });

  it('returns all non-blocked rooms when no equipment is required', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, { minCapacity: 1, requiredEquipment: [] });
    expect(filtered.map((r) => r.id)).toEqual(['r1', 'r3', 'r4', 'r5']);
  });
});

describe('F3: blocked rooms excluded', () => {
  it('never includes a blocked room regardless of capacity or equipment', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, {
      minCapacity: 1,
      requiredEquipment: ['Whiteboard', 'AC'],
    });
    // r2 has Whiteboard + AC and capacity 25 but is blocked
    expect(filtered.map((r) => r.id)).not.toContain('r2');
  });
});

describe('F4: empty result when no rooms match', () => {
  it('returns an empty array when capacity exceeds all rooms', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, { minCapacity: 100, requiredEquipment: [] });
    expect(filtered).toEqual([]);
  });

  it('returns an empty array when equipment is not found in any room', () => {
    const filtered = filterRooms(SAMPLE_ROOMS, {
      minCapacity: 1,
      requiredEquipment: ['Hologram'],
    });
    expect(filtered).toEqual([]);
  });
});

describe('filterRooms: purity (no mutation)', () => {
  it('does not mutate the input rooms array', () => {
    const snapshot = SAMPLE_ROOMS.map((r) => ({ ...r, equipment: [...r.equipment], bookings: [...r.bookings] }));
    filterRooms(SAMPLE_ROOMS, { minCapacity: 25, requiredEquipment: ['Projector'] });
    expect(SAMPLE_ROOMS).toHaveLength(snapshot.length);
    SAMPLE_ROOMS.forEach((r, i) => {
      expect(r.id).toBe(snapshot[i].id);
      expect(r.equipment).toEqual(snapshot[i].equipment);
      expect(r.blocked).toBe(snapshot[i].blocked);
    });
  });
});

describe('Fixture integrity: equipment and per-room bookings', () => {
  it('every room has a non-empty equipment array', () => {
    for (const r of SAMPLE_ROOMS) {
      expect(r.equipment.length).toBeGreaterThan(0);
    }
  });

  it('every room has a bookings array', () => {
    for (const r of SAMPLE_ROOMS) {
      expect(Array.isArray(r.bookings)).toBe(true);
    }
  });

  it('SAMPLE_BOOKINGS matches the flattened per-room bookings', () => {
    const flat = SAMPLE_ROOMS.flatMap((r) => r.bookings);
    expect(SAMPLE_BOOKINGS).toEqual(flat);
  });

  it('ALL_EQUIPMENT contains every unique equipment item sorted', () => {
    const expected = Array.from(
      new Set(SAMPLE_ROOMS.flatMap((r) => r.equipment))
    ).sort();
    expect(ALL_EQUIPMENT).toEqual(expected);
  });
});
