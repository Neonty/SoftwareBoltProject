# AGENTS.md - Smart Campus Availability Project Rules

## Project overview
Smart Campus room availability checker (single-page React app with fictional booking data).

## Acceptance criteria and constraints
- AC1: Reject start >= end and past requests (strictly `start > current_time`).
- AC2: Reject bookings longer than 120 minutes.
- AC3: Reject blocked rooms.
- AC4: Reject overlaps; allow bookings touching only at endpoints (`start < b.end && end > b.start`).
- AC5: Return Available/Unavailable decision without mutating booking data.
- AC6: Maintain clear validation feedback on desktop and mobile layout.

## Refactoring guidelines
- Prefer pure functions and minimal architectural changes (max 1-2 patterns).
- Do not add backend services, database connections, authentication, or login.
- Preserve all existing UI visual elements and CSS rules.

## Verification requirements
- Ensure code builds without TypeScript errors.
- Export pure functions to ensure unit-level testability.