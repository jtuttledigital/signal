import {
  getActiveAttractor,
  getAttractorActivation,
  sampleAttractorX,
  sampleAttractorY,
} from "@/components/signal/signal-attractors";
import { SIGNAL_PRESETS } from "@/components/signal/signal-presets";
import type {
  AttractorIntent,
  SignalBehavior,
  SignalParameters,
  SignalPointer,
} from "@/components/signal/signal-types";

const PARAMETER_KEYS = [
  "amplitude",
  "frequency",
  "complexity",
  "velocity",
  "persistence",
  "thickness",
  "noise",
  "focus",
  "depth",
] as const satisfies readonly (keyof SignalParameters)[];

const MAX_DPR = 2;
const BACKGROUND = "7, 9, 12";
const SIGNAL_RGB = "114, 230, 255";
const TAU = Math.PI * 2;
const SETTLED_LISTENING_PARAMETERS: SignalParameters = {
  ...SIGNAL_PRESETS.listening.parameters,
  amplitude: 0.31,
  complexity: 0.19,
  velocity: 0.26,
  persistence: 0.87,
};

type MutableParameters = {
  -readonly [Key in keyof SignalParameters]: number;
};

function copyParameters(source: SignalParameters): MutableParameters {
  return {
    amplitude: source.amplitude,
    frequency: source.frequency,
    complexity: source.complexity,
    velocity: source.velocity,
    persistence: source.persistence,
    thickness: source.thickness,
    noise: source.noise,
    focus: source.focus,
    depth: source.depth,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export class SignalEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private current: MutableParameters;
  private target: SignalParameters;
  private transitionMs: number;
  private behavior: SignalBehavior;
  private attractorIntent: AttractorIntent;
  private attractorElapsedSeconds = 0;
  private currentAttractorStrength: number;
  private currentAttractorStability: number;
  private currentAttractorPhase: number;
  private orbitalWeight = 0;
  private figureEightWeight = 0;
  private foldWeight = 0;
  private width = 1;
  private height = 1;
  private dpr = 1;
  private elapsedSeconds = 0;
  private lastTimestamp = 0;
  private frameId: number | null = null;
  private reducedMotion = false;
  private pointerX = 0;
  private pointerY = 0;
  private pointerTarget = 0;
  private pointerStrength = 0;
  private needsOpaqueFrame = true;

  constructor(canvas: HTMLCanvasElement, behavior: SignalBehavior) {
    const context = canvas.getContext("2d", { alpha: false });

    if (!context) {
      throw new Error("SIGNAL requires a Canvas 2D rendering context.");
    }

    const preset = SIGNAL_PRESETS[behavior];
    this.canvas = canvas;
    this.context = context;
    this.current = copyParameters(preset.parameters);
    this.target = preset.parameters;
    this.transitionMs = preset.transitionMs;
    this.behavior = behavior;
    this.attractorIntent = preset.attractor;
    this.currentAttractorStrength = preset.attractor.strength;
    this.currentAttractorStability = preset.attractor.stability;
    this.currentAttractorPhase = preset.attractor.phase;
  }

  setBehavior(behavior: SignalBehavior, settled = false): void {
    const preset = SIGNAL_PRESETS[behavior];
    const isSettledListening = behavior === "listening" && settled;

    if (behavior !== this.behavior) {
      this.behavior = behavior;
      this.attractorElapsedSeconds = 0;
      this.attractorIntent = preset.attractor;
    }

    this.target = isSettledListening
      ? SETTLED_LISTENING_PARAMETERS
      : preset.parameters;
    this.transitionMs = isSettledListening ? 960 : preset.transitionMs;
  }

  setAttractorIntent(intent: AttractorIntent | null): void {
    const nextIntent = intent ?? SIGNAL_PRESETS[this.behavior].attractor;
    this.attractorIntent = {
      type: nextIntent.type,
      strength: clamp(nextIntent.strength, 0, 1),
      stability: clamp(nextIntent.stability, 0, 1),
      phase: clamp(nextIntent.phase, 0, 1),
      cycle: nextIntent.cycle,
    };
    this.attractorElapsedSeconds = 0;
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
    this.pointerTarget = 0;
    this.attractorElapsedSeconds = 0;
    this.needsOpaqueFrame = true;
  }

  setPointer(pointer: SignalPointer): void {
    if (this.reducedMotion) {
      return;
    }

    this.pointerX = clamp(pointer.x, -1, 1);
    this.pointerY = clamp(pointer.y, -1, 1);
    this.pointerTarget = pointer.active ? 1 : 0;
  }

  resize(): void {
    const bounds = this.canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(bounds.width));
    const nextHeight = Math.max(1, Math.round(bounds.height));
    const nextDpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const pixelWidth = Math.round(nextWidth * nextDpr);
    const pixelHeight = Math.round(nextHeight * nextDpr);

    if (
      this.canvas.width === pixelWidth &&
      this.canvas.height === pixelHeight &&
      this.dpr === nextDpr
    ) {
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.dpr = nextDpr;
    this.canvas.width = pixelWidth;
    this.canvas.height = pixelHeight;
    this.context.setTransform(nextDpr, 0, 0, nextDpr, 0, 0);
    this.needsOpaqueFrame = true;
  }

  start(): void {
    if (this.frameId !== null) {
      return;
    }

    this.lastTimestamp = 0;
    this.frameId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    this.lastTimestamp = 0;
  }

  private readonly tick = (timestamp: number): void => {
    const previousTimestamp = this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (previousTimestamp !== 0) {
      const deltaSeconds = Math.min((timestamp - previousTimestamp) / 1_000, 0.05);
      this.update(deltaSeconds);
      this.render();
    }

    this.frameId = requestAnimationFrame(this.tick);
  };

  private update(deltaSeconds: number): void {
    const transitionSeconds = Math.max(this.transitionMs / 1_000, 0.001);
    const interpolation = 1 - Math.exp((-4.6 * deltaSeconds) / transitionSeconds);

    for (const key of PARAMETER_KEYS) {
      this.current[key] += (this.target[key] - this.current[key]) * interpolation;
    }

    const pointerInterpolation = 1 - Math.exp(-deltaSeconds * 7);
    this.pointerStrength +=
      (this.pointerTarget - this.pointerStrength) * pointerInterpolation;

    const activeAttractor = getActiveAttractor(
      this.attractorIntent,
      this.attractorElapsedSeconds,
      this.reducedMotion,
    );
    const attractorActivation = getAttractorActivation(
      this.attractorIntent,
      this.attractorElapsedSeconds,
      this.reducedMotion,
    );
    const attractorInterpolation =
      1 - Math.exp(-deltaSeconds * (this.reducedMotion ? 2.2 : 4.2));
    const targetOrbitalWeight =
      activeAttractor === "orbital" ? attractorActivation : 0;
    const targetFigureEightWeight =
      activeAttractor === "figure-eight" ? attractorActivation : 0;
    const targetFoldWeight =
      activeAttractor === "fold" ? attractorActivation : 0;

    this.orbitalWeight +=
      (targetOrbitalWeight - this.orbitalWeight) * attractorInterpolation;
    this.figureEightWeight +=
      (targetFigureEightWeight - this.figureEightWeight) *
      attractorInterpolation;
    this.foldWeight +=
      (targetFoldWeight - this.foldWeight) * attractorInterpolation;
    this.currentAttractorStrength +=
      (this.attractorIntent.strength - this.currentAttractorStrength) *
      attractorInterpolation;
    this.currentAttractorStability +=
      (this.attractorIntent.stability - this.currentAttractorStability) *
      attractorInterpolation;
    this.currentAttractorPhase +=
      (this.attractorIntent.phase - this.currentAttractorPhase) *
      attractorInterpolation;

    const velocityScale = this.reducedMotion ? 0.12 : 1;
    this.elapsedSeconds +=
      deltaSeconds * (0.12 + this.current.velocity * 1.7) * velocityScale;
    if (!this.reducedMotion || !this.attractorIntent.cycle) {
      this.attractorElapsedSeconds += deltaSeconds;
    }
  }

  private render(): void {
    const { context, width, height, current } = this;

    if (this.needsOpaqueFrame || this.reducedMotion) {
      context.fillStyle = `rgb(${BACKGROUND})`;
      this.needsOpaqueFrame = false;
    } else {
      const fadeAlpha = clamp(0.34 - current.persistence * 0.28, 0.065, 0.28);
      context.fillStyle = `rgba(${BACKGROUND}, ${fadeAlpha})`;
    }

    context.fillRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";

    if (!this.reducedMotion) {
      this.drawField();
    }

    this.drawTrace(0.11, 4.2, 1.03, -0.012);
    this.drawTrace(0.22, 2.1, 0.96, 0.01);
    this.drawTrace(0.92, 0.72, 1, 0);

    if (!this.reducedMotion && current.depth > 0.16) {
      this.drawTrace(0.08 + current.depth * 0.08, 1.2, 0.84, 0.024);
    }
  }

  private drawField(): void {
    const { context, width, height, current } = this;
    const sampleCount = Math.round(clamp(width / 8, 90, 190));
    const centerY = height * 0.46;
    const phase = this.elapsedSeconds;
    const fieldStrength =
      (0.16 + current.depth * 0.54) *
      (0.72 + current.focus * 0.28);
    const fieldBreath = 0.84 + Math.sin(phase * 0.48) * 0.16;

    for (let contour = 3; contour >= 1; contour -= 1) {
      const direction = contour % 2 === 0 ? -1 : 1;
      const spread =
        height *
        (0.018 + contour * 0.013) *
        fieldStrength *
        fieldBreath;
      const alpha = (0.012 + current.depth * 0.012) * (4 - contour);

      context.beginPath();

      for (let index = 0; index <= sampleCount; index += 1) {
        const progress = index / sampleCount;
        const normalizedX = progress * 2 - 1;
        const edgeTaper = Math.pow(Math.sin(progress * Math.PI), 0.8);
        const centerEnvelope = Math.exp(
          -normalizedX * normalizedX * (1.15 + current.focus * 1.8),
        );
        const fieldDrift =
          Math.sin(
            normalizedX * TAU * (0.62 + current.frequency * 0.34) +
              phase * (0.28 + contour * 0.035),
          ) *
          height *
          0.006 *
          current.depth;
        const x = progress * width;
        const y =
          centerY +
          direction *
            spread *
            edgeTaper *
            (0.42 + centerEnvelope * 0.58) +
          fieldDrift;

        if (index === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.strokeStyle = `rgba(${SIGNAL_RGB}, ${alpha})`;
      context.lineWidth =
        (0.7 + contour * 0.48 + current.depth * 0.8) / Math.sqrt(this.dpr);
      context.stroke();
    }
  }

  private drawTrace(
    alpha: number,
    widthScale: number,
    amplitudeScale: number,
    phaseOffset: number,
  ): void {
    const { context, width, height, current } = this;
    const sampleCount = Math.round(clamp(width / 4, 140, 340));
    const centerY = height * 0.46;
    const amplitudeMotionScale = this.reducedMotion ? 0.58 : 1;
    const breath =
      0.9 +
      Math.sin(this.elapsedSeconds * (0.42 + current.velocity * 0.16)) *
        (0.1 - current.complexity * 0.035);
    const amplitude =
      height *
      (0.018 + current.amplitude * 0.17) *
      amplitudeScale *
      amplitudeMotionScale *
      breath;
    const phase = this.elapsedSeconds + phaseOffset * current.depth * 10;
    const frequency = 0.72 + current.frequency * 1.86;
    const focusCenter =
      (current.focus - 0.5) * 0.045 +
      this.pointerX * this.pointerStrength * 0.055;
    const pointerAmount = this.reducedMotion ? 0 : this.pointerStrength;
    const attractorWeight =
      this.orbitalWeight + this.figureEightWeight + this.foldWeight;
    const attractorRadius =
      0.2 + this.currentAttractorStability * 0.07;
    const attractorPhase =
      this.currentAttractorPhase +
      (this.reducedMotion
        ? 0
        : phase * (1 - this.currentAttractorStability) * 0.035);

    context.beginPath();

    for (let index = 0; index <= sampleCount; index += 1) {
      const progress = index / sampleCount;
      const normalizedX = progress * 2 - 1;
      const distanceFromFocus = normalizedX - focusCenter;
      const envelope = Math.exp(
        -distanceFromFocus * distanceFromFocus * (1.5 + current.focus * 3.8),
      );
      const gatheredEnergy =
        1 - current.focus * 0.44 + envelope * current.focus * 0.54;
      const primary = Math.sin(normalizedX * TAU * frequency + phase * 1.1);
      const secondary =
        Math.sin(normalizedX * TAU * (frequency * 2) - phase * 1.1 + 0.72) *
        current.complexity *
        0.24;
      const tertiary =
        Math.sin(normalizedX * TAU * (frequency * 3) + phase * 0.55 - 1.1) *
        current.complexity *
        current.depth *
        0.12;
      const deterministicNoise =
        Math.sin(normalizedX * 91.7 + phase * 2.21) *
        Math.sin(normalizedX * 37.1 - phase * 1.37) *
        current.noise *
        0.1;
      const localAttractorPosition = distanceFromFocus / attractorRadius;
      const localAttractorSquared =
        localAttractorPosition * localAttractorPosition;
      const attractorEnvelope = Math.exp(
        -localAttractorSquared * localAttractorSquared * 1.25,
      );
      const attractorInfluence = clamp(
        attractorWeight *
          this.currentAttractorStrength *
          attractorEnvelope,
        0,
        0.86,
      );
      let attractorX = 0;
      let attractorY = 0;

      if (attractorWeight > 0.001) {
        if (this.orbitalWeight > 0.001) {
          attractorX +=
            sampleAttractorX(
              "orbital",
              localAttractorPosition,
              attractorPhase,
              this.currentAttractorStability,
            ) * this.orbitalWeight;
          attractorY +=
            sampleAttractorY(
              "orbital",
              localAttractorPosition,
              attractorPhase,
              this.currentAttractorStability,
            ) * this.orbitalWeight;
        }

        if (this.figureEightWeight > 0.001) {
          attractorX +=
            sampleAttractorX(
              "figure-eight",
              localAttractorPosition,
              attractorPhase,
              this.currentAttractorStability,
            ) * this.figureEightWeight;
          attractorY +=
            sampleAttractorY(
              "figure-eight",
              localAttractorPosition,
              attractorPhase,
              this.currentAttractorStability,
            ) * this.figureEightWeight;
        }

        if (this.foldWeight > 0.001) {
          attractorX +=
            sampleAttractorX(
              "fold",
              localAttractorPosition,
              attractorPhase,
              this.currentAttractorStability,
            ) * this.foldWeight;
          attractorY +=
            sampleAttractorY(
              "fold",
              localAttractorPosition,
              attractorPhase,
              this.currentAttractorStability,
            ) * this.foldWeight;
        }

        attractorX /= attractorWeight;
        attractorY /= attractorWeight;
      }

      const pointerDistance = normalizedX - this.pointerX;
      const pointerEnvelope = Math.exp(-pointerDistance * pointerDistance * 17);
      const pointerPull =
        this.pointerY * pointerEnvelope * pointerAmount * height * 0.032;
      const edgeTaper = Math.pow(Math.sin(progress * Math.PI), 0.62);
      const baseWave =
        primary * gatheredEnergy +
        secondary +
        tertiary +
        deterministicNoise;
      const convergedWave =
        baseWave * (1 - attractorInfluence * 0.78) +
        attractorY *
          attractorInfluence *
          (0.88 + this.currentAttractorStability * 0.16);
      const wave =
        convergedWave * amplitude * edgeTaper;
      const x =
        progress * width +
        attractorX *
          width *
          (0.035 + this.currentAttractorStability * 0.025) *
          attractorInfluence;
      const y = centerY + wave + pointerPull;

      if (index === 0) {
        context.moveTo(x, y);
      } else {
        context.lineTo(x, y);
      }
    }

    context.strokeStyle = `rgba(${SIGNAL_RGB}, ${alpha})`;
    context.lineWidth =
      (0.55 + current.thickness * 1.7) * widthScale / Math.sqrt(this.dpr);
    context.stroke();
  }
}
