export type SignalSemanticSource = "observed" | "derived" | "external";

export type SignalInterruptionReason =
  | "user-input"
  | "new-submission"
  | "manual-override"
  | "cancelled"
  | "timeout"
  | "external";

export interface SignalSemanticValue {
  /** Normalized to the inclusive 0–1 range. */
  readonly value: number;
  readonly source: SignalSemanticSource;
}

/**
 * Optional Level 3 context. These values are enhancements, never renderer
 * requirements. Confidence and uncertainty are explicitly proxies rather than
 * claims about a model's internal state.
 */
export interface SignalSemanticEnvelope {
  readonly complexity?: SignalSemanticValue;
  readonly branching?: SignalSemanticValue;
  readonly novelty?: SignalSemanticValue;
  readonly convergence?: SignalSemanticValue;
  readonly confidenceProxy?: SignalSemanticValue;
  readonly uncertaintyProxy?: SignalSemanticValue;
  readonly interactionMomentum?: SignalSemanticValue;
}

type RuntimeEvent<Type extends string, Payload extends object = object> =
  Readonly<
    {
      type: Type;
      /** Monotonic milliseconds from the producing runtime. */
      timestamp: number;
      semantic?: SignalSemanticEnvelope;
    } & Payload
  >;

export type SignalLevel1Event =
  | RuntimeEvent<"presence">
  | RuntimeEvent<"focus">
  | RuntimeEvent<"blur", { inputLength: number }>
  | RuntimeEvent<
      "input-start",
      { inputLength: number; inputDelta: number }
    >
  | RuntimeEvent<
      "input-update",
      { inputLength: number; inputDelta: number }
    >
  | RuntimeEvent<
      "input-pause",
      { inputLength: number; pauseDurationMs: number }
    >
  | RuntimeEvent<"submit", { runId: number; inputLength: number }>
  | RuntimeEvent<"processing-start", { runId: number }>
  | RuntimeEvent<"stream-start", { runId: number; elapsedMs: number }>
  | RuntimeEvent<
      "stream-update",
      {
        runId: number;
        characterDelta: number;
        tokenDelta?: number;
        streamRate?: number;
        elapsedMs: number;
      }
    >
  | RuntimeEvent<
      "stream-pause",
      { runId: number; pauseDurationMs: number; elapsedMs: number }
    >
  | RuntimeEvent<"stream-complete", { runId: number; elapsedMs: number }>
  | RuntimeEvent<
      "interrupt",
      {
        runId: number;
        reason: SignalInterruptionReason;
      }
    >
  | RuntimeEvent<"idle", { elapsedMs: number }>;

export type SignalWorkflowPhase = "start" | "progress" | "complete";

type WorkflowPayload = {
  runId: number;
  activityId: string;
};

/**
 * Level 2 events describe optional observable work. They do not change the
 * universal lifecycle and may be omitted entirely.
 */
export type SignalLevel2Event =
  | RuntimeEvent<
      "tool-start",
      WorkflowPayload & { toolName?: string }
    >
  | RuntimeEvent<
      "tool-progress",
      WorkflowPayload & { progress?: number }
    >
  | RuntimeEvent<
      "tool-complete",
      WorkflowPayload & { elapsedMs: number; outcome?: "success" | "failure" }
    >
  | RuntimeEvent<"retrieval-start", WorkflowPayload>
  | RuntimeEvent<
      "retrieval-complete",
      WorkflowPayload & { elapsedMs: number; resultCount?: number }
    >
  | RuntimeEvent<
      "file-processing",
      WorkflowPayload & { phase: SignalWorkflowPhase; progress?: number }
    >
  | RuntimeEvent<
      "code-execution",
      WorkflowPayload & { phase: SignalWorkflowPhase; progress?: number }
    >
  | RuntimeEvent<
      "background-work",
      WorkflowPayload & { phase: SignalWorkflowPhase; progress?: number }
    >
  | RuntimeEvent<
      "approval",
      WorkflowPayload & {
        phase: "requested" | "approved" | "rejected";
      }
    >
  | RuntimeEvent<
      "handoff",
      WorkflowPayload & { phase: "start" | "complete"; target?: string }
    >;

export type SignalRuntimeEvent = SignalLevel1Event | SignalLevel2Event;

export type SignalRuntimePhase =
  | "presence"
  | "focused"
  | "input"
  | "input-paused"
  | "submitted"
  | "processing"
  | "streaming"
  | "stream-paused"
  | "complete"
  | "interrupted"
  | "idle";

export interface SignalRuntimeState {
  readonly phase: SignalRuntimePhase;
  readonly activeRunId: number | null;
  readonly latestRunId: number;
  readonly inputLength: number;
  readonly streamedCharacters: number;
  readonly lastEventType: SignalRuntimeEvent["type"] | null;
  readonly lastTimestamp: number;
}

