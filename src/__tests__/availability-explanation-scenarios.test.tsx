import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { checkAvailability } from '@/availability';
import { SAMPLE_BOOKINGS, SAMPLE_CURRENT_MINUTES, SAMPLE_ROOMS } from '@/data';
import { deriveReasonCode, generateExplanation } from '@/explanationAdapter';
import { ResultPanel } from '@/components/ResultPanel';

describe('availability explanation scenarios', () => {
  it('explains an available future slot without changing the decision', () => {
    const result = checkAvailability(
      { start: 660, end: 780 },
      SAMPLE_ROOMS.find((room) => room.id === 'r4'),
      SAMPLE_BOOKINGS,
      SAMPLE_CURRENT_MINUTES
    );
    const explanation = generateExplanation({
      roomLabel: 'Room 202',
      startLabel: '11:00',
      endLabel: '13:00',
      isAvailable: result.available,
      reasonCode: deriveReasonCode(result.reason, result.available),
    });

    expect(result.available).toBe(true);
    expect(explanation.explanation).toContain('Room 202');
    expect(explanation.source).toBe('model');
  });

  it.each([
    {
      name: 'overlapping booking',
      interval: { start: 690, end: 750 },
      roomId: 'r1',
      roomLabel: 'Room 101',
      expectedCode: 'OVERLAP',
    },
    {
      name: 'blocked room',
      interval: { start: 660, end: 720 },
      roomId: 'r2',
      roomLabel: 'Room 102',
      expectedCode: 'BLOCKED',
    },
    {
      name: 'invalid time',
      interval: { start: Number.NaN, end: 720 },
      roomId: 'r1',
      roomLabel: 'Room 101',
      expectedCode: 'INVALID_TIME',
    },
    {
      name: 'past time',
      interval: { start: 600, end: 660 },
      roomId: 'r1',
      roomLabel: 'Room 101',
      expectedCode: 'PAST_TIME',
    },
  ])('explains $name while keeping unavailable authoritative', ({ interval, roomId, roomLabel, expectedCode }) => {
    const result = checkAvailability(
      interval,
      SAMPLE_ROOMS.find((room) => room.id === roomId),
      SAMPLE_BOOKINGS,
      SAMPLE_CURRENT_MINUTES
    );
    const explanation = generateExplanation({
      roomLabel,
      startLabel: '10:00',
      endLabel: '11:00',
      isAvailable: result.available,
      reasonCode: deriveReasonCode(result.reason, result.available),
    });

    expect(result.available).toBe(false);
    expect(deriveReasonCode(result.reason, result.available)).toBe(expectedCode);
    expect(explanation.source).toBe('model');
    expect(explanation.explanation).toContain(roomLabel);
  });

  it('keeps the confirmed status unchanged after showing an explanation', async () => {
    const result = checkAvailability(
      { start: 690, end: 750 },
      SAMPLE_ROOMS.find((room) => room.id === 'r1'),
      SAMPLE_BOOKINGS,
      SAMPLE_CURRENT_MINUTES
    );
    const bookingsBefore = JSON.stringify(SAMPLE_BOOKINGS);

    render(
      <ResultPanel
        result={result}
        start={690}
        end={750}
        duration={60}
        showDuration
        roomName="Room 101"
      />
    );

    expect(screen.getByText('Unavailable')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Explain availability' }));
    await waitFor(() => expect(screen.getByRole('region', { name: 'Availability explanation' })).toBeTruthy());

    expect(screen.getByText('Unavailable')).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Availability explanation' })).toHaveTextContent('overlaps');
    expect(JSON.stringify(SAMPLE_BOOKINGS)).toBe(bookingsBefore);
  });
});
