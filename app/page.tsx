"use client";

import { useState } from "react";

import { SignalCanvas } from "@/components/signal/SignalCanvas";
import {
  PRIMARY_SIGNAL_BEHAVIORS,
  SIGNAL_PRESETS,
} from "@/components/signal/signal-presets";
import type { SignalBehavior } from "@/components/signal/signal-types";

export default function EnginePreviewPage() {
  const [behavior, setBehavior] = useState<SignalBehavior>("presence");
  const preset = SIGNAL_PRESETS[behavior];

  return (
    <main className="preview">
      <header className="preview__header">
        <p className="preview__eyebrow">SIGNAL / Phase 1</p>
        <h1>Signal engine preview</h1>
        <p>
          Temporary review surface for the five primary motion behaviors.
        </p>
      </header>

      <section className="signal-stage" aria-labelledby="active-behavior">
        <SignalCanvas behavior={behavior} />
        <div className="signal-stage__status" aria-live="polite">
          <span>Active behavior</span>
          <strong id="active-behavior">{preset.label}</strong>
          <p>{preset.description}</p>
        </div>
      </section>

      <div className="behavior-selector" aria-label="Signal behavior">
        {PRIMARY_SIGNAL_BEHAVIORS.map((id) => {
          const option = SIGNAL_PRESETS[id];
          const isActive = id === behavior;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
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