export interface SignalRuntimeTransition {
  readonly accepted: boolean;
  readonly state: SignalRuntimeState;
  readonly reason?:
    | "invalid-payload"
    | "out-of-order"
    | "stale-run"
    | "invalid-transition";
}

const SEMANTIC_KEYS = [
  "complexity",
  "branching",
  "novelty",
  "convergence",
  "confidenceProxy",
  "uncertaintyProxy",
  "interactionMomentum",
] as const satisfies readonly (keyof SignalSemanticEnvelope)[];

const LEVEL_2_EVENT_TYPES = new Set<SignalLevel2Event["type"]>([
  "tool-start",
  "tool-progress",
  "tool-complete",
  "retrieval-start",
  "retrieval-complete",
  "file-processing",
  "code-execution",
  "background-work",
  "approval",
  "handoff",
]);

export function createSignalRuntimeState(
  timestamp = 0,
): SignalRuntimeState {
  return {
    phase: "presence",
    activeRunId: null,
    latestRunId: 0,
    inputLength: 0,
    streamedCharacters: 0,
    lastEventType: null,
    lastTimestamp: timestamp,
  };
}

function reject(
  state: SignalRuntimeState,
  reason: NonNullable<SignalRuntimeTransition["reason"]>,
): SignalRuntimeTransition {
  return { accepted: false, state, reason };
}

function accept(
  state: SignalRuntimeState,
  event: SignalRuntimeEvent,
  patch: Partial<SignalRuntimeState>,
): SignalRuntimeTransition {
  return {
    accepted: true,
    state: {
      ...state,
      ...patch,
      lastEventType: event.type,
      lastTimestamp: event.timestamp,
    },
  };
}

