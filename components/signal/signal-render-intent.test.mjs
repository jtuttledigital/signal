import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SIGNAL_RENDER_INTENT,
  MAX_ATTRACTOR_INFLUENCE,
  MAX_FIELD_INFLUENCE,
  MAX_SECONDARY_PATH_WEIGHT,
  SIGNAL_PRIMARY_PATH_AUTHORITY,
  SIGNAL_RENDER_INTENT_KEYS,
  adaptSignalExpressionToRenderIntent,
} from "./signal-render-intent.ts";

const EXPRESSIONS = {
  presence: {
    energy: 0.18,
    coherence: 0.88,
    convergence: 0.68,
    branching: 0.04,
    focus: 0.28,
    continuity: 0.94,
    complexity: 0.08,
    persistence: 0.64,
  },
  attention: {
    energy: 0.28,
    coherence: 0.9,
    convergence: 0.58,
    branching: 0.04,
    focus: 0.84,
    continuity: 0.96,
    complexity: 0.1,
    persistence: 0.66,
  },
  listening: {
    energy: 0.46,
    coherence: 0.76,
    convergence: 0.42,
    branching: 0.1,
    focus: 0.74,
    continuity: 0.96,
    complexity: 0.3,
    persistence: 0.7,
  },
  reasoning: {
    energy: 0.68,
    coherence: 0.58,
    convergence: 0.18,
    branching: 0.48,
    focus: 0.88,
    continuity: 0.97,
    complexity: 0.7,
    persistence: 0.78,
  },
  responding: {
    energy: 0.52,
    coherence: 0.82,
    convergence: 0.68,
    branching: 0.12,
    focus: 0.74,
    continuity: 0.97,
    complexity: 0.38,
    persistence: 0.8,
  },
  completion: {
    energy: 0.26,
    coherence: 0.96,
    convergence: 0.97,
    branching: 0.03,
    focus: 0.62,
    continuity: 0.98,
    complexity: 0.18,
    persistence: 0.84,
  },
};

function assertCompleteAndNormalized(intent) {
  assert.deepEqual(
    Object.keys(intent).sort(),
    [...SIGNAL_RENDER_INTENT_KEYS].sort(),
  );

  for (const key of SIGNAL_RENDER_INTENT_KEYS) {
    assert.equal(Number.isFinite(intent[key]), true, key);
    assert.ok(intent[key] >= 0, `${key} is below zero`);
    assert.ok(intent[key] <= 1, `${key} is above one`);
  }
}

function assertPrimaryDominance(intent) {
  assert.ok(
    intent.secondaryPathWeight < SIGNAL_PRIMARY_PATH_AUTHORITY,
    "secondary path exceeded primary authority",
  );
  assert.ok(
    intent.secondaryPathWeight <= MAX_SECONDARY_PATH_WEIGHT,
    "secondary path exceeded its restraint cap",
  );
  assert.ok(
    intent.fieldInfluence <= MAX_FIELD_INFLUENCE,
    "field exceeded its restraint cap",
  );
  assert.ok(
    intent.attractorInfluence <= MAX_ATTRACTOR_INFLUENCE,
    "attractor exceeded its influence cap",
  );
}

test("returns complete deterministic Presence-like defaults", () => {
  const first = adaptSignalExpressionToRenderIntent();
  const second = adaptSignalExpressionToRenderIntent();

  assert.deepEqual(first, DEFAULT_SIGNAL_RENDER_INTENT);
  assert.deepEqual(first, second);
  assertCompleteAndNormalized(first);
  assertPrimaryDominance(first);
  assert.ok(first.secondaryPathWeight < 0.01);
  assert.ok(first.fieldInfluence < 0.05);
});

test("Attention concentrates more strongly than Presence", () => {
  const presence = adaptSignalExpressionToRenderIntent(EXPRESSIONS.presence);
  const attention = adaptSignalExpressionToRenderIntent(EXPRESSIONS.attention);

  assert.ok(attention.focus > presence.focus);
  assert.ok(attention.expansion < presence.expansion);
  assert.ok(attention.structuralOrder >= presence.structuralOrder);
  assert.ok(attention.secondaryPathWeight < 0.01);
});

test("Listening remains moderately active and open without default branching", () => {
  const attention = adaptSignalExpressionToRenderIntent(EXPRESSIONS.attention);
  const listening = adaptSignalExpressionToRenderIntent(EXPRESSIONS.listening);
  const reasoning = adaptSignalExpressionToRenderIntent(EXPRESSIONS.reasoning);

  assert.ok(listening.activity > attention.activity);
  assert.ok(listening.activity < reasoning.activity);
  assert.ok(listening.expansion > attention.expansion);
  assert.ok(listening.secondaryPathWeight < 0.05);
});

