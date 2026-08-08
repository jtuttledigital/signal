import assert from "node:assert/strict";
import test from "node:test";

import {
  PRESENCE_EXPRESSION_TARGETS,
  SIGNAL_EXPRESSION_DIMENSIONS,
  createSignalExpressionState,
  reduceAcceptedSignalExpressionEvent,
} from "./signal-expression.ts";
import {
  createSignalRuntimeState,
  reduceSignalRuntimeEvent,
} from "./signal-events.ts";

function applyAccepted(expression, event) {
  return reduceAcceptedSignalExpressionEvent(expression, event);
}

function applyRuntime(pair, event) {
  const transition = reduceSignalRuntimeEvent(pair.runtime, event);

  if (!transition.accepted) {
    return { ...pair, runtimeTransition: transition };
  }

  return {
    runtime: transition.state,
    expression: applyAccepted(pair.expression, event),
    runtimeTransition: transition,
  };
}

function createPair() {
  return {
    runtime: createSignalRuntimeState(),
    expression: createSignalExpressionState(),
  };
}

function assertNormalized(targets) {
  assert.deepEqual(
    Object.keys(targets).sort(),
    [...SIGNAL_EXPRESSION_DIMENSIONS].sort(),
  );

  for (const dimension of SIGNAL_EXPRESSION_DIMENSIONS) {
    assert.equal(Number.isFinite(targets[dimension]), true, dimension);
    assert.ok(targets[dimension] >= 0, `${dimension} is below zero`);
    assert.ok(targets[dimension] <= 1, `${dimension} is above one`);
  }
}

test("provides a complete normalized Presence baseline", () => {
  const state = createSignalExpressionState();

  assert.deepEqual(state.targets, PRESENCE_EXPRESSION_TARGETS);
  assertNormalized(state.targets);
  assert.ok(state.targets.energy < 0.3);
  assert.ok(state.targets.coherence > 0.8);
  assert.ok(state.targets.continuity > 0.9);
  assert.ok(state.targets.branching < 0.1);
});

test("focus, typing, and typing pause preserve their semantic relationships", () => {
  const presence = createSignalExpressionState();
  const focused = applyAccepted(presence, { type: "focus", timestamp: 1 });
  const typing = applyAccepted(focused, {
    type: "input-start",
    timestamp: 2,
    inputLength: 80,
    inputDelta: 80,
  });
  const paused = applyAccepted(typing, {
    type: "input-pause",
    timestamp: 3,
    inputLength: 80,
    pauseDurationMs: 720,
  });

  assert.ok(focused.targets.focus > presence.targets.focus);
  assert.ok(typing.targets.energy > focused.targets.energy);
  assert.ok(typing.targets.complexity > presence.targets.complexity);
  assert.ok(paused.targets.energy < typing.targets.energy);
  assert.ok(paused.targets.coherence > typing.targets.coherence);
  assert.ok(paused.targets.continuity >= typing.targets.continuity);
});

test("submit and processing earn complexity without sacrificing continuity", () => {
  let state = createSignalExpressionState();
  state = applyAccepted(state, {
    type: "input-start",
    timestamp: 1,
    inputLength: 120,
    inputDelta: 120,
  });
  const submitted = applyAccepted(state, {
    type: "submit",
    timestamp: 2,
    runId: 1,
    inputLength: 120,
  });
  const processing = applyAccepted(submitted, {
    type: "processing-start",
    timestamp: 3,
    runId: 1,
  });

  assert.ok(submitted.targets.complexity > PRESENCE_EXPRESSION_TARGETS.complexity);
  assert.ok(processing.targets.energy > submitted.targets.energy);
  assert.ok(processing.targets.convergence < submitted.targets.convergence);
  assert.ok(processing.targets.continuity > 0.9);
});

