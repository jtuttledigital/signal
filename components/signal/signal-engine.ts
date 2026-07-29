import { SIGNAL_PRESETS } from "@/components/signal/signal-presets";
import type {
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
  }

  setBehavior(behavior: SignalBehavior): void {
    const preset = SIGNAL_PRESETS[behavior];
    this.target = preset.parameters;
    this.transitionMs = preset.transitionMs;
  }

  setReducedMotion(reducedMotion: boolean): void {
    this.reducedMotion = reducedMotion;
    this.pointerTarget = 0;
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

    const velocityScale = this.reducedMotion ? 0.12 : 1;
    this.elapsedSeconds +=
      deltaSeconds * (0.12 + this.current.velocity * 1.7) * velocityScale;
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

    this.drawTrace(0.22, 4.8, 1.04, -0.016);
    this.drawTrace(0.32, 2.4, 0.94, 0.012);
    this.drawTrace(0.92, 0.72, 1, 0);

    if (!this.reducedMotion && current.depth > 0.16) {
      this.drawTrace(0.12 + current.depth * 0.12, 1.35, 0.82, 0.028);
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
    const amplitude =
      height * (0.045 + current.amplitude * 0.2) * amplitudeScale * amplitudeMotionScale;
    const phase = this.elapsedSeconds + phaseOffset * current.depth * 10;
    const frequency = 0.75 + current.frequency * 2.15;
    const focusCenter =
      (current.focus - 0.5) * 0.16 +
      this.pointerX * this.pointerStrength * 0.055;
    const pointerAmount = this.reducedMotion ? 0 : this.pointerStrength;

    context.beginPath();

    for (let index = 0; index <= sampleCount; index += 1) {
      const progress = index / sampleCount;
      const normalizedX = progress * 2 - 1;
      const distanceFromFocus = normalizedX - focusCenter;
      const envelope = Math.exp(
        -distanceFromFocus * distanceFromFocus * (1.5 + current.focus * 3.8),
      );
      const primary = Math.sin(normalizedX * TAU * frequency + phase * 1.1);
      const secondary =
        Math.sin(normalizedX * TAU * (frequency * 2.08) - phase * 1.52 + 0.8) *
        current.complexity *
        0.34;
      const tertiary =
        Math.sin(normalizedX * TAU * (frequency * 3.73) + phase * 0.72 - 1.2) *
        current.complexity *
        current.depth *
        0.2;
      const fold =
        Math.sin(distanceFromFocus * TAU * (4.2 + current.depth * 2.5) - phase * 1.8) *
        envelope *
        current.complexity *
        current.depth *
        0.38;
      const deterministicNoise =
        Math.sin(normalizedX * 91.7 + phase * 2.21) *
        Math.sin(normalizedX * 37.1 - phase * 1.37) *
        current.noise *
        0.16;
      const pointerDistance = normalizedX - this.pointerX;
      const pointerEnvelope = Math.exp(-pointerDistance * pointerDistance * 17);
      const pointerPull =
        this.pointerY * pointerEnvelope * pointerAmount * height * 0.032;
      const edgeTaper = Math.pow(Math.sin(progress * Math.PI), 0.62);
      const wave =
        (primary + secondary + tertiary + fold + deterministicNoise) *
        amplitude *
        edgeTaper;
      const x = progress * width;
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
