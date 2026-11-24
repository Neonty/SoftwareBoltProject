# Project memory

## Product intent & audience

- Room availability checker app: users pick one room and a time interval to see if it’s available.
- Uses fictional/sample data only; intended as a self-contained front-end demo or prototype.

## Brand personality & voice

- Production-quality, polished UI (per global instructions); no further voice specifics inferred yet.

## Visual design & UX direction

- Single-page React app, TypeScript + Vite + Tailwind.
- Key components: `Controls.tsx` (room selector, filter bar, time picker), `RoomSchedule.tsx` (timeline of bookings for selected room), `ResultPanel.tsx` (availability verdict).
- State centralized in `useRoomAvailability` hook.
- Existing visuals/CSS should be preserved across refactors.

## Decisions, constraints & rationale

- Baseline green: 39 tests pass (2 files), lint clean, build succeeds (~161 kB JS / 14.5 kB CSS).
- Core logic: `src/availability.ts` → `checkAvailability(interval, room, bookings, currentMinutes)`, pure function, no input mutation.
- Acceptance criteria enforced: AC1 valid range/order, AC2 ≤120 min, AC3 blocked rooms, AC4 overlap (touching allowed), AC5 immutability.
- Data: `src/data.ts` exports `SAMPLE_ROOMS` and `SAMPLE_BOOKINGS`.
- Repo rules (`.bolt/AGENTS.md`): pure functions only; no backend/database/auth/login; preserve visuals/CSS; max 1-2 pattern changes per refactor; TS build must pass.

## Open questions & assumptions

- No real persistence layer by design; all bookings are static samples.
- Only one room selectable at a time (current scope); multi-room not required.