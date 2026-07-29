# SIGNAL — Production Build Specification

**Project:** SIGNAL  
**Working title:** A Continuous Visual Language for AI  
**Target:** Portfolio-ready interactive prototype  
**Primary stack:** Next.js, TypeScript, React, Canvas 2D, CSS  
**Deployment:** Vercel  
**Initial release:** v0.1

---

## 1. Product Summary

SIGNAL is an experimental AI interface built around one continuously evolving visual object.

Instead of using separate icons, spinners, waveform assets, or decorative loading animations, the interface uses a single generated signal whose motion parameters change in response to product behavior.

The signal communicates:

- presence
- attention
- listening
- reasoning
- response generation
- completion
- interruption or failure

The first release should feel like a credible product prototype, not a concept dashboard or generic sci-fi interface.

The visual direction is restrained, minimal, dark, precise, and spatial. The signal is the primary interface object.

---

## 2. Core Design Thesis

AI interfaces usually communicate state through labels, dots, spinners, color swaps, and prebuilt animations.

SIGNAL explores a different model:

> A single continuous trace expresses intelligence through motion, energy, rhythm, persistence, and complexity.

### Principles

1. **Always alive**  
   The signal never fully disappears while the experience is active.

2. **One continuous trace**  
   Every behavior comes from the same generative system.

3. **Behavior over symbol**  
   Meaning is communicated through motion rather than icons.

4. **Energy over color**  
   State changes are primarily conveyed through amplitude, velocity, density, noise, persistence, and afterimage.

5. **Continuous evolution**  
   States interpolate smoothly. Do not swap animations abruptly.

6. **Product first**  
   The main route should resemble a shippable AI interface, not a motion-design control panel.

7. **System documented separately**  
   Controls, presets, principles, and technical notes belong on a separate `/system` route.

---

## 3. v0.1 Scope

Build a polished single-page prototype with:

- one reusable Canvas-based signal engine
- five primary behavior presets
- smooth transitions between presets
- pointer influence
- prompt input
- simulated AI response sequence
- streaming response text
- responsive desktop and mobile layouts
- a separate motion-system documentation route
- reduced-motion support
- Vercel-ready production build

### Primary behaviors

- `presence`
- `attention`
- `listening`
- `reasoning`
- `completion`

### Optional supporting behaviors

Add only after the primary flow is stable:

- `responding`
- `disturbance`
- `sleep`

---

## 4. Explicit Non-Goals for v0.1

Do not add these during the initial implementation:

- authentication
- database
- real microphone access
- real speech recognition
- real LLM API integration
- Three.js
- WebGL shaders
- Rive
- complex particle systems
- multiple app pages beyond `/` and `/system`
- generic admin dashboard UI
- excessive cards, borders, gradients, or HUD decoration
- large third-party animation libraries

The first release should prove the interaction language with the smallest credible product surface.

---

## 5. Recommended Repository Structure

```text
signal/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── system/
│       └── page.tsx
├── components/
│   ├── signal/
│   │   ├── SignalCanvas.tsx
│   │   ├── SignalStage.tsx
│   │   ├── signal-engine.ts
│   │   ├── signal-presets.ts
│   │   ├── signal-types.ts
│   │   └── signal-utils.ts
│   ├── PromptComposer.tsx
│   ├── ResponseStream.tsx
│   ├── StateLabel.tsx
│   └── SystemControls.tsx
├── hooks/
│   ├── useReducedMotion.ts
│   ├── useSignalController.ts
│   └── useSimulatedResponse.ts
├── docs/
│   └── SIGNAL_BUILD_PLAN.md
├── public/
│   └── og-signal.png
├── AGENTS.md
├── package.json
├── tsconfig.json
└── README.md
```

Keep the engine independent from React where practical.

---

## 6. Technical Architecture

### Rendering layer

Use an HTML `<canvas>` rendered with Canvas 2D.

The canvas should:

- resize using `ResizeObserver`
- account for `devicePixelRatio`
- cap DPR at `2`
- render through `requestAnimationFrame`
- pause or reduce work when the tab is hidden
- avoid creating garbage inside the animation loop
- clean up listeners and animation frames on unmount

### React responsibilities

React should manage:

- active product behavior
- prompt text
- simulated request lifecycle
- transcript visibility
- system-control values
- accessibility labels
- reduced-motion mode

React should not rerender on every animation frame.

### Engine responsibilities

The signal engine should manage:

- elapsed time
- current interpolated parameter values
- target parameter values
- curve sampling
- pointer influence
- trace rendering
- afterimage or persistence
- animation timing

---

## 7. Type Definitions

Create explicit types similar to:

```ts
export type SignalBehavior =
  | "presence"
  | "attention"
  | "listening"
  | "reasoning"
  | "responding"
  | "completion"
  | "disturbance"
  | "sleep";

export interface SignalParameters {
  amplitude: number;
  frequency: number;
  complexity: number;
  velocity: number;
  persistence: number;
  thickness: number;
  noise: number;
  focus: number;
  depth: number;
}

export interface SignalPreset {
  id: SignalBehavior;
  label: string;
  description: string;
  parameters: SignalParameters;
}
```

Normalize parameters to either `0–1` or consistently documented ranges.

Do not mix arbitrary percentage and pixel units inside the engine.

---

## 8. Behavior Presets

Use these as starting points, then tune visually.

```ts
presence: {
  amplitude: 0.20,
  frequency: 0.24,
  complexity: 0.08,
  velocity: 0.16,
  persistence: 0.90,
  thickness: 0.38,
  noise: 0.02,
  focus: 0.25,
  depth: 0.10
}

attention: {
  amplitude: 0.34,
  frequency: 0.34,
  complexity: 0.20,
  velocity: 0.28,
  persistence: 0.86,
  thickness: 0.46,
  noise: 0.04,
  focus: 0.62,
  depth: 0.18
}

listening: {
  amplitude: 0.55,
  frequency: 0.58,
  complexity: 0.48,
  velocity: 0.54,
  persistence: 0.76,
  thickness: 0.58,
  noise: 0.12,
  focus: 0.80,
  depth: 0.30
}

reasoning: {
  amplitude: 0.72,
  frequency: 0.68,
  complexity: 0.92,
  velocity: 0.66,
  persistence: 0.66,
  thickness: 0.64,
  noise: 0.16,
  focus: 0.92,
  depth: 0.82
}

responding: {
  amplitude: 0.50,
  frequency: 0.52,
  complexity: 0.42,
  velocity: 0.40,
  persistence: 0.80,
  thickness: 0.52,
  noise: 0.06,
  focus: 0.70,
  depth: 0.34
}

completion: {
  amplitude: 0.24,
  frequency: 0.28,
  complexity: 0.12,
  velocity: 0.18,
  persistence: 0.92,
  thickness: 0.40,
  noise: 0.01,
  focus: 0.34,
  depth: 0.08
}
```

Presets are semantic targets, not separate animations.

---

## 9. Motion Model

### Base signal

Build the waveform from a small combination of continuous functions:

- primary sine wave
- secondary harmonic
- tertiary harmonic
- localized center envelope
- optional low-amplitude deterministic noise
- optional phase offset for secondary traces

A useful conceptual form is:

```text
signal =
  primary wave
  + secondary harmonic × complexity
  + tertiary harmonic × complexity
  + localized reasoning fold
  + pointer influence
```

Do not implement random jitter with `Math.random()` each frame.

Use deterministic functions so the signal remains coherent and reproducible.

### Transition behavior

Use damped interpolation or time-based easing between current and target parameters.

Requirements:

- transitions must not snap
- repeated state changes must remain stable
- no overshoot unless intentionally applied
- state transitions should take approximately `500–1200ms`
- completion should settle more slowly than attention activates

A simple exponential interpolation is acceptable for v0.1.

