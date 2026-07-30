"use client";

import Link from "next/link";
import { useState } from "react";

import { SignalCanvas } from "@/components/signal/SignalCanvas";
import { SIGNAL_PRESETS } from "@/components/signal/signal-presets";
import type { SignalBehavior } from "@/components/signal/signal-types";

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
  const preset = SIGNAL_PRESETS[behavior];

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
        <SignalCanvas behavior={behavior} />
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
              onClick={() => setBehavior(id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </main>
  );
}
