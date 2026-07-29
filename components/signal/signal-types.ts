export type SignalBehavior =
  | "presence"
  | "attention"
  | "listening"
  | "reasoning"
  | "completion";

/**
 * Every engine parameter is normalized to the inclusive 0–1 range.
 * Pixel and timing values are derived inside the renderer.
 */
export interface SignalParameters {
  readonly amplitude: number;
  readonly frequency: number;
  readonly complexity: number;
  readonly velocity: number;
  readonly persistence: number;
  readonly thickness: number;
  readonly noise: number;
  readonly focus: number;
  readonly depth: number;
}

export interface SignalPreset {
  readonly id: SignalBehavior;
  readonly label: string;
  readonly description: string;
  readonly transitionMs: number;
  readonly parameters: SignalParameters;
}

export interface SignalPointer {
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
}