### Persistence

Create oscilloscope-like persistence by drawing a low-opacity background over the prior frame rather than clearing the canvas completely.

The persistence parameter should influence the fade amount.

Do not let afterimages create a muddy full-screen glow.

### Layering

Render a restrained set of traces:

1. broad low-opacity energy field
2. medium-width secondary trace
3. crisp primary trace
4. optional faint offset trace for depth

Keep the principal line readable.

### Pointer influence

Pointer movement should subtly affect:

- local vertical pull
- focus position
- mild depth or phase displacement

Pointer response must feel magnetic, not like a cursor-following toy.

Disable pointer influence on touch-only devices unless a stable touch interaction is explicitly implemented.

---

## 10. Product Route: `/`

### Layout

The page should use the full viewport with restrained chrome.

Suggested structure:

```text
Header / project mark
        ↓
Large central signal stage
        ↓
State or response label
        ↓
Streaming response area
        ↓
Prompt composer
```

### Header

Keep it minimal:

- small SIGNAL wordmark
- optional `System` link
- optional quiet status indicator

Do not add a large navigation system.

### Signal stage

The stage is the visual center of the product.

Requirements:

- approximately 45–60% of desktop viewport height
- horizontally centered
- large negative space
- no card-style dashboard framing unless extremely subtle
- line remains visible against the background
- signal scales responsively
- content should not jump during state transitions

### Prompt composer

Include:

- single-line or auto-growing text input
- submit button
- disabled state while prompt is empty
- Enter submits
- Shift+Enter creates a new line if using a textarea
- accessible label
- visible focus state

Suggested placeholder:

```text
Ask SIGNAL anything
```

### Interaction sequence

On initial load:

```text
presence
```

When prompt input gains focus:

```text
attention
```

While user types:

```text
listening
```

On submit:

```text
reasoning
```

After simulated delay:

```text
responding
```

When streaming finishes:

```text
completion
```

After a pause:

```text
presence
```

### Simulated response

Use a local response for v0.1.

Example:

> Intelligence becomes legible when motion communicates more than activity. SIGNAL uses one continuous trace to express attention, processing, and resolution without changing visual objects.

Stream text progressively.

Do not pretend the response came from a real model.

---

## 11. System Route: `/system`

The system page documents and exposes the motion language.

Include:

- project thesis
- core principles
- behavior preset selector
- live signal preview
- parameter sliders
- state transition map
- implementation notes
- accessibility notes
- performance status

### Controls

Expose these parameters:

- amplitude
- frequency
- complexity
- velocity
- persistence
- thickness
- noise
- focus
- depth

Controls should update the preview immediately.

Include a Reset button that restores the selected preset.

Do not place controls on the primary product route.

### State map

Show this sequence clearly:

```text
Presence
  → Attention
  → Listening
  → Reasoning
  → Responding
  → Completion
  → Presence
```

Also show:

```text
Any active state
  → Disturbance
  → Presence
```

The state map may be plain HTML/CSS. It does not need a diagramming library.

---

## 12. Visual Direction

### General

The design should feel:

- restrained
- precise
- intelligent
- calm
- contemporary
- spatial without becoming cinematic
- experimental without becoming ornamental

### Avoid

- generic cyberpunk styling
- excessive neon gradients
- glowing borders around every surface
- faux control-room UI
- tiny unreadable labels
- decorative particle clouds
- random glassmorphism
- overdesigned cards
- multiple competing accent colors

### Palette

Suggested starting tokens:

```css
:root {
  --background: #07090c;
  --surface: #0d1117;
  --surface-elevated: #121820;
  --foreground: #f3f5f7;
  --muted: #89929d;
  --border: rgba(255, 255, 255, 0.10);
  --signal: #72e6ff;
  --signal-soft: rgba(114, 230, 255, 0.22);
  --focus: rgba(114, 230, 255, 0.18);
}
```

Use one primary signal color in v0.1.

