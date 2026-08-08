# SIGNAL

A continuous visual language for AI presence, attention, listening, cognition,
response, and resolution.

SIGNAL is a portfolio-quality product prototype built around one deterministic
Canvas signal. The current experience uses a clearly disclosed local simulation;
no AI model, microphone, authentication, or database is connected.

The implemented v0.1 includes the deterministic single-path engine, semantic
behavior lifecycle, oscillator and attractor motion, responsive Product Shell,
reduced-motion support, and a focused `/system` review surface.

[Direction V2](docs/SIGNAL_DIRECTION_V2.md) expands that foundation into an
observable-event-driven expression system. It introduces progressive event
levels, an adaptive expression layer, and a future hierarchy of one dominant
primary path, restrained secondary paths, and low-contrast fields. These are
architectural directions, not claims about the current renderer; the single
continuous path remains the baseline identity.

The direction remains practical and deployable because universal interaction
events work without privileged model reasoning, optional tool and semantic
signals enhance rather than gate the experience, and the current Canvas 2D
engine remains the deterministic fallback. See the
[build plan](docs/SIGNAL_BUILD_PLAN.md) for scope and sequencing and
[motion semantics](docs/SIGNAL_MOTION_SEMANTICS.md) for the visual rules.

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
- Typed oscillator presets define X/Y frequency, ratio, phase, amplitude,
  harmonic, symmetry, persistence, and energy targets.
- `signal-attractors` provides pure orbital, figure-eight, and fold samplers;
  `SignalEngine` owns their runtime interpolation and rendering.
- `SignalCanvas` owns Canvas sizing, browser events, reduced motion, and cleanup.
- `signal-events` defines the renderer-independent runtime event contract,
  optional workflow extensions, semantic envelope, and pure transition rules.
- `signal-expression` maps accepted runtime events into eight deterministic,
  normalized expression targets without changing presets or renderer output.
- `useSignalController` normalizes observable product events, owns timers and
  run IDs, and preserves stale-response protection before renderer behaviors
  change.
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
npm test
npx tsc --noEmit --ignoreDeprecations 6.0
npm run build
```

## Current phases

- Phase 1: Signal Engine — complete
- Motion Direction pass — complete
- Phase 1.5: Behavior Events — complete
- Phase 2: Product Shell — complete
- Attractor Events v0.1 — complete
- Oscilloscope Tuning v0.1 — complete
- Phase 3: Full System Page — pending
- Direction V2 documentation alignment — complete
- Direction V2 runtime event model — complete
- Direction V2 adaptive expression — complete
- Direction V2 rendering adapter / controlled integration — pending
