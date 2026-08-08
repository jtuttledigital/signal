import assert from "node:assert/strict";
import test from "node:test";

import {
  createSignalRuntimeState,
  reduceSignalRuntimeEvent,
} from "./signal-events.ts";

function apply(state, event) {
  const transition = reduceSignalRuntimeEvent(state, event);
  assert.equal(
    transition.accepted,
    true,
    `${event.type} was rejected: ${transition.reason}`,
  );
  return transition.state;
}

test("accepts the complete Level 1 lifecycle without optional data", () => {
  let state = createSignalRuntimeState();

  state = apply(state, { type: "focus", timestamp: 1 });
  state = apply(state, {
    type: "input-start",
    timestamp: 2,
    inputLength: 4,
    inputDelta: 4,
  });
  state = apply(state, {
    type: "input-update",
    timestamp: 3,
    inputLength: 6,
    inputDelta: 2,
  });
  state = apply(state, {
    type: "input-pause",
    timestamp: 4,
    inputLength: 6,
    pauseDurationMs: 720,
  });
  state = apply(state, {
    type: "submit",
    timestamp: 5,
    runId: 1,
    inputLength: 6,
  });
  state = apply(state, {
    type: "processing-start",
    timestamp: 5,
    runId: 1,
  });
  state = apply(state, {
    type: "stream-start",
    timestamp: 6,
    runId: 1,
    elapsedMs: 1_000,
  });
  state = apply(state, {
    type: "stream-update",
    timestamp: 7,
    runId: 1,
    characterDelta: 8,
    elapsedMs: 40,
    streamRate: 200,
  });
  state = apply(state, {
    type: "stream-complete",
    timestamp: 8,
    runId: 1,
    elapsedMs: 80,
  });

  assert.equal(state.phase, "complete");
  assert.equal(state.streamedCharacters, 8);

  state = apply(state, { type: "presence", timestamp: 9 });
  assert.equal(state.phase, "presence");
  assert.equal(state.activeRunId, null);
});

test("typing interrupts an active run and rejects its stale events", () => {
  let state = createSignalRuntimeState();

  state = apply(state, {
    type: "submit",
    timestamp: 1,
    runId: 1,
    inputLength: 3,
  });
  state = apply(state, {
    type: "processing-start",
    timestamp: 2,
    runId: 1,
  });
  state = apply(state, {
    type: "interrupt",
    timestamp: 3,
    runId: 1,
    reason: "user-input",
  });
  state = apply(state, {
    type: "input-start",
    timestamp: 4,
    inputLength: 1,
    inputDelta: 1,
  });

  const stale = reduceSignalRuntimeEvent(state, {
    type: "stream-start",
    timestamp: 5,
    runId: 1,
    elapsedMs: 10,
  });

  assert.equal(stale.accepted, false);
  assert.equal(stale.reason, "stale-run");
  assert.strictEqual(stale.state, state);
  assert.equal(state.phase, "input");
});

test("a repeated submission supersedes the prior run", () => {
  let state = createSignalRuntimeState();

  state = apply(state, {
    type: "submit",
    timestamp: 1,
    runId: 2,
    inputLength: 5,
  });
  state = apply(state, {
    type: "processing-start",
    timestamp: 2,
    runId: 2,
  });
  state = apply(state, {
    type: "submit",
    timestamp: 3,
    runId: 3,
    inputLength: 7,
  });

  assert.equal(state.activeRunId, 3);
  assert.equal(state.latestRunId, 3);

  const oldCompletion = reduceSignalRuntimeEvent(state, {
    type: "stream-complete",
    timestamp: 4,
    runId: 2,
    elapsedMs: 20,
  });

  assert.equal(oldCompletion.accepted, false);
  assert.equal(oldCompletion.reason, "stale-run");
  assert.strictEqual(oldCompletion.state, state);
});

test("accepts optional workflow and semantic extensions without requiring them", () => {
  let state = createSignalRuntimeState();

  state = apply(state, {
    type: "submit",
    timestamp: 1,
    runId: 1,
    inputLength: 4,
  });
  state = apply(state, {
    type: "processing-start",
    timestamp: 2,
    runId: 1,
  });
  state = apply(state, {
    type: "tool-start",
    timestamp: 3,
    runId: 1,
    activityId: "tool-1",
  });
  state = apply(state, {
    type: "tool-progress",
    timestamp: 4,
    runId: 1,
    activityId: "tool-1",
    progress: 0.5,
    semantic: {
      complexity: { value: 0.4, source: "observed" },
      convergence: { value: 0.6, source: "derived" },
      confidenceProxy: { value: 0.5, source: "external" },
    },
  });

  assert.equal(state.phase, "processing");
  assert.equal(state.lastEventType, "tool-progress");
});

test("invalid and out-of-order events preserve the prior state", () => {
  let state = createSignalRuntimeState();
  state = apply(state, { type: "focus", timestamp: 10 });

  const outOfOrder = reduceSignalRuntimeEvent(state, {
    type: "blur",
    timestamp: 9,
    inputLength: 0,
  });
  assert.equal(outOfOrder.accepted, false);
  assert.equal(outOfOrder.reason, "out-of-order");
  assert.strictEqual(outOfOrder.state, state);

  const invalidTransition = reduceSignalRuntimeEvent(state, {
    type: "stream-complete",
    timestamp: 11,
    runId: 1,
    elapsedMs: 5,
  });
  assert.equal(invalidTransition.accepted, false);
  assert.strictEqual(invalidTransition.state, state);

  const invalidSemanticValue = reduceSignalRuntimeEvent(state, {
    type: "input-start",
    timestamp: 11,
    inputLength: 1,
    inputDelta: 1,
    semantic: {
      uncertaintyProxy: { value: 2, source: "derived" },
    },
  });
  assert.equal(invalidSemanticValue.accepted, false);
  assert.equal(invalidSemanticValue.reason, "invalid-payload");
  assert.strictEqual(invalidSemanticValue.state, state);
});

test("rapid focus and blur remains valid", () => {
  let state = createSignalRuntimeState();

  state = apply(state, { type: "focus", timestamp: 1 });
  state = apply(state, { type: "blur", timestamp: 2, inputLength: 0 });
  state = apply(state, { type: "focus", timestamp: 3 });
  state = apply(state, { type: "blur", timestamp: 4, inputLength: 0 });

  assert.equal(state.phase, "presence");
});
