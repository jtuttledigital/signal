"use client";

import Link from "next/link";
import { useState } from "react";

import { SignalCanvas } from "@/components/signal/SignalCanvas";
import { SIGNAL_ATTRACTORS } from "@/components/signal/signal-attractors";
import { SIGNAL_PRESETS } from "@/components/signal/signal-presets";
import type {
  AttractorIntent,
  OscillatorParameters,
  SignalAttractor,
  SignalBehavior,
} from "@/components/signal/signal-types";

const SYSTEM_BEHAVIORS = [
  "presence",
  "attention",
  "listening",
  "reasoning",
  "responding",
  "completion",
] as const satisfies readonly SignalBehavior[];

const OSCILLATOR_CONTROLS = [
  {
    key: "xFrequency",
    label: "X frequency",
    min: 0.5,
    max: 4,
    step: 0.01,
  },
  {
    key: "yFrequency",
    label: "Y frequency",
    min: 0.5,
    max: 4,
    step: 0.01,
  },
  {
    key: "frequencyRatio",
    label: "Frequency ratio",
    min: 0.5,
    max: 2,
    step: 0.01,
  },
  {
    key: "phaseOffset",
    label: "Phase offset",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "xAmplitude",
    label: "X amplitude",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "yAmplitude",
    label: "Y amplitude",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "harmonic",
    label: "Harmonic amount",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "symmetry",
    label: "Symmetry",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "persistence",
    label: "Persistence",
    min: 0,
    max: 1,
    step: 0.01,
  },
  {
    key: "energy",
    label: "Energy",
    min: 0,
    max: 1,
    step: 0.01,
  },
] as const satisfies readonly {
  key: keyof OscillatorParameters;
  label: string;
  min: number;
  max: number;
  step: number;
}[];

function formatOscillatorValue(
  key: keyof OscillatorParameters,
  value: number,
): string {
  if (key === "phaseOffset") {
    return `${Math.round(value * 360)}°`;
  }

  return value.toFixed(2);
}

export default function SystemPage() {
  const [behavior, setBehavior] = useState<SignalBehavior>("presence");
  const [attractorOverride, setAttractorOverride] =
    useState<AttractorIntent | null>(null);
  const [oscillatorOverride, setOscillatorOverride] =
    useState<OscillatorParameters | null>(null);
  const preset = SIGNAL_PRESETS[behavior];
  const attractorIntent = attractorOverride ?? preset.attractor;
  const oscillatorParameters = oscillatorOverride ?? preset.oscillator;

  const selectBehavior = (nextBehavior: SignalBehavior) => {
    setBehavior(nextBehavior);
    setAttractorOverride(null);
    setOscillatorOverride(null);
  };

  const selectAttractor = (type: SignalAttractor) => {
    setAttractorOverride({
      ...attractorIntent,
      type,
      strength:
        type === "none" ? 0 : Math.max(attractorIntent.strength, 0.55),
      cycle: false,
    });
  };

  const updateAttractorValue = (
    key: "strength" | "stability",
    value: number,
  ) => {
    setAttractorOverride({
      ...attractorIntent,
      [key]: value,
      cycle: false,
    });
  };

  const updateOscillatorValue = (
    key: keyof OscillatorParameters,
    value: number,
  ) => {
    setOscillatorOverride({
      ...oscillatorParameters,
      [key]: value,
    });
  };

  return (
    <main className="system-page">
      <header className="system-header">
        <div>
          <p className="system-eyebrow">SIGNAL / Motion system</p>
          <h1>Behavior review</h1>
          <p>
            A development surface for reviewing semantic motion targets. The
            parameter playground will follow in a later phase.
          </p>
        </div>
        <Link className="system-link" href="/">
          Back to SIGNAL
        </Link>
      </header>

      <section className="system-preview" aria-labelledby="system-behavior">
        <SignalCanvas
          attractorIntent={attractorOverride}
          behavior={behavior}
          oscillatorParameters={oscillatorOverride}
        />
        <div className="system-preview__status" aria-live="polite">
          <span>Active behavior</span>
          <strong id="system-behavior">{preset.label}</strong>
          <p>{preset.description}</p>
        </div>
      </section>

      <div
        className="behavior-selector"
        role="group"
        aria-label="Signal behavior"
      >
        {SYSTEM_BEHAVIORS.map((id) => {
          const option = SIGNAL_PRESETS[id];

          return (
            <button
              key={id}
              type="button"
              aria-pressed={id === behavior}
              onClick={() => selectBehavior(id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <section
        className="oscillator-review"
        aria-labelledby="oscillator-review-title"
      >
        <div className="attractor-review__heading">
          <div>
            <p className="system-eyebrow">Oscilloscope tuning</p>
            <h2 id="oscillator-review-title">XY oscillator</h2>
          </div>
          <button
            type="button"
            disabled={oscillatorOverride === null}
            onClick={() => setOscillatorOverride(null)}
          >
            Reset to {preset.label}
          </button>
        </div>

        <div className="oscillator-controls">
          {OSCILLATOR_CONTROLS.map((control) => (
            <label key={control.key}>
              <span>
                {control.label}
                <output>
                  {formatOscillatorValue(
                    control.key,
                    oscillatorParameters[control.key],
                  )}
                </output>
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={oscillatorParameters[control.key]}
                onChange={(event) =>
                  updateOscillatorValue(
                    control.key,
                    Number(event.target.value),
                  )
                }
              />
            </label>
          ))}
        </div>
      </section>

      <section
        className="attractor-review"
        aria-labelledby="attractor-review-title"
      >
        <div className="attractor-review__heading">
          <div>
            <p className="system-eyebrow">Secondary review</p>
            <h2 id="attractor-review-title">Attractor intent</h2>
          </div>
          <button
            type="button"
            disabled={attractorOverride === null}
            onClick={() => setAttractorOverride(null)}
          >
            Reset to {preset.label}
          </button>
        </div>

        <div className="attractor-controls">
          <label>
            <span>Family</span>
            <select
              value={attractorIntent.type}
              onChange={(event) =>
                selectAttractor(event.target.value as SignalAttractor)
              }
            >
              {SIGNAL_ATTRACTORS.map((type) => (
                <option key={type} value={type}>
                  {type === "figure-eight"
                    ? "Figure eight"
                    : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>
              Strength
              <output>{attractorIntent.strength.toFixed(2)}</output>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={attractorIntent.strength}
              onChange={(event) =>
                updateAttractorValue(
                  "strength",
                  Number(event.target.value),
                )
              }
            />
          </label>

          <label>
            <span>
              Stability
              <output>{attractorIntent.stability.toFixed(2)}</output>
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={attractorIntent.stability}
              onChange={(event) =>
                updateAttractorValue(
                  "stability",
                  Number(event.target.value),
                )
              }
            />
          </label>
        </div>
      </section>
    </main>
  );
}
