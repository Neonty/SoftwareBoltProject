# Smart Campus Room Availability

A web application for checking real-time meeting room availability on campus. Users can filter rooms by capacity and equipment, select a room, choose a time interval, and instantly see whether the slot is free or conflicts with existing bookings.

## Features

- **Room filtering** by minimum capacity and required equipment (F1–F5)
- **Availability checking** against six acceptance criteria:
  - AC1 — valid time range (00:00–24:00, start after current time)
  - AC2 — booking duration capped at 120 minutes
  - AC3 — blocked rooms rejected
  - AC4 — overlapping bookings rejected (touching endpoints allowed)
  - AC5 — booking data never mutated
  - AC6 — clear, human-readable validation feedback on every rejection
- **Visual schedule timeline** showing existing bookings for the selected room
- **Responsive UI** from mobile to desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Icons | lucide-react |
| Testing | Vitest + Testing Library + jsdom |

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher

## Setup

```bash
# 1. Clone the project (or open in Bolt)
# 2. Install dependencies
npm install
```

## Development

```bash
# Start the dev server with hot-module replacement
npm run dev
```

The app is served at `http://localhost:5173`.

## Build & Preview

```bash
# Compile and bundle for production
npm run build

# Preview the production build locally
npm run preview
```

## Testing

```bash
# Run the full test suite once and exit
npm test

# Run tests in watch mode (re-runs on file change)
npm run test:watch
```

The suite contains 38 tests across two files:

| File | Tests | Coverage |
|------|-------|----------|
| `availability.test.ts` | 34 | AC1–AC6 rules, filter logic (F1–F4), utility functions, fixture integrity |
| `room-switching.test.tsx` | 4 | Hook behavior, room auto-selection on filter change (F5) |

## Linting & Type Checking

```bash
# ESLint static analysis
npm run lint

# TypeScript type check (no emit)
npm run typecheck
```

## Project Structure

```
src/
├── App.tsx                    # Root layout, composes all sections
├── main.tsx                   # React entry point
├── availability.ts            # Pure availability logic (AC1–AC6)
├── filters.ts                 # Room filtering logic (F1–F4)
├── useRoomAvailability.ts     # Custom hook: state + derived data
├── data.ts                    # Sample rooms, bookings, equipment
├── types.ts                   # Shared TypeScript interfaces
├── components/
│   ├── Controls.tsx           # FilterBar, RoomSelector, TimePicker
│   ├── ResultPanel.tsx        # Availability result display
│   └── RoomSchedule.tsx       # Booking timeline visualization
└── __tests__/
    ├── availability.test.ts   # Unit tests for rules & filters
    ├── room-switching.test.tsx# Hook & component integration tests
    └── setup.ts               # jest-dom matchers setup
```

## Sample Data

The app ships with five fictional rooms and six pre-existing bookings. The "current time" is fixed at 10:30 AM for demo consistency. All data is in-memory; no backend connection is required to run or test the application.
"# SoftwareBoltProject" 
