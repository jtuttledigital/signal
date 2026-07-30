"use client";

import Link from "next/link";
import { useState } from "react";

import { SignalCanvas } from "@/components/signal/SignalCanvas";
import { SIGNAL_ATTRACTORS } from "@/components/signal/signal-attractors";
import { SIGNAL_PRESETS } from "@/components/signal/signal-presets";
import type {
  AttractorIntent,
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

export default function SystemPage() {
  const [behavior, setBehavior] = useState<SignalBehavior>("presence");
  const [attractorOverride, setAttractorOverride] =
    useState<AttractorIntent | null>(null);
  const preset = SIGNAL_PRESETS[behavior];
  const attractorIntent = attractorOverride ?? preset.attractor;

  const selectBehavior = (nextBehavior: SignalBehavior) => {
    setBehavior(nextBehavior);
    setAttractorOverride(null);
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