function isNonNegative(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isNonNegativeInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

function hasValidSemantics(semantic?: SignalSemanticEnvelope): boolean {
  if (!semantic) {
    return true;
  }

  return SEMANTIC_KEYS.every((key) => {
    const entry = semantic[key];

    return (
      entry === undefined ||
      (Number.isFinite(entry.value) &&
        entry.value >= 0 &&
        entry.value <= 1 &&
        ["observed", "derived", "external"].includes(entry.source))
    );
  });
}

function hasActiveRun(
  state: SignalRuntimeState,
  event: { readonly runId: number },
): boolean {
  return event.runId === state.activeRunId;
}

function hasValidOptionalProgress(progress?: number): boolean {
  return (
    progress === undefined ||
    (Number.isFinite(progress) && progress >= 0 && progress <= 1)
  );
}

function reduceLevel2Event(
  state: SignalRuntimeState,
  event: SignalLevel2Event,
): SignalRuntimeTransition {
  if (
    !isPositiveInteger(event.runId) ||
    typeof event.activityId !== "string" ||
    !event.activityId.trim()
  ) {
    return reject(state, "invalid-payload");
  }

  if (!hasActiveRun(state, event)) {
    return reject(state, "stale-run");
  }

  if (
    ("progress" in event && !hasValidOptionalProgress(event.progress)) ||
    ("elapsedMs" in event && !isNonNegative(event.elapsedMs)) ||
    ("resultCount" in event &&
      event.resultCount !== undefined &&
      !isNonNegativeInteger(event.resultCount))
  ) {
    return reject(state, "invalid-payload");
  }

  return accept(state, event, {});
}

/**
 * Applies one normalized event without mutation. Rejected events return the
 * original state reference, so stale or invalid input cannot corrupt runtime
 * state.
 */
export function reduceSignalRuntimeEvent(
  state: SignalRuntimeState,
  event: SignalRuntimeEvent,
): SignalRuntimeTransition {
  if (
    !isNonNegative(event.timestamp) ||
    !hasValidSemantics(event.semantic)
  ) {
    return reject(state, "invalid-payload");
  }

  if (event.timestamp < state.lastTimestamp) {
    return reject(state, "out-of-order");
  }

  if (LEVEL_2_EVENT_TYPES.has(event.type as SignalLevel2Event["type"])) {
    return reduceLevel2Event(state, event as SignalLevel2Event);
  }

  const level1Event = event as SignalLevel1Event;

  switch (level1Event.type) {
    case "presence":
      if (
        ![
          "presence",
          "complete",
          "interrupted",
          "idle",
        ].includes(state.phase)
      ) {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, {
        phase: "presence",
        activeRunId: null,
        inputLength: 0,
        streamedCharacters: 0,
      });

    case "focus":
      return accept(state, level1Event, {
        phase: "focused",
        activeRunId: null,
        inputLength: 0,
        streamedCharacters: 0,
      });

    case "blur":
      if (!isNonNegativeInteger(level1Event.inputLength)) {
        return reject(state, "invalid-payload");
      }

      if (!["focused", "input", "input-paused"].includes(state.phase)) {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, {
        phase: level1Event.inputLength > 0 ? "input-paused" : "presence",
        activeRunId: null,
        inputLength: level1Event.inputLength,
      });

    case "input-start":
      if (
        level1Event.inputLength <= 0 ||
        level1Event.inputDelta <= 0 ||
        !isNonNegativeInteger(level1Event.inputLength) ||
        !Number.isInteger(level1Event.inputDelta)
      ) {
        return reject(state, "invalid-payload");
      }

      return accept(state, level1Event, {
        phase: "input",
        activeRunId: null,
        inputLength: level1Event.inputLength,
        streamedCharacters: 0,
      });

    case "input-update":
      if (
        !isNonNegativeInteger(level1Event.inputLength) ||
        !Number.isInteger(level1Event.inputDelta)
      ) {
        return reject(state, "invalid-payload");
      }

      return accept(state, level1Event, {
        phase: level1Event.inputLength > 0 ? "input" : "focused",
        activeRunId: null,
        inputLength: level1Event.inputLength,
        streamedCharacters: 0,
      });

    case "input-pause":
      if (
        level1Event.inputLength <= 0 ||
        !isNonNegativeInteger(level1Event.inputLength) ||
        !isNonNegative(level1Event.pauseDurationMs) ||
        state.phase !== "input" ||
        level1Event.inputLength !== state.inputLength
      ) {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, { phase: "input-paused" });

    case "submit":
      if (
        !isPositiveInteger(level1Event.runId) ||
        level1Event.runId <= state.latestRunId ||
        level1Event.inputLength <= 0 ||
        !isNonNegativeInteger(level1Event.inputLength)
      ) {
        return reject(state, "invalid-payload");
      }

      return accept(state, level1Event, {
        phase: "submitted",
        activeRunId: level1Event.runId,
        latestRunId: level1Event.runId,
        inputLength: level1Event.inputLength,
        streamedCharacters: 0,
      });

    case "processing-start":
      if (!isPositiveInteger(level1Event.runId)) {
        return reject(state, "invalid-payload");
      }

      if (!hasActiveRun(state, level1Event)) {
        return reject(state, "stale-run");
      }

      if (state.phase !== "submitted") {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, { phase: "processing" });

    case "stream-start":
      if (!isNonNegative(level1Event.elapsedMs)) {
        return reject(state, "invalid-payload");
      }

      if (!hasActiveRun(state, level1Event)) {
        return reject(state, "stale-run");
      }

      if (state.phase !== "processing") {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, {
        phase: "streaming",
        streamedCharacters: 0,
      });

    case "stream-update":
      if (
        level1Event.characterDelta <= 0 ||
        !isPositiveInteger(level1Event.characterDelta) ||
        !isNonNegative(level1Event.elapsedMs) ||
        (level1Event.tokenDelta !== undefined &&
          !isNonNegativeInteger(level1Event.tokenDelta)) ||
        (level1Event.streamRate !== undefined &&
          !isNonNegative(level1Event.streamRate))
      ) {
        return reject(state, "invalid-payload");
      }

      if (!hasActiveRun(state, level1Event)) {
        return reject(state, "stale-run");
      }

      if (!["streaming", "stream-paused"].includes(state.phase)) {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, {
        phase: "streaming",
        streamedCharacters:
          state.streamedCharacters + level1Event.characterDelta,
      });

    case "stream-pause":
      if (
        !isNonNegative(level1Event.pauseDurationMs) ||
        !isNonNegative(level1Event.elapsedMs)
      ) {
        return reject(state, "invalid-payload");
      }

      if (!hasActiveRun(state, level1Event)) {
        return reject(state, "stale-run");
      }

      if (state.phase !== "streaming") {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, { phase: "stream-paused" });

    case "stream-complete":
      if (!isNonNegative(level1Event.elapsedMs)) {
        return reject(state, "invalid-payload");
      }

      if (!hasActiveRun(state, level1Event)) {
        return reject(state, "stale-run");
      }

      if (!["streaming", "stream-paused"].includes(state.phase)) {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, { phase: "complete" });

    case "interrupt":
      if (!isPositiveInteger(level1Event.runId)) {
        return reject(state, "invalid-payload");
      }

      if (!hasActiveRun(state, level1Event)) {
        return reject(state, "stale-run");
      }

      return accept(state, level1Event, {
        phase: "interrupted",
        activeRunId: null,
      });

    case "idle":
      if (!isNonNegative(level1Event.elapsedMs)) {
        return reject(state, "invalid-payload");
      }

      if (state.activeRunId !== null) {
        return reject(state, "invalid-transition");
      }

      return accept(state, level1Event, { phase: "idle" });
  }
}