test("streaming converges, stream pause holds structure, and completion resolves", () => {
  let state = createSignalExpressionState();
  state = applyAccepted(state, {
    type: "submit",
    timestamp: 1,
    runId: 1,
    inputLength: 60,
  });
  const processing = applyAccepted(state, {
    type: "processing-start",
    timestamp: 2,
    runId: 1,
  });
  state = applyAccepted(processing, {
    type: "stream-start",
    timestamp: 3,
    runId: 1,
    elapsedMs: 4_000,
  });

  for (let index = 0; index < 6; index += 1) {
    state = applyAccepted(state, {
      type: "stream-update",
      timestamp: 4 + index,
      runId: 1,
      characterDelta: 8,
      elapsedMs: 40 * (index + 1),
      streamRate: 120,
    });
  }

  assert.ok(state.targets.convergence > processing.targets.convergence);
  assert.ok(state.targets.branching < processing.targets.branching);

  const beforePause = state;
  const paused = applyAccepted(state, {
    type: "stream-pause",
    timestamp: 10,
    runId: 1,
    pauseDurationMs: 300,
    elapsedMs: 280,
  });
  assert.ok(paused.targets.energy < beforePause.targets.energy);
  assert.equal(paused.targets.complexity, beforePause.targets.complexity);
  assert.equal(paused.targets.convergence, beforePause.targets.convergence);

  const completed = applyAccepted(paused, {
    type: "stream-complete",
    timestamp: 11,
    runId: 1,
    elapsedMs: 320,
  });
  assert.ok(completed.targets.convergence > processing.targets.convergence);
  assert.ok(completed.targets.coherence > processing.targets.coherence);
  assert.ok(completed.targets.branching < processing.targets.branching);
  assert.ok(completed.targets.energy < processing.targets.energy);
});

test("interruption redirects expression without resetting continuity", () => {
  let state = createSignalExpressionState();
  state = applyAccepted(state, {
    type: "submit",
    timestamp: 1,
    runId: 1,
    inputLength: 40,
  });
  state = applyAccepted(state, {
    type: "processing-start",
    timestamp: 2,
    runId: 1,
  });
  const beforeInterrupt = state;
  const interrupted = applyAccepted(state, {
    type: "interrupt",
    timestamp: 3,
    runId: 1,
    reason: "user-input",
  });

  assert.ok(interrupted.targets.convergence < beforeInterrupt.targets.convergence);
  assert.ok(interrupted.targets.branching > beforeInterrupt.targets.branching);
  assert.ok(interrupted.targets.continuity > 0.85);
  assert.equal(interrupted.interruptionCount, 1);
});

test("repeated runs work and rejected stale events never reach expression", () => {
  let pair = createPair();
  pair = applyRuntime(pair, {
    type: "submit",
    timestamp: 1,
    runId: 1,
    inputLength: 20,
  });
  pair = applyRuntime(pair, {
    type: "processing-start",
    timestamp: 2,
    runId: 1,
  });
  pair = applyRuntime(pair, {
    type: "submit",
    timestamp: 3,
    runId: 2,
    inputLength: 30,
  });
  const expressionBeforeStaleEvent = pair.expression;

  pair = applyRuntime(pair, {
    type: "stream-complete",
    timestamp: 4,
    runId: 1,
    elapsedMs: 100,
  });

  assert.equal(pair.runtimeTransition.accepted, false);
  assert.equal(pair.runtimeTransition.reason, "stale-run");
  assert.strictEqual(pair.expression, expressionBeforeStaleEvent);
  assert.equal(pair.expression.lastEventType, "submit");
});