Subtle tonal variation is acceptable, but color should not be the main state mechanism.

### Typography

Use a clean sans serif.

Preferred:

- Inter
- Geist Sans
- system sans fallback

Use a monospace face sparingly for parameter values or technical labels.

### Motion timing

Suggested product timings:

- focus to attention: `300–500ms`
- typing to listening: `200–400ms`
- submit to reasoning: `500–800ms`
- reasoning duration: `1400–2400ms`
- response streaming: `1800–3200ms`
- completion settle: `900–1500ms`
- return to presence: `1800–3000ms`

These are initial tuning values, not immutable constants.

---

## 13. Accessibility

Implement:

- semantic controls
- visible keyboard focus
- keyboard submission
- text labels for every behavior
- screen-reader status announcements using `aria-live`
- sufficient text contrast
- no essential information conveyed only through motion
- `prefers-reduced-motion` support

### Reduced motion behavior

When reduced motion is enabled:

- greatly reduce velocity
- disable afterimage accumulation
- disable pointer influence
- use gentle amplitude changes
- retain visible labels for state changes
- do not stop the product from functioning

Canvas should include an accessible fallback description.

---

## 14. Performance Requirements

Target:

- stable 60 fps on a current desktop browser
- acceptable 30–60 fps on a modern phone
- no React rerender per frame
- no unbounded arrays
- no per-frame object churn where avoidable
- no memory leaks
- canvas DPR capped at 2
- animation pauses when document is hidden
- production build completes without warnings
- Lighthouse performance should remain reasonable

Avoid premature optimization, but profile obvious hot paths.

---

## 15. Responsive Requirements

### Desktop

- signal stage is large and centered
- prompt composer is constrained to a readable width
- response copy remains readable
- `/system` may use a two-column layout

### Mobile

- no horizontal overflow
- canvas remains at least `280px` tall
- controls stack vertically
- prompt composer remains reachable
- state labels do not overlap the signal
- reduce trace complexity if necessary for performance

Test at approximately:

- `375 × 812`
- `768 × 1024`
- `1440 × 900`

---

## 16. Implementation Phases

### Phase 0 — Repository setup

- create or inspect Next.js project
- confirm TypeScript and App Router
- add baseline CSS tokens
- add `AGENTS.md`
- add this build specification under `docs/`
- confirm `npm run dev`, `npm run lint`, and `npm run build`

### Phase 1 — Signal engine

Deliver:

- typed presets
- reusable Canvas component
- responsive resizing
- deterministic waveform
- smooth parameter interpolation
- persistence
- pointer influence
- reduced-motion path

Acceptance criteria:

- all five primary states visibly differ
- transitions remain continuous
- no snapping or blank frames
- canvas resizes correctly
- no console errors

### Phase 2 — Product shell

Deliver:

- full-screen layout
- prompt composer
- state label
- simulated lifecycle
- response streaming
- mobile layout

Acceptance criteria:

- full interaction sequence works
- keyboard operation works
- no system controls on the product route
- product feels intentionally minimal

### Phase 3 — System page

Deliver:

- live preview
- preset selector
- parameter controls
- reset
- principles
- state map
- implementation and accessibility notes

Acceptance criteria:

- slider changes are visible immediately
- selecting a preset updates controls
- reset is reliable
- system route does not compromise main-route performance

### Phase 4 — Polish and deployment

Deliver:

- metadata
- favicon
- OG image placeholder
- README
- final responsive pass
- production build
- Vercel deployment readiness

Acceptance criteria:

- `npm run lint` passes
- `npm run build` passes
- no TypeScript errors
- no obvious layout overflow
- no animation cleanup warnings
- README includes setup and architecture

---

## 17. Testing Checklist

### Functional

- [ ] Presence runs on initial load
- [ ] Focus triggers Attention
- [ ] Typing triggers Listening
- [ ] Submit triggers Reasoning
- [ ] Response streams locally
- [ ] Completion settles correctly
- [ ] Interface returns to Presence
- [ ] Empty prompt cannot submit
- [ ] Repeated prompts work
- [ ] Rapid state changes do not break the engine

