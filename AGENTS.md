# AGENTS.md

## Project

SIGNAL is a portfolio-quality AI interaction prototype built with Next.js, React, TypeScript, and Canvas 2D.

## Priorities

1. Preserve a minimal and credible product experience.
2. Keep the signal engine deterministic, performant, and independent from React rendering.
3. Maintain strict TypeScript.
4. Prefer simple architecture over speculative abstraction.
5. Keep changes scoped to the requested phase.

## Commands

Use the package manager already present in the repository.

Before completing a task, run the available equivalents of:

- development server
- lint
- typecheck, if configured
- production build
- tests, if configured

## Implementation rules

- Read `docs/SIGNAL_BUILD_PLAN.md` before working on SIGNAL features.
- Do not add dependencies without explaining why the platform APIs are insufficient.
- Do not introduce Three.js, WebGL, Rive, microphone access, authentication, a database, or an LLM API during v0.1 unless explicitly requested.
- Do not rerender React components on every animation frame.
- Clean up animation frames, observers, and event listeners.
- Respect `prefers-reduced-motion`.
- Keep the main product route free of debug controls.
- Put tuning controls and technical documentation on `/system`.
- Avoid generic dashboard, cyberpunk, HUD, and excessive-glow styling.
- Do not modify unrelated portfolio projects or repository infrastructure.

## Review expectations

At the end of each task, report:

- what changed
- why
- files modified
- commands run
- verification results
- known limitations
- next recommended task

## Motion Philosophy

The SIGNAL engine is not an audio visualizer.

It is a behavioral system.

Motion should communicate cognition,
attention,
anticipation,
reasoning,
and resolution.

The signal should never feel random.

Every movement should appear intentional.

Favor elegant mathematical attractors over literal icon morphing.

Treat the signal as one continuous parametric XY path. Use oscillator
relationships rather than imported or traced shapes.

Prefer calm, restrained motion over decorative animation.

Motion should communicate progress without demanding attention.

## Motion Semantics

- SIGNAL is one continuous behavioral system, not a collection of separate animations.
- Every behavior must preserve the shared visual identity while communicating a distinct semantic action.
- Tune behaviors through shared mathematical parameters before adding behavior-specific rendering code.
- Preserve phase, momentum, and restrained residual memory across transitions.
- Reasoning should discover, hold, and transform coherent structures rather than remain constantly busy.
- Responding should be more ordered and directional than Reasoning.
- Completion should lock, hold, and exhale rather than simply reduce amplitude.
- Motion should communicate progress without demanding attention.
- Do not use color, amplitude, or speed alone to distinguish behaviors.
