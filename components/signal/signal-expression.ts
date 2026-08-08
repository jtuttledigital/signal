import type {
  SignalRuntimeEvent,
  SignalSemanticEnvelope,
  SignalSemanticSource,
} from "./signal-events";

export const SIGNAL_EXPRESSION_DIMENSIONS = [
  "energy",
  "coherence",
  "convergence",
  "branching",
  "focus",
  "continuity",
  "complexity",
  "persistence",
] as const;

export type SignalExpressionDimension =
  (typeof SIGNAL_EXPRESSION_DIMENSIONS)[number];

/**
 * Renderer-independent semantic targets. Energy describes overall activity,
 * not amplitude; every value is normalized to the inclusive 0–1 range.
 */
export interface SignalExpressionTargets {
  readonly energy: number;
  readonly coherence: number;
  readonly convergence: number;
  readonly branching: number;
  readonly focus: number;
  readonly continuity: number;
  readonly complexity: number;
  readonly persistence: number;
}

export type SignalSemanticProvenance = Readonly<
  Partial<Record<keyof SignalSemanticEnvelope, SignalSemanticSource>>
>;

export interface SignalExpressionState {
  readonly targets: SignalExpressionTargets;
  readonly eventCount: number;
  readonly streamUpdateCount: number;
  readonly interruptionCount: number;
  readonly lastEventType: SignalRuntimeEvent["type"] | null;
  /** Provenance from the most recently applied optional semantic envelope. */
  readonly semanticProvenance: SignalSemanticProvenance;
}

interface ExpressionPlan {
  readonly targets: SignalExpressionTargets;
  readonly blend: number;
  readonly resetStreamUpdates?: boolean;
  readonly incrementStreamUpdates?: boolean;
  readonly incrementInterruptions?: boolean;
}