### Visual

- [ ] Signal remains centered
- [ ] Primary trace is crisp
- [ ] Glow does not overwhelm the line
- [ ] Afterimage remains controlled
- [ ] States are distinguishable without color changes
- [ ] Mobile composition remains intentional

### Accessibility

- [ ] Keyboard flow works
- [ ] Focus styles are visible
- [ ] State text is announced
- [ ] Reduced motion is respected
- [ ] Canvas has accessible descriptive text
- [ ] Text contrast is sufficient

### Technical

- [ ] No console errors
- [ ] No hydration errors
- [ ] Animation frame is canceled on unmount
- [ ] Resize observer is disconnected
- [ ] Hidden-tab behavior works
- [ ] Lint passes
- [ ] Build passes

---

## 18. Definition of Done for v0.1

v0.1 is complete when a visitor can:

1. open the app and immediately understand that the signal is alive
2. focus the composer and see the system become attentive
3. type and see it become responsive to input
4. submit a prompt and see a coherent reasoning transition
5. watch a response stream
6. see the signal resolve and return to presence
7. open `/system` to understand the behavior language and tune it
8. use the experience on desktop and mobile without errors

The result should be strong enough to record as a portfolio demo.

---

## 19. Codex Execution Instructions

Before writing code:

1. inspect the entire repository
2. read `AGENTS.md`, `README.md`, and this specification
3. identify the existing stack and conventions
4. report any conflicts between the repository and this specification
5. create a concise implementation plan
6. do not replace working project infrastructure unnecessarily

During implementation:

- work in small, reviewable phases
- preserve strict TypeScript
- prefer simple local abstractions
- avoid adding dependencies unless clearly justified
- run lint and build after each major phase
- fix root causes rather than suppressing errors
- keep the primary route visually restrained
- do not expand scope without explicit approval
- update documentation when architecture changes

At completion, report:

- files created
- files modified
- major architectural decisions
- commands run
- lint/build results
- known limitations
- recommended next step

---

## 20. First Codex Task

Use this exact task after adding this document to the repository:

```text
Read AGENTS.md, README.md, package.json, the app directory, and docs/SIGNAL_BUILD_PLAN.md.

First inspect the repository and summarize the current architecture. Then create a phased implementation plan for SIGNAL v0.1.

Implement only Phase 1: the reusable Canvas signal engine and a temporary development preview.

Requirements:
- strict TypeScript
- deterministic waveform generation
- typed behavior presets
- smooth interpolation between Presence, Attention, Listening, Reasoning, and Completion
- responsive canvas sizing with capped devicePixelRatio
- controlled oscilloscope persistence
- subtle pointer influence
- prefers-reduced-motion support
- complete cleanup on unmount
- no Three.js, WebGL, Rive, microphone APIs, or external animation libraries
- do not redesign unrelated files

Add a simple temporary state selector so each behavior can be reviewed.

Run the repository's lint and production build commands. Fix errors introduced by your work.

Do not implement the final product shell or /system route yet.

When finished, provide:
1. summary of the implementation
2. files changed
3. commands and verification results
4. known limitations
5. recommended Phase 2 task
```

---

## 21. Suggested `AGENTS.md`

Place this file at the repository root.

```md
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
```

---

## 22. Post-v0.1 Roadmap

Only consider these after v0.1 is stable:

### v0.2

- real audio amplitude simulation
- more sophisticated response behavior
- shareable parameter presets
- screen-recording mode
- optional light mode exploration

### v0.3

- WebGL or shader prototype for true spatial depth
- 3D curve projection
- higher-quality phosphor persistence
- performance comparison against Canvas 2D

### v0.4

- optional real LLM integration
- audio input with explicit permission
- design-token package
- embeddable `<Signal />` component
- documented state-machine API

Do not build these early.
