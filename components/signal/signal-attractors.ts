import type {
  AttractorIntent,
  SignalAttractor,
} from "@/components/signal/signal-types";

const TAU = Math.PI * 2;
const REASONING_SEGMENT_SECONDS = 1.65;

export const SIGNAL_ATTRACTORS = [
  "none",
  "orbital",
  "figure-eight",
  "fold",
] as const satisfies readonly SignalAttractor[];

const CYCLING_ATTRACTORS = [
  "orbital",
  "figure-eight",
  "fold",
] as const satisfies readonly SignalAttractor[];

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value: number): number {
  const normalized = clamp01(value);
  return normalized * normalized * (3 - 2 * normalized);
}

export function getActiveAttractor(
  intent: AttractorIntent,
  elapsedSeconds: number,
  reducedMotion: boolean,
): SignalAttractor {
  if (!intent.cycle || reducedMotion) {
    return intent.type;
  }

  const segment = Math.floor(elapsedSeconds / REASONING_SEGMENT_SECONDS);
  return CYCLING_ATTRACTORS[segment % CYCLING_ATTRACTORS.length];
}

export function getAttractorActivation(
  intent: AttractorIntent,
  elapsedSeconds: number,
  reducedMotion: boolean,
): number {
  if (intent.type === "none" || intent.strength <= 0) {
    return 0;
  }

  if (!intent.cycle || reducedMotion) {
    return reducedMotion ? 0.72 : 1;
  }

  const segmentProgress =
    (elapsedSeconds % REASONING_SEGMENT_SECONDS) /
    REASONING_SEGMENT_SECONDS;
  const rampDuration = 0.26 - intent.stability * 0.1;
  const holdEnd = 0.58 + intent.stability * 0.2;

  if (segmentProgress < rampDuration) {
    return smoothstep(segmentProgress / rampDuration);
  }

  if (segmentProgress <= holdEnd) {
    return 1;
  }

  return 1 - smoothstep((segmentProgress - holdEnd) / (1 - holdEnd));
}

export function sampleAttractorX(
  type: SignalAttractor,
  localPosition: number,
  phase: number,
  stability: number,
): number {
  const theta = (localPosition + 1) * Math.PI + phase * TAU;

  switch (type) {
    case "orbital":
      return Math.sin(theta) * (0.82 + stability * 0.18);
    case "figure-eight":
      return Math.sin(theta);
    case "fold":
      return (
        Math.sin(theta * 1.5) *
        Math.cos(theta * 0.5) *
        (0.36 + stability * 0.12)
      );
    case "none":
      return 0;
  }
}

export function sampleAttractorY(
  type: SignalAttractor,
  localPosition: number,
  phase: number,
  stability: number,
): number {
  const theta = (localPosition + 1) * Math.PI + phase * TAU;

  switch (type) {
    case "orbital":
      return Math.cos(theta) * (0.64 + stability * 0.2);
    case "figure-eight":
      return Math.sin(theta * 2) * (0.68 + stability * 0.16);
    case "fold":
      return (
        Math.sin(theta * 1.5 + Math.sin(theta) * 0.72) *
        (0.7 + stability * 0.18)
      );
    case "none":
      return 0;
  }
}
