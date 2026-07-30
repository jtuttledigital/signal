# SIGNAL

A continuous visual language for AI presence, attention, listening, cognition,
response, and resolution.

SIGNAL is a portfolio-quality product prototype built around one deterministic
Canvas signal. The current experience uses a clearly disclosed local simulation;
no AI model, microphone, authentication, or database is connected.

## Stack

- Next.js
- React
- TypeScript
- Canvas 2D

## Routes

- `/` — responsive Product Shell with the complete local interaction lifecycle
- `/system` — temporary motion-review surface with manual behavior selection

The main route intentionally contains no tuning or debug controls. A full
parameter playground for `/system` is deferred to a later phase.

## Architecture

- `SignalEngine` owns deterministic frame rendering and parameter interpolation.
- `SignalCanvas` owns Canvas sizing, browser events, reduced motion, and cleanup.
- `useSignalController` owns semantic interaction state, timers, run IDs, local
  response streaming, and stale-response protection.
- Typed behavior presets remain the source of semantic motion targets.

React does not rerender on animation frames.

## Development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run lint
npx tsc --noEmit --ignoreDeprecations 6.0
npm run build
```

## Current phases

- Phase 1: Signal Engine — complete
- Motion Direction pass — complete
- Phase 1.5: Behavior Events — complete
- Phase 2: Product Shell — complete
- Phase 3: Full System Page — pending
