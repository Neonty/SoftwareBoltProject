import { describe, it, expect } from 'vitest';
import {
  generateExplanation,
  requestExplanation,
  deriveReasonCode,
  validateInput,
  FALLBACK_RESPONSE,
  type ExplanationInput,
} from '@/explanationAdapter';

const validInput: ExplanationInput = {
  roomLabel: 'Room 101',
  startLabel: '11:00',
  endLabel: '12:00',
  isAvailable: true,
  reasonCode: 'AVAILABLE',
};

describe('deriveReasonCode: maps reason strings to stable codes', () => {
  it('returns AVAILABLE when isAvailable is true regardless of reason text', () => {
    expect(deriveReasonCode('Room 101 is available for this time slot.', true)).toBe('AVAILABLE');
  });

  it('maps overlap reason to OVERLAP', () => {
    expect(deriveReasonCode('Overlaps an existing booking (12:00–13:00, Study Group).', false)).toBe('OVERLAP');
  });

  it('maps blocked reason to BLOCKED', () => {
    expect(deriveReasonCode('Room 102 is currently blocked and unavailable.', false)).toBe('BLOCKED');
  });

  it('maps too-long reason to TOO_LONG', () => {
    expect(deriveReasonCode('Booking cannot be longer than 120 minutes.', false)).toBe('TOO_LONG');
  });

  it('maps past-time reason to PAST_TIME', () => {
    expect(deriveReasonCode('Start time must be after the current time (10:30).', false)).toBe('PAST_TIME');
  });

  it('maps reversed reason to REVERSED', () => {
    expect(deriveReasonCode('Start time must be earlier than end time.', false)).toBe('REVERSED');
  });

  it('maps range reason to INVALID_RANGE', () => {
    expect(deriveReasonCode('Time must be between 00:00 and 24:00.', false)).toBe('INVALID_RANGE');
  });

  it('maps no-room reason to NO_ROOM', () => {
    expect(deriveReasonCode('Please select a room.', false)).toBe('NO_ROOM');
  });

  it('returns UNKNOWN for an unrecognized reason', () => {
    expect(deriveReasonCode('Something unexpected happened.', false)).toBe('UNKNOWN');
  });
});

describe('validateInput: rejects empty, malformed, and overly long input', () => {
  it('accepts a well-formed input', () => {
    expect(validateInput(validInput)).toBe(true);
  });

  it('rejects null', () => {
    expect(validateInput(null)).toBe(false);
  });

  it('rejects an empty roomLabel', () => {
    expect(validateInput({ ...validInput, roomLabel: '' })).toBe(false);
    expect(validateInput({ ...validInput, roomLabel: '   ' })).toBe(false);
  });

  it('rejects a roomLabel longer than 200 characters', () => {
    expect(validateInput({ ...validInput, roomLabel: 'A'.repeat(201) })).toBe(false);
  });

  it('rejects a 200-character roomLabel (boundary: allowed)', () => {
    expect(validateInput({ ...validInput, roomLabel: 'A'.repeat(200) })).toBe(true);
  });

  it('rejects missing isAvailable or wrong type', () => {
    expect(validateInput({ ...validInput, isAvailable: 'yes' })).toBe(false);
    expect(validateInput({ roomLabel: 'R', startLabel: '11:00', endLabel: '12:00', reasonCode: 'X' })).toBe(false);
  });

  it('rejects an empty reasonCode', () => {
    expect(validateInput({ ...validInput, reasonCode: '' })).toBe(false);
  });
});

describe('generateExplanation: produces grounded, concise explanations', () => {
  it('returns a model response for valid available input', () => {
    const out = generateExplanation(validInput);
    expect(out.source).toBe('model');
    expect(out.explanation).toContain('Room 101');
    expect(out.explanation).toContain('11:00–12:00');
  });

  it('keeps the explanation to at most two sentences', () => {
    const out = generateExplanation(validInput);
    const sentences = out.explanation.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    expect(sentences.length).toBeLessThanOrEqual(2);
  });

  it('grounds the overlap explanation in room and time without inventing facts', () => {
    const out = generateExplanation({ ...validInput, isAvailable: false, reasonCode: 'OVERLAP' });
    expect(out.source).toBe('model');
    expect(out.explanation).toContain('Room 101');
    expect(out.explanation).toContain('overlaps');
    expect(out.explanation).not.toContain('CS Class');
  });

  it('returns a fallback for invalid input', () => {
    const out = generateExplanation({ ...validInput, roomLabel: '' });
    expect(out).toEqual(FALLBACK_RESPONSE);
    expect(out.source).toBe('fallback');
  });

  it('returns a fallback for null input', () => {
    expect(generateExplanation(null)).toEqual(FALLBACK_RESPONSE);
  });

  it('fallback is deterministic (same object shape every time)', () => {
    const a = generateExplanation(undefined);
    const b = generateExplanation({ bad: 'input' });
    expect(a).toEqual(b);
    expect(a).toEqual(FALLBACK_RESPONSE);
  });

  it('does not throw on unexpected input types', () => {
    expect(() => generateExplanation(42)).not.toThrow();
    expect(() => generateExplanation('string')).not.toThrow();
    expect(() => generateExplanation([])).not.toThrow();
  });
});

describe('requestExplanation: async wrapper with timeout fallback', () => {
  it('resolves to a model response for valid input', async () => {
    const out = await requestExplanation(validInput, { delayMs: 0 });
    expect(out.source).toBe('model');
    expect(out.explanation).toContain('Room 101');
  });

  it('resolves to fallback for invalid input', async () => {
    const out = await requestExplanation(null, { delayMs: 0 });
    expect(out).toEqual(FALLBACK_RESPONSE);
  });

  it('falls back when the timeout fires before the work completes', async () => {
    const out = await requestExplanation(validInput, { delayMs: 1000, timeoutMs: 10 });
    expect(out).toEqual(FALLBACK_RESPONSE);
    expect(out.source).toBe('fallback');
  });

  it('falls back when the simulated API fails', async () => {
    const out = await requestExplanation(validInput, { delayMs: 0, simulateFailure: true });
    expect(out).toEqual(FALLBACK_RESPONSE);
    expect(out.source).toBe('fallback');
  });

  it('never rejects', async () => {
    await expect(requestExplanation(undefined, { delayMs: 0 })).resolves.toBeDefined();
  });
});
