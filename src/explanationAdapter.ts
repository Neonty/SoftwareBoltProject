/**
 * Mock LLM adapter for the "Explain availability" feature.
 *
 * Contract:
 *   Input  -> { roomLabel, startLabel, endLabel, isAvailable, reasonCode }
 *   Output -> { explanation, source }
 *
 * The adapter never overrides the deterministic availability decision and never
 * mutates booking data. It only produces a human-friendly explanation grounded
 * in the provided reasonCode and room/time details. On any validation failure,
 * internal error, or timeout it returns a deterministic fallback response.
 */

export type ReasonCode =
  | 'AVAILABLE'
  | 'INVALID_TIME'
  | 'INVALID_RANGE'
  | 'REVERSED'
  | 'PAST_TIME'
  | 'TOO_LONG'
  | 'BLOCKED'
  | 'OVERLAP'
  | 'NO_ROOM'
  | 'UNKNOWN';

export interface ExplanationInput {
  roomLabel: string;
  startLabel: string;
  endLabel: string;
  isAvailable: boolean;
  reasonCode: string;
}

export type ExplanationSource = 'model' | 'fallback';

export interface ExplanationResponse {
  explanation: string;
  source: ExplanationSource;
}

const MAX_FIELD_LEN = 200;
const MAX_EXPLANATION_LEN = 300;
const MAX_SENTENCES = 2;

export const FALLBACK_RESPONSE: ExplanationResponse = {
  explanation:
    'Sorry, I could not generate an explanation right now. Please refer to the availability status above.',
  source: 'fallback',
};

/**
 * Maps the human-readable `reason` string produced by `checkAvailability` into a
 * stable machine-readable code. Ordering matters: more specific patterns are
 * checked before generic ones.
 */
export function deriveReasonCode(reason: string, isAvailable: boolean): ReasonCode {
  if (isAvailable) return 'AVAILABLE';
  const r = reason.toLowerCase();
  if (r.includes('blocked')) return 'BLOCKED';
  if (r.includes('overlaps')) return 'OVERLAP';
  if (r.includes('longer than 120')) return 'TOO_LONG';
  if (r.includes('after the current time')) return 'PAST_TIME';
  if (r.includes('earlier than end')) return 'REVERSED';
  if (r.includes('between 00:00')) return 'INVALID_RANGE';
  if (r.includes('valid start and end')) return 'INVALID_TIME';
  if (r.includes('select a room')) return 'NO_ROOM';
  return 'UNKNOWN';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidField(value: unknown): boolean {
  return isNonEmptyString(value) && (value as string).length <= MAX_FIELD_LEN;
}

export function validateInput(input: unknown): input is ExplanationInput {
  if (typeof input !== 'object' || input === null) return false;
  const obj = input as Record<string, unknown>;
  return (
    isValidField(obj.roomLabel) &&
    isValidField(obj.startLabel) &&
    isValidField(obj.endLabel) &&
    typeof obj.isAvailable === 'boolean' &&
    isValidField(obj.reasonCode)
  );
}

function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  return trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
}

function isValidExplanation(text: unknown): text is string {
  return (
    typeof text === 'string' &&
    text.trim().length > 0 &&
    text.length <= MAX_EXPLANATION_LEN &&
    countSentences(text) <= MAX_SENTENCES
  );
}

function buildExplanation(input: ExplanationInput): string {
  const { roomLabel, startLabel, endLabel, isAvailable, reasonCode } = input;
  const slot = `${startLabel}–${endLabel}`;

  switch (reasonCode) {
    case 'AVAILABLE':
      return `${roomLabel} is free from ${slot}, so you're all set. Go ahead and book it for your study session.`;
    case 'OVERLAP':
      return `${roomLabel} already has a booking that overlaps ${slot}. Try a different start or end time to avoid the conflict.`;
    case 'BLOCKED':
      return `${roomLabel} is currently blocked and can't be booked. Please choose another room for your ${slot} slot.`;
    case 'TOO_LONG':
      return `Your requested slot is longer than the 120-minute limit. Shorten it to 120 minutes or less to check availability.`;
    case 'PAST_TIME':
      return `The start time you chose is already in the past. Pick a start time later than now to check ${roomLabel}.`;
    case 'REVERSED':
      return `The start time must come before the end time. Please fix the times for ${roomLabel} and try again.`;
    case 'INVALID_RANGE':
      return `Times must be within 00:00–24:00. Please adjust your request for ${roomLabel} and try again.`;
    case 'INVALID_TIME':
      return `The entered times don't look valid. Make sure both start and end are in HH:MM format for ${roomLabel}.`;
    case 'NO_ROOM':
      return `No room is selected yet. Choose a room to check its availability for ${slot}.`;
    case 'UNKNOWN':
    default:
      return isAvailable
        ? `${roomLabel} appears to be available for ${slot}. You can proceed with booking.`
        : `${roomLabel} isn't available for ${slot}. Please review the details above and try another option.`;
  }
}

/**
 * Synchronous, pure generator. Validates the input, builds a grounded
 * explanation, validates the output, and returns a deterministic fallback if
 * anything fails. Never throws.
 */
export function generateExplanation(input: unknown): ExplanationResponse {
  try {
    if (!validateInput(input)) return FALLBACK_RESPONSE;
    const explanation = buildExplanation(input);
    if (!isValidExplanation(explanation)) return FALLBACK_RESPONSE;
    return { explanation, source: 'model' };
  } catch {
    return FALLBACK_RESPONSE;
  }
}

/**
 * Async wrapper that simulates LLM latency with a timeout race. Resolves to a
 * model response on success, or the deterministic fallback on timeout/error.
 * Never rejects.
 */
export async function requestExplanation(
  input: unknown,
  opts?: { delayMs?: number; timeoutMs?: number; simulateFailure?: boolean }
): Promise<ExplanationResponse> {
  const delayMs = opts?.delayMs ?? 250;
  const timeoutMs = opts?.timeoutMs ?? 4000;

  const work = new Promise<ExplanationResponse>((resolve) => {
    setTimeout(
      () => resolve(opts?.simulateFailure ? FALLBACK_RESPONSE : generateExplanation(input)),
      delayMs
    );
  });
  const timeout = new Promise<ExplanationResponse>((resolve) => {
    setTimeout(() => resolve(FALLBACK_RESPONSE), timeoutMs);
  });

  try {
    return await Promise.race([work, timeout]);
  } catch {
    return FALLBACK_RESPONSE;
  }
}