test("optional Level 2 work adjusts expression without becoming required", () => {
  let state = createSignalExpressionState();
  state = applyAccepted(state, {
    type: "submit",
    timestamp: 1,
    runId: 1,
    inputLength: 20,
  });
  state = applyAccepted(state, {
    type: "processing-start",
    timestamp: 2,
    runId: 1,
  });
  const processing = state;
  const toolStarted = applyAccepted(state, {
    type: "tool-start",
    timestamp: 3,
    runId: 1,
    activityId: "tool-1",
  });
  const toolCompleted = applyAccepted(toolStarted, {
    type: "tool-complete",
    timestamp: 4,
    runId: 1,
    activityId: "tool-1",
    elapsedMs: 500,
  });
  const retrievalStarted = applyAccepted(processing, {
    type: "retrieval-start",
    timestamp: 3,
    runId: 1,
    activityId: "retrieval-1",
  });
  const backgroundWork = applyAccepted(processing, {
    type: "background-work",
    timestamp: 3,
    runId: 1,
    activityId: "background-1",
    phase: "start",
  });

  assert.ok(toolStarted.targets.branching > processing.targets.branching);
  assert.ok(toolStarted.targets.complexity > processing.targets.complexity);
  assert.ok(toolCompleted.targets.convergence > toolStarted.targets.convergence);
  assert.ok(retrievalStarted.targets.branching > processing.targets.branching);
  assert.ok(backgroundWork.targets.persistence > processing.targets.persistence);
});

test("Level 3 provenance is retained and observed values have stronger weight", () => {
  const baseline = createSignalExpressionState();
  const derived = applyAccepted(baseline, {
    type: "focus",
    timestamp: 1,
    semantic: {
      complexity: { value: 1, source: "derived" },
    },
  });
  const observed = applyAccepted(baseline, {
    type: "focus",
    timestamp: 1,
    semantic: {
      complexity: { value: 1, source: "observed" },
      confidenceProxy: { value: 0.8, source: "external" },
    },
  });

  assert.ok(observed.targets.complexity > derived.targets.complexity);
  assert.equal(observed.semanticProvenance.complexity, "observed");
  assert.equal(observed.semanticProvenance.confidenceProxy, "external");
  assertNormalized(observed.targets);
});

test("all values are clamped and graceful defaults never omit dimensions", () => {
  let state = createSignalExpressionState({
    energy: 4,
    coherence: Number.POSITIVE_INFINITY,
    branching: -2,
  });
  assertNormalized(state.targets);

  const level1OnlySequence = [
    { type: "focus", timestamp: 1 },
    {
      type: "input-start",
      timestamp: 2,
      inputLength: 1_000_000,
      inputDelta: 1_000_000,
    },
    {
      type: "submit",
      timestamp: 3,
      runId: 1,
      inputLength: 1_000_000,
    },
    { type: "processing-start", timestamp: 4, runId: 1 },
    {
      type: "stream-start",
      timestamp: 5,
      runId: 1,
      elapsedMs: 1_000_000,
    },
    {
      type: "stream-update",
      timestamp: 6,
      runId: 1,
      characterDelta: 1,
      elapsedMs: 1,
      streamRate: 1_000_000,
    },
  ];

  for (const event of level1OnlySequence) {
    state = applyAccepted(state, event);
    assertNormalized(state.targets);
  }
});

test("identical accepted event sequences produce identical expression state", () => {
  const sequence = [
    { type: "focus", timestamp: 1 },
    {
      type: "input-start",
      timestamp: 2,
      inputLength: 24,
      inputDelta: 24,
    },
    {
      type: "input-pause",
      timestamp: 3,
      inputLength: 24,
      pauseDurationMs: 720,
    },
    { type: "submit", timestamp: 4, runId: 1, inputLength: 24 },
    { type: "processing-start", timestamp: 5, runId: 1 },
    { type: "stream-start", timestamp: 6, runId: 1, elapsedMs: 3_000 },
    {
      type: "stream-update",
      timestamp: 7,
      runId: 1,
      characterDelta: 10,
      elapsedMs: 50,
      streamRate: 120,
    },
    { type: "stream-complete", timestamp: 8, runId: 1, elapsedMs: 100 },
    { type: "presence", timestamp: 9 },
    { type: "idle", timestamp: 10, elapsedMs: 2_000 },
  ];

  const reduceSequence = () =>
    sequence.reduce(
      (state, event) => applyAccepted(state, event),
      createSignalExpressionState(),
    );

  assert.deepEqual(reduceSequence(), reduceSequence());
});
