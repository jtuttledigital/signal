import type { SignalExpressionTargets } from "./signal-expression";

export const SIGNAL_RENDER_INTENT_KEYS = [
  "activity",
  "structuralOrder",
  "convergence",
  "focus",
  "complexity",
  "persistence",
  "continuity",
  "expansion",
  "directionalBias",
  "symmetryBias",
  "secondaryPathWeight",
  "secondaryPathSeparation",
  "secondaryPathCoherence",
  "fieldInfluence",
  "attractorInfluence",
  "attractorStability",
] as const;

export type SignalRenderIntentKey =
  (typeof SIGNAL_RENDER_INTENT_KEYS)[number];

/** The primary preset-driven signal retains full visual authority. */
export const SIGNAL_PRIMARY_PATH_AUTHORITY = 1;
export const MAX_SECONDARY_PATH_WEIGHT = 0.58;
export const MAX_FIELD_INFLUENCE = 0.42;
export const MAX_ATTRACTOR_INFLUENCE = 0.78;

/**
 * Renderer-neutral visual tendencies. Every property is normalized to 0–1;
 * the renderer remains responsible for geometry, sampling, and composition.
 */
export interface SignalRenderIntent {
  readonly activity: number;
  readonly structuralOrder: number;
  readonly convergence: number;
  readonly focus: number;
  readonly complexity: number;
  readonly persistence: number;
  readonly continuity: number;
  readonly expansion: number;
  readonly directionalBias: number;
  readonly symmetryBias: number;
  readonly secondaryPathWeight: number;
  readonly secondaryPathSeparation: number;
  readonly secondaryPathCoherence: number;
  readonly fieldInfluence: number;
  readonly attractorInfluence: number;
  readonly attractorStability: number;
}

const FALLBACK_EXPRESSION: SignalExpressionTargets = {
  energy: 0.18,
  coherence: 0.88,
  convergence: 0.68,
  branching: 0.04,
  focus: 0.28,
  continuity: 0.94,
  complexity: 0.08,
  persistence: 0.64,
};

function clamp(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(1, Math.max(0, value));
}

function clampTo(value: number, maximum: number): number {
  return Math.min(maximum, clamp(value));
}

function normalizeExpression(
  expression: Readonly<Partial<SignalExpressionTargets>>,
): SignalExpressionTargets {
  return {
    energy: clamp(expression.energy ?? FALLBACK_EXPRESSION.energy),
    coherence: clamp(expression.coherence ?? FALLBACK_EXPRESSION.coherence),
    convergence: clamp(
      expression.convergence ?? FALLBACK_EXPRESSION.convergence,
    ),
    branching: clamp(expression.branching ?? FALLBACK_EXPRESSION.branching),
    focus: clamp(expression.focus ?? FALLBACK_EXPRESSION.focus),
    continuity: clamp(
      expression.continuity ?? FALLBACK_EXPRESSION.continuity,
    ),
    complexity: clamp(
      expression.complexity ?? FALLBACK_EXPRESSION.complexity,
    ),
    persistence: clamp(
      expression.persistence ?? FALLBACK_EXPRESSION.persistence,
    ),
  };
}

/**
 * Converts approved semantic expression into renderer-neutral modulation.
 * Presets remain the future rendering baseline; this intent can only modulate
 * that identity and is not a replacement preset.
 */
export function adaptSignalExpressionToRenderIntent(
  expression: Readonly<Partial<SignalExpressionTargets>> = {},
): SignalRenderIntent {
  const normalized = normalizeExpression(expression);
  const {
    energy,
    coherence,
    convergence,
    branching,
    focus,
    continuity,
    complexity,
    persistence,
  } = normalized;

  const expansion = clamp(
    0.22 +
      energy * 0.18 +
      branching * 0.25 +
      complexity * 0.12 -
      focus * 0.26 -
      convergence * 0.18,
  );
  const directionalBias = clamp(
    convergence * coherence * (1 - branching * 0.65) * 0.75 +
      energy * 0.08,
  );
  const symmetryBias = clamp(
    0.18 +
      coherence * 0.52 +
      convergence * 0.3 -
      branching * 0.28 -
      complexity * 0.12,
  );

  // Branching must be earned by complexity and resolves continuously as
  // convergence increases. Energy intentionally does not participate.
  const earnedBranching = branching * complexity;
  const structuralSupport = 0.55 + coherence * 0.35;
  const convergenceSuppression =
    (1 - convergence) * (0.8 + (1 - convergence) * 0.2);
  const secondaryPathWeight = clampTo(
    earnedBranching *
      structuralSupport *
      convergenceSuppression *
      1.1,
    MAX_SECONDARY_PATH_WEIGHT,
  );
  const secondaryPathSeparation = clampTo(
    secondaryPathWeight *
      (0.35 + branching * 0.5) *
      (1 - focus * 0.25),
    MAX_SECONDARY_PATH_WEIGHT,
  );
  const secondaryPathCoherence = clamp(
    0.4 + coherence * 0.45 + continuity * 0.15 - branching * 0.18,
  );

  const fieldInfluence = clampTo(
    complexity * (0.25 + branching * 0.3) +
      persistence * 0.18 +
      continuity * 0.08 -
      convergence * 0.32 -
      0.12,
    MAX_FIELD_INFLUENCE,
  );
  const attractorInfluence = clampTo(
    complexity * (0.4 + coherence * 0.35) +
      convergence * coherence * 0.25 -
      0.15,
    MAX_ATTRACTOR_INFLUENCE,
  );
  const attractorStability = clamp(
    0.18 + convergence * 0.58 + coherence * 0.3 - branching * 0.18,
  );

  return {
    activity: energy,
    structuralOrder: coherence,
    convergence,
    focus,
    complexity,
    persistence,
    continuity,
    expansion,
    directionalBias,
    symmetryBias,
    secondaryPathWeight,
    secondaryPathSeparation,
    secondaryPathCoherence,
    fieldInfluence,
    attractorInfluence,
    attractorStability,
  };
}

export const DEFAULT_SIGNAL_RENDER_INTENT =
  adaptSignalExpressionToRenderIntent();
