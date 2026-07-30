"use client";

import type { FormEvent, KeyboardEvent } from "react";

import { SignalCanvas } from "@/components/signal/SignalCanvas";
import {
  PRIMARY_SIGNAL_BEHAVIORS,
  SIGNAL_PRESETS,
} from "@/components/signal/signal-presets";
import { useSignalController } from "@/hooks/useSignalController";

export default function EnginePreviewPage() {
  const {
    behavior,
    isListeningSettled,
    prompt,
    response,
    responseStatus,
    handleBlur,
    handleFocus,
    handlePromptChange,
    selectBehavior,
    submit,
  } = useSignalController();
  const preset = SIGNAL_PRESETS[behavior];
  const canSubmit = prompt.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <main className="preview">
      <header className="preview__header">
        <p className="preview__eyebrow">SIGNAL / Behavior Events</p>
        <h1>Signal engine preview</h1>
        <p>
          Temporary review surface for interaction-driven and manual motion
          behaviors.
        </p>
      </header>

      <section className="signal-stage" aria-labelledby="active-behavior">
        <SignalCanvas
          behavior={behavior}
          settled={isListeningSettled}
        />
        <div className="signal-stage__status" aria-live="polite">
          <span>Active behavior</span>
          <strong id="active-behavior">{preset.label}</strong>
          <p>{preset.description}</p>
        </div>
      </section>

      <div
        className="behavior-selector"
        role="group"
        aria-label="Manual signal behavior controls"
      >
        {PRIMARY_SIGNAL_BEHAVIORS.map((id) => {
          const option = SIGNAL_PRESETS[id];
          const isActive = id === behavior;

          return (
            <button
              key={id}
              type="button"
              aria-pressed={isActive}
              onClick={() => selectBehavior(id)}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <section
        className="behavior-events"
        aria-labelledby="temporary-composer-title"
      >
        <form className="temporary-composer" onSubmit={handleSubmit}>
          <div className="temporary-composer__heading">
            <h2 id="temporary-composer-title">Temporary prompt composer</h2>
            <p>Local behavior simulation only. No AI model is connected.</p>
          </div>
          <label htmlFor="temporary-prompt">Prompt</label>
          <div className="temporary-composer__controls">
            <textarea
              id="temporary-prompt"
              name="prompt"
              rows={2}
              value={prompt}
              placeholder="Type to evaluate SIGNAL behavior"
              onBlur={handleBlur}
              onChange={(event) => handlePromptChange(event.target.value)}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
            />
            <button type="submit" disabled={!canSubmit}>
              Run simulation
            </button>
          </div>
          <p className="temporary-composer__hint">
            Enter submits. Shift+Enter inserts a newline.
          </p>
        </form>

        <section
          className="temporary-response"
          aria-labelledby="temporary-response-title"
        >
          <h2 id="temporary-response-title">Temporary simulated response</h2>
          <p className="temporary-response__status">{responseStatus}</p>
          <output aria-live="polite">{response || "Awaiting a prompt."}</output>
        </section>
      </section>
    </main>
  );
}