export const PRESENCE_EXPRESSION_TARGETS: SignalExpressionTargets = {
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

function clampTargets(
  targets: SignalExpressionTargets,
): SignalExpressionTargets {
  return {
    energy: clamp(targets.energy),
    coherence: clamp(targets.coherence),
    convergence: clamp(targets.convergence),
    branching: clamp(targets.branching),
    focus: clamp(targets.focus),
    continuity: clamp(targets.continuity),
    complexity: clamp(targets.complexity),
    persistence: clamp(targets.persistence),
  };
}

function withTargets(
  current: SignalExpressionTargets,
  patch: Partial<SignalExpressionTargets>,
): SignalExpressionTargets {
  return clampTargets({ ...current, ...patch });
}

function blendTargets(
  current: SignalExpressionTargets,
  target: SignalExpressionTargets,
  amount: number,
): SignalExpressionTargets {
  const blend = clamp(amount);

  return clampTargets({
    energy: current.energy + (target.energy - current.energy) * blend,
    coherence:
      current.coherence + (target.coherence - current.coherence) * blend,
    convergence:
      current.convergence +
      (target.convergence - current.convergence) * blend,
    branching:
      current.branching + (target.branching - current.branching) * blend,
    focus: current.focus + (target.focus - current.focus) * blend,
    continuity:
      current.continuity + (target.continuity - current.continuity) * blend,
    complexity:
      current.complexity + (target.complexity - current.complexity) * blend,
    persistence:
      current.persistence +
      (target.persistence - current.persistence) * blend,
  });
}

function normalized(value: number, scale: number): number {
  return clamp(value / scale);
}

function inputComplexity(inputLength: number): number {
  return 0.26 + normalized(inputLength, 400) * 0.24;
}

function workflowPlan(
  state: SignalExpressionState,
  phase: "start" | "progress" | "complete",
  progress?: number,
): ExpressionPlan {
  const current = state.targets;

  if (phase === "start") {
    return {
      targets: withTargets(current, {
        energy: current.energy + 0.08,
        convergence: current.convergence - 0.08,
        branching: current.branching + 0.14,
        complexity: current.complexity + 0.12,
        continuity: Math.max(current.continuity, 0.9),
      }),
      blend: 0.34,
    };
  }

  if (phase === "progress") {
    const knownProgress = progress ?? 0.5;

    return {
      targets: withTargets(current, {
        energy: current.energy + 0.04,
        convergence: current.convergence + knownProgress * 0.08,
        persistence: current.persistence + 0.05,
      }),
      blend: 0.28,
    };
  }

  return {
    targets: withTargets(current, {
      energy: current.energy - 0.06,
      coherence: current.coherence + 0.08,
      convergence: current.convergence + 0.18,
      branching: current.branching - 0.14,
    }),
    blend: 0.38,
  };
}

function eventPlan(
  state: SignalExpressionState,
  event: SignalRuntimeEvent,
): ExpressionPlan {
  const current = state.targets;

  switch (event.type) {
    case "presence":
      return { targets: PRESENCE_EXPRESSION_TARGETS, blend: 0.24 };

    case "focus":
      return {
        targets: withTargets(PRESENCE_EXPRESSION_TARGETS, {
          energy: 0.28,
          coherence: 0.9,
          convergence: 0.58,
          focus: 0.84,
          continuity: 0.96,
          persistence: 0.66,
        }),
        blend: 0.48,
      };

    case "blur":
      if (event.inputLength === 0) {
        return { targets: PRESENCE_EXPRESSION_TARGETS, blend: 0.24 };
      }

      return {
        targets: withTargets(current, {
          energy: 0.3,
          coherence: 0.82,
          branching: 0.08,
          focus: 0.62,
          continuity: 0.96,
          complexity: inputComplexity(event.inputLength),
        }),
        blend: 0.3,
      };

    case "input-start":
    case "input-update":
      return {
        targets: withTargets(current, {
          energy: 0.46,
          coherence: 0.7,
          convergence: 0.36,
          branching: 0.12,
          focus: 0.76,
          continuity: 0.96,
          complexity: inputComplexity(event.inputLength),
          persistence: 0.69,
        }),
        blend: 0.36,
      };

    case "input-pause":
      return {
        targets: withTargets(current, {
          energy: current.energy * 0.82,
          coherence: current.coherence + 0.08,
          convergence: current.convergence + 0.04,
          branching: Math.min(current.branching, 0.08),
          focus: Math.max(current.focus, 0.72),
          continuity: 0.97,
          complexity: inputComplexity(event.inputLength),
          persistence: Math.max(current.persistence, 0.7),
        }),
        blend: 0.32,
      };

    case "submit":
      return {
        targets: withTargets(current, {
          energy: 0.62,
          coherence: 0.62,
          convergence: 0.2,
          branching: 0.24,
          focus: 0.86,
          continuity: 0.97,
          complexity: 0.56 + normalized(event.inputLength, 500) * 0.18,
          persistence: 0.76,
        }),
        blend: 0.44,
        resetStreamUpdates: true,
      };

    case "processing-start":
      return {
        targets: withTargets(current, {
          energy: 0.68,
          coherence: 0.58,
          convergence: 0.18,
          branching: 0.28,
          focus: 0.88,
          continuity: 0.97,
          complexity: Math.max(current.complexity, 0.66),
          persistence: 0.78,
        }),
        blend: 0.4,
      };

    case "stream-start": {
      const elapsedInfluence = normalized(event.elapsedMs, 12_000);

      return {
        targets: withTargets(current, {
          energy: 0.56,
          coherence: 0.7,
          convergence: 0.4 + elapsedInfluence * 0.08,
          branching: 0.18,
          focus: 0.78,
          continuity: 0.97,
          complexity: Math.max(0.48, current.complexity - 0.06),
          persistence: 0.8 + elapsedInfluence * 0.08,
        }),
        blend: 0.4,
        resetStreamUpdates: true,
      };
    }

    case "stream-update": {
      const updateCount = state.streamUpdateCount + 1;
      const rateInfluence =
        event.streamRate === undefined
          ? 0.45
          : normalized(event.streamRate, 160);

      return {
        targets: withTargets(current, {
          energy: 0.44 + rateInfluence * 0.18,
          coherence: 0.72 + Math.min(updateCount * 0.025, 0.16),
          convergence: 0.46 + Math.min(updateCount * 0.04, 0.26),
          branching: 0.16 - Math.min(updateCount * 0.012, 0.1),
          focus: 0.74,
          continuity: 0.97,
          complexity: Math.max(0.32, current.complexity - 0.025),
          persistence: 0.8,
        }),
        blend: 0.28,
        incrementStreamUpdates: true,
      };
    }

    case "stream-pause":
      return {
        targets: withTargets(current, {
          energy: current.energy * 0.72,
          coherence: current.coherence + 0.05,
          convergence: current.convergence,
          branching: current.branching,
          focus: current.focus,
          continuity: 0.98,
          complexity: current.complexity,
          persistence: current.persistence + 0.04,
        }),
        blend: 0.34,
      };

    case "stream-complete":
      return {
        targets: {
          energy: 0.26,
          coherence: 0.96,
          convergence: 0.97,
          branching: 0.03,
          focus: 0.62,
          continuity: 0.98,
          complexity: 0.18,
          persistence: 0.84,
        },
        blend: 0.5,
      };

    case "interrupt": {
      const interruptionCount = state.interruptionCount + 1;

      return {
        targets: withTargets(current, {
          energy: 0.4,
          coherence: Math.max(0.42, current.coherence - 0.18),
          convergence: 0.14,
          branching: 0.3 + Math.min(interruptionCount * 0.07, 0.21),
          focus: 0.68,
          continuity: Math.max(0.86, current.continuity - 0.03),
          complexity: Math.min(0.74, current.complexity + 0.1),
          persistence: Math.max(0.74, current.persistence),
        }),
        blend: 0.42,
        incrementInterruptions: true,
      };
    }

    case "idle":
      return { targets: PRESENCE_EXPRESSION_TARGETS, blend: 0.18 };

    case "tool-start":
      return workflowPlan(state, "start");

    case "tool-progress":
      return workflowPlan(state, "progress", event.progress);

    case "tool-complete":
      return workflowPlan(state, "complete");

    case "retrieval-start":
      return {
        targets: withTargets(current, {
          energy: current.energy + 0.06,
          convergence: current.convergence - 0.06,
          branching: current.branching + 0.16,
          complexity: current.complexity + 0.1,
        }),
        blend: 0.34,
      };

    case "retrieval-complete":
      return {
        targets: withTargets(current, {
          coherence: current.coherence + 0.06,
          convergence: current.convergence + 0.14,
          branching: current.branching - 0.1,
        }),
        blend: 0.36,
      };

    case "file-processing":
    case "code-execution":
      return workflowPlan(state, event.phase, event.progress);

    case "background-work": {
      const plan = workflowPlan(state, event.phase, event.progress);

      return {
        ...plan,
        targets: withTargets(plan.targets, {
          persistence: plan.targets.persistence + 0.14,
        }),
      };
    }

    case "approval":
      if (event.phase === "requested") {
        return {
          targets: withTargets(current, {
            energy: current.energy - 0.05,
            focus: current.focus + 0.1,
            continuity: 0.98,
            persistence: current.persistence + 0.08,
          }),
          blend: 0.3,
        };
      }

      return {
        targets: withTargets(current, {
          convergence:
            current.convergence + (event.phase === "approved" ? 0.12 : -0.06),
          branching:
            current.branching + (event.phase === "approved" ? -0.08 : 0.1),
        }),
        blend: 0.34,
      };

    case "handoff":
      return {
        targets: withTargets(current, {
          energy: current.energy + (event.phase === "start" ? 0.06 : -0.04),
          convergence:
            current.convergence + (event.phase === "start" ? -0.08 : 0.12),
          branching:
            current.branching + (event.phase === "start" ? 0.18 : -0.14),
          continuity: 0.96,
        }),
        blend: 0.34,
      };
  }
}

const SEMANTIC_SOURCE_BLEND: Record<SignalSemanticSource, number> = {
  observed: 0.58,
  external: 0.42,
  derived: 0.3,
};

function blendValue(current: number, target: number, amount: number): number {
  return clamp(current + (clamp(target) - current) * clamp(amount));
}

function mergeSemanticEnvelope(
  targets: SignalExpressionTargets,
  semantic?: SignalSemanticEnvelope,
): {
  readonly targets: SignalExpressionTargets;
  readonly provenance: SignalSemanticProvenance;
} {
  if (!semantic) {
    return { targets, provenance: {} };
  }

  const next = { ...targets };
  const provenance: Partial<
    Record<keyof SignalSemanticEnvelope, SignalSemanticSource>
  > = {};

  const record = (key: keyof SignalSemanticEnvelope): number | undefined => {
    const entry = semantic[key];

    if (!entry) {
      return undefined;
    }

    provenance[key] = entry.source;
    return SEMANTIC_SOURCE_BLEND[entry.source];
  };

  let amount = record("complexity");
  if (amount !== undefined && semantic.complexity) {
    next.complexity = blendValue(
      next.complexity,
      semantic.complexity.value,
      amount,
    );
  }

  amount = record("branching");
  if (amount !== undefined && semantic.branching) {
    next.branching = blendValue(next.branching, semantic.branching.value, amount);
  }

  amount = record("convergence");
  if (amount !== undefined && semantic.convergence) {
    next.convergence = blendValue(
      next.convergence,
      semantic.convergence.value,
      amount,
    );
  }

  amount = record("novelty");
  if (amount !== undefined && semantic.novelty) {
    next.complexity = blendValue(
      next.complexity,
      Math.max(next.complexity, semantic.novelty.value),
      amount * 0.55,
    );
    next.branching = blendValue(
      next.branching,
      semantic.novelty.value,
      amount * 0.28,
    );
  }

  amount = record("interactionMomentum");
  if (amount !== undefined && semantic.interactionMomentum) {
    next.energy = blendValue(
      next.energy,
      semantic.interactionMomentum.value,
      amount * 0.5,
    );
    next.persistence = blendValue(
      next.persistence,
      0.5 + semantic.interactionMomentum.value * 0.4,
      amount * 0.35,
    );
  }

  // Proxies are deliberately weak modifiers, never ground-truth model state.
  amount = record("confidenceProxy");
  if (amount !== undefined && semantic.confidenceProxy) {
    next.coherence = blendValue(
      next.coherence,
      semantic.confidenceProxy.value,
      amount * 0.2,
    );
    next.focus = blendValue(
      next.focus,
      semantic.confidenceProxy.value,
      amount * 0.14,
    );
  }

  amount = record("uncertaintyProxy");
  if (amount !== undefined && semantic.uncertaintyProxy) {
    next.coherence = blendValue(
      next.coherence,
      1 - semantic.uncertaintyProxy.value,
      amount * 0.18,
    );
    next.branching = blendValue(
      next.branching,
      semantic.uncertaintyProxy.value,
      amount * 0.2,
    );
  }

  return { targets: clampTargets(next), provenance };
}

export function createSignalExpressionState(
  initial?: Partial<SignalExpressionTargets>,
): SignalExpressionState {
  return {
    targets: clampTargets({ ...PRESENCE_EXPRESSION_TARGETS, ...initial }),
    eventCount: 0,
    streamUpdateCount: 0,
    interruptionCount: 0,
    lastEventType: null,
    semanticProvenance: {},
  };
}

/**
 * Consumes one event already accepted by the runtime reducer and returns new
 * expression targets. This performs bounded event-level target blending only;
 * frame interpolation remains the responsibility of a future adapter.
 */
export function reduceAcceptedSignalExpressionEvent(
  state: SignalExpressionState,
  event: SignalRuntimeEvent,
): SignalExpressionState {
  const plan = eventPlan(state, event);
  const eventTargets = blendTargets(state.targets, plan.targets, plan.blend);
  const semanticMerge = mergeSemanticEnvelope(eventTargets, event.semantic);

  return {
    targets: semanticMerge.targets,
    eventCount: state.eventCount + 1,
    streamUpdateCount: plan.resetStreamUpdates
      ? 0
      : plan.incrementStreamUpdates
        ? state.streamUpdateCount + 1
        : state.streamUpdateCount,
    interruptionCount: plan.incrementInterruptions
      ? state.interruptionCount + 1
      : state.interruptionCount,
    lastEventType: event.type,
    semanticProvenance: semanticMerge.provenance,
  };
}
