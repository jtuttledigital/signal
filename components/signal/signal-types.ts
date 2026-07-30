export type SignalBehavior =
  | "presence"
  | "attention"
  | "listening"
  | "reasoning"
  | "responding"
  | "completion";

export type SignalAttractor =
  | "none"
  | "orbital"
  | "figure-eight"
  | "fold";

export interface AttractorIntent {
  readonly type: SignalAttractor;
  readonly strength: number;
  readonly stability: number;
  readonly phase: number;
  readonly cycle: boolean;
}

/**
 * Oscillator frequencies are measured in cycles per sampled path. Phase is
 * normalized to one turn; all remaining oscillator values use the 0–1 range.
 */
export interface OscillatorParameters {
  readonly xFrequency: number;
  readonly yFrequency: number;
  readonly frequencyRatio: number;
  readonly phaseOffset: number;
  readonly xAmplitude: number;
  readonly yAmplitude: number;
  readonly harmonic: number;
  readonly symmetry: number;
  readonly persistence: number;
  readonly energy: number;
}

/**
 * Every semantic engine parameter is normalized to the inclusive 0–1 range.
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
  readonly attractor: AttractorIntent;
  readonly oscillator: OscillatorParameters;
  readonly parameters: SignalParameters;
}

export interface SignalPointer {
  readonly x: number;
  readonly y: number;
  readonly active: boolean;
}