test("Reasoning earns field, attractor, and secondary-path potential", () => {
  const listening = adaptSignalExpressionToRenderIntent(EXPRESSIONS.listening);
  const reasoning = adaptSignalExpressionToRenderIntent(EXPRESSIONS.reasoning);

  assert.ok(reasoning.complexity > listening.complexity);
  assert.ok(reasoning.fieldInfluence > listening.fieldInfluence);
  assert.ok(reasoning.attractorInfluence > listening.attractorInfluence);
  assert.ok(reasoning.secondaryPathWeight > listening.secondaryPathWeight);
  assertPrimaryDominance(reasoning);
});

test("Responding becomes more ordered, directional, and convergent", () => {
  const reasoning = adaptSignalExpressionToRenderIntent(EXPRESSIONS.reasoning);
  const responding = adaptSignalExpressionToRenderIntent(EXPRESSIONS.responding);

  assert.ok(responding.structuralOrder > reasoning.structuralOrder);
  assert.ok(responding.convergence > reasoning.convergence);
  assert.ok(responding.directionalBias > reasoning.directionalBias);
  assert.ok(responding.secondaryPathWeight < reasoning.secondaryPathWeight);
});

test("Completion resolves secondary and field expression", () => {
  const responding = adaptSignalExpressionToRenderIntent(EXPRESSIONS.responding);
  const completion = adaptSignalExpressionToRenderIntent(EXPRESSIONS.completion);

  assert.ok(completion.convergence > responding.convergence);
  assert.ok(completion.attractorStability > responding.attractorStability);
  assert.ok(completion.secondaryPathWeight < 0.01);
  assert.ok(completion.fieldInfluence < 0.05);
  assertPrimaryDominance(completion);
});

test("high energy alone cannot create secondary-path authority", () => {
  const lowEnergy = adaptSignalExpressionToRenderIntent({
    ...EXPRESSIONS.presence,
    energy: 0,
    branching: 0,
    complexity: 0,
  });
  const highEnergy = adaptSignalExpressionToRenderIntent({
    ...EXPRESSIONS.presence,
    energy: 1,
    branching: 0,
    complexity: 0,
  });

  assert.equal(highEnergy.secondaryPathWeight, 0);
  assert.equal(
    highEnergy.secondaryPathWeight,
    lowEnergy.secondaryPathWeight,
  );
});

test("branching requires earned complexity and is suppressed by convergence", () => {
  const lowComplexity = adaptSignalExpressionToRenderIntent({
    ...EXPRESSIONS.reasoning,
    branching: 0.9,
    complexity: 0.08,
  });
  const earned = adaptSignalExpressionToRenderIntent({
    ...EXPRESSIONS.reasoning,
    branching: 0.9,
    complexity: 0.8,
    convergence: 0.1,
  });
  const converged = adaptSignalExpressionToRenderIntent({
    ...EXPRESSIONS.reasoning,
    branching: 0.9,
    complexity: 0.8,
    convergence: 0.95,
  });

  assert.ok(lowComplexity.secondaryPathWeight < 0.1);
  assert.ok(earned.secondaryPathWeight > lowComplexity.secondaryPathWeight);
  assert.ok(converged.secondaryPathWeight < earned.secondaryPathWeight);
});

test("clamps malformed numeric input and preserves complete output", () => {
  const intent = adaptSignalExpressionToRenderIntent({
    energy: 4,
    coherence: -2,
    convergence: Number.POSITIVE_INFINITY,
    branching: 8,
    focus: -4,
    continuity: 3,
    complexity: 9,
    persistence: -1,
  });

  assertCompleteAndNormalized(intent);
  assertPrimaryDominance(intent);
});

test("identical expression produces identical intent without mutation", () => {
  const expression = Object.freeze({ ...EXPRESSIONS.reasoning });
  const snapshot = { ...expression };

  const first = adaptSignalExpressionToRenderIntent(expression);
  const second = adaptSignalExpressionToRenderIntent(expression);

  assert.deepEqual(first, second);
  assert.deepEqual(expression, snapshot);
});

test("primary dominance holds across all normalized expression corners", () => {
  const dimensions = [
    "energy",
    "coherence",
    "convergence",
    "branching",
    "focus",
    "continuity",
    "complexity",
    "persistence",
  ];

  for (let mask = 0; mask < 2 ** dimensions.length; mask += 1) {
    const expression = Object.fromEntries(
      dimensions.map((dimension, index) => [
        dimension,
        (mask >> index) & 1,
      ]),
    );
    const intent = adaptSignalExpressionToRenderIntent(expression);

    assertCompleteAndNormalized(intent);
    assertPrimaryDominance(intent);
  }
});
