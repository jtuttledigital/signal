"use client";

import Link from "next/link";
import type { FormEvent, KeyboardEvent } from "react";

import { SignalCanvas } from "@/components/signal/SignalCanvas";
import type { SignalBehavior } from "@/components/signal/signal-types";
import { useSignalController } from "@/hooks/useSignalController";

const PRODUCT_BEHAVIOR_LABELS = {
  presence: "Present",
  attention: "Attentive",
  listening: "Listening",
  reasoning: "Reasoning",
  responding: "Responding",
  completion: "Complete",
} as const satisfies Record<SignalBehavior, string>;

export default function ProductPage() {
  const {
    behavior,
    isListeningSettled,
    prompt,
    response,
    handleBlur,
    handleFocus,
    handlePromptChange,
    submit,
  } = useSignalController();
  const canSubmit = prompt.trim().length > 0;
  const responseCopy =
    response ||
    (behavior === "reasoning"
      ? "Preparing a local simulated response…"
      : "A local simulated response will appear here.");

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
    <main className="product-shell">
      <header className="product-header">
        <h1 className="sr-only">SIGNAL</h1>
        <Link className="wordmark" href="/" aria-label="SIGNAL home">
          SIGNAL
        </Link>
        <Link className="system-link" href="/system">
          System
        </Link>
      </header>

      <section className="product-signal" aria-labelledby="active-behavior">
        <SignalCanvas
          behavior={behavior}
          settled={isListeningSettled}
        />
        <p className="behavior-status" aria-live="polite">
          <span className="behavior-status__indicator" aria-hidden="true" />
          <span id="active-behavior">
            {PRODUCT_BEHAVIOR_LABELS[behavior]}
          </span>
        </p>
      </section>

      <section
        className="response-region"
        aria-labelledby="response-region-title"
      >
        <div className="response-region__heading">
          <h2 id="response-region-title">Response</h2>
          <p>Simulated locally · no AI model connected</p>
        </div>
        <output aria-live="polite" aria-atomic="false">
          {responseCopy}
        </output>
      </section>

      <form
        className="prompt-composer"
        aria-label="Ask SIGNAL"
        onSubmit={handleSubmit}
      >
        <label className="sr-only" htmlFor="signal-prompt">
          Ask SIGNAL anything
        </label>
        <textarea
          id="signal-prompt"
          name="prompt"
          rows={1}
          value={prompt}
          placeholder="Ask SIGNAL anything"
          onBlur={handleBlur}
          onChange={(event) => handlePromptChange(event.target.value)}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
        />
        <button type="submit" disabled={!canSubmit}>
          Send
          <span aria-hidden="true">↗</span>
        </button>
      </form>
      <p className="composer-hint">
        Enter to send · Shift+Enter for a new line
      </p>
    </main>
  );
}
