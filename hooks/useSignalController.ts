"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  createSignalRuntimeState,
  reduceSignalRuntimeEvent,
} from "@/components/signal/signal-events";
import type {
  SignalInterruptionReason,
  SignalRuntimeEvent,
} from "@/components/signal/signal-events";
import type { SignalBehavior } from "@/components/signal/signal-types";

const LISTENING_SETTLE_MS = 720;
const COMPLETION_HOLD_MS = 2_400;
const RESPONSE_STEP_MS = 42;
const SIMULATED_RESPONSE =
  "This is a local simulation. SIGNAL is using one continuous trace to express attention, cognition, response, and resolution without implying that a model is running.";

type PendingTimer = ReturnType<typeof setTimeout>;

function getRuntimeTimestamp(): number {
  return performance.now();
}

function getSimulatedWorkDuration(prompt: string, runId: number): number {
  let signature = runId * 977;

  for (let index = 0; index < prompt.length; index += 1) {
    signature = (signature * 31 + prompt.charCodeAt(index)) % 2_501;
  }

  return 2_500 + signature;
}

export interface SignalController {
  readonly behavior: SignalBehavior;
  readonly isListeningSettled: boolean;
  readonly prompt: string;
  readonly response: string;
  readonly responseStatus: string;
  readonly handleBlur: () => void;
  readonly handleFocus: () => void;
  readonly handlePromptChange: (value: string) => void;
  readonly selectBehavior: (behavior: SignalBehavior) => void;
  readonly submit: () => void;
}

export function useSignalController(): SignalController {
  const [behavior, setBehavior] = useState<SignalBehavior>("presence");
  const [isListeningSettled, setIsListeningSettled] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [responseStatus, setResponseStatus] = useState(
    "No temporary simulation has run.",
  );
  const timersRef = useRef<Set<PendingTimer>>(new Set());
  const runIdRef = useRef(0);
  const runtimeStateRef = useRef(createSignalRuntimeState());
  const sequenceActiveRef = useRef(false);

  const dispatchRuntimeEvent = useCallback((event: SignalRuntimeEvent) => {
    const transition = reduceSignalRuntimeEvent(runtimeStateRef.current, event);
    runtimeStateRef.current = transition.state;
    return transition.accepted;
  }, []);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }

    timersRef.current.clear();
  }, []);

  const cancelPending = useCallback((reason: SignalInterruptionReason) => {
    const activeRunId = runtimeStateRef.current.activeRunId;

    if (activeRunId !== null) {
      dispatchRuntimeEvent({
        type: "interrupt",
        timestamp: getRuntimeTimestamp(),
        runId: activeRunId,
        reason,
      });
    }

    runIdRef.current += 1;
    sequenceActiveRef.current = false;
    clearTimers();
    return runIdRef.current;
  }, [clearTimers, dispatchRuntimeEvent]);

  const schedule = useCallback(
    (runId: number, callback: () => void, delayMs: number) => {
      const timer = setTimeout(() => {
        timersRef.current.delete(timer);

        if (runId === runIdRef.current) {
          callback();
        }
      }, delayMs);
      timersRef.current.add(timer);
    },
    [],
  );

  const resetSimulationCopy = useCallback(() => {
    setResponse("");
    setResponseStatus("No temporary simulation has run.");
  }, []);

  const handleFocus = useCallback(() => {
    cancelPending("user-input");
    dispatchRuntimeEvent({
      type: "focus",
      timestamp: getRuntimeTimestamp(),
    });
    resetSimulationCopy();
    setIsListeningSettled(false);
    setBehavior("attention");
  }, [cancelPending, dispatchRuntimeEvent, resetSimulationCopy]);

  const handlePromptChange = useCallback(
    (value: string) => {
      const runId = cancelPending("user-input");
      const hasText = value.trim().length > 0;
      const inputDelta = value.length - prompt.length;
      const eventType =
        prompt.length === 0 && value.length > 0
          ? "input-start"
          : "input-update";

      dispatchRuntimeEvent({
        type: eventType,
        timestamp: getRuntimeTimestamp(),
        inputLength: value.length,
        inputDelta,
      });

      setPrompt(value);
      resetSimulationCopy();
      setIsListeningSettled(false);
      setBehavior(hasText ? "listening" : "attention");

      if (hasText) {
        schedule(
          runId,
          () => {
            const accepted = dispatchRuntimeEvent({
              type: "input-pause",
              timestamp: getRuntimeTimestamp(),
              inputLength: value.length,
              pauseDurationMs: LISTENING_SETTLE_MS,
            });

            if (accepted) {
              setIsListeningSettled(true);
            }
          },
          LISTENING_SETTLE_MS,
        );
      }
    },
    [
      cancelPending,
      dispatchRuntimeEvent,
      prompt.length,
      resetSimulationCopy,
      schedule,
    ],
  );

  const handleBlur = useCallback(() => {
    if (sequenceActiveRef.current) {
      return;
    }

    dispatchRuntimeEvent({
      type: "blur",
      timestamp: getRuntimeTimestamp(),
      inputLength: prompt.length,
    });
    setIsListeningSettled(prompt.trim().length > 0);
    setBehavior(prompt.trim().length > 0 ? "listening" : "presence");
  }, [dispatchRuntimeEvent, prompt]);

  const selectBehavior = useCallback(
    (nextBehavior: SignalBehavior) => {
      cancelPending("manual-override");
      setIsListeningSettled(false);
      setBehavior(nextBehavior);
      setResponseStatus("Manual behavior selected for visual QA.");
    },
    [cancelPending],
  );

  const submit = useCallback(() => {
    const submittedPrompt = prompt.trim();

    if (!submittedPrompt) {
      return;
    }

    const runId = cancelPending("new-submission");
    const workDuration = getSimulatedWorkDuration(submittedPrompt, runId);
    const submittedAt = getRuntimeTimestamp();

    const submitted = dispatchRuntimeEvent({
      type: "submit",
      timestamp: submittedAt,
      runId,
      inputLength: submittedPrompt.length,
    });

    if (!submitted) {
      return;
    }

    dispatchRuntimeEvent({
      type: "processing-start",
      timestamp: submittedAt,
      runId,
    });
    sequenceActiveRef.current = true;
    setPrompt("");
    setResponse("");
    setResponseStatus(
      `Local simulated work period (${(workDuration / 1_000).toFixed(1)} seconds). No AI model is running.`,
    );
    setIsListeningSettled(false);
    setBehavior("reasoning");

    schedule(
      runId,
      () => {
        let responseIndex = 0;
        const streamStartedAt = getRuntimeTimestamp();
        const streamAccepted = dispatchRuntimeEvent({
          type: "stream-start",
          timestamp: streamStartedAt,
          runId,
          elapsedMs: streamStartedAt - submittedAt,
        });

        if (!streamAccepted) {
          return;
        }

        setBehavior("responding");
        setResponseStatus("Temporary simulated response.");

        const streamNextChunk = () => {
          const previousResponseIndex = responseIndex;
          const chunkSize = 2 + ((responseIndex + runId) % 3);
          responseIndex = Math.min(
            responseIndex + chunkSize,
            SIMULATED_RESPONSE.length,
          );
          const timestamp = getRuntimeTimestamp();
          const elapsedMs = timestamp - streamStartedAt;
          const characterDelta = responseIndex - previousResponseIndex;
          const updateAccepted = dispatchRuntimeEvent({
            type: "stream-update",
            timestamp,
            runId,
            characterDelta,
            elapsedMs,
            streamRate:
              elapsedMs > 0 ? responseIndex / (elapsedMs / 1_000) : undefined,
          });

          if (!updateAccepted) {
            return;
          }

          setResponse(SIMULATED_RESPONSE.slice(0, responseIndex));

          if (responseIndex < SIMULATED_RESPONSE.length) {
            schedule(runId, streamNextChunk, RESPONSE_STEP_MS);
            return;
          }

          const completedAt = getRuntimeTimestamp();
          const completionAccepted = dispatchRuntimeEvent({
            type: "stream-complete",
            timestamp: completedAt,
            runId,
            elapsedMs: completedAt - streamStartedAt,
          });

          if (!completionAccepted) {
            return;
          }

          setBehavior("completion");
          setResponseStatus("Temporary simulated response complete.");
          schedule(
            runId,
            () => {
              const presenceAccepted = dispatchRuntimeEvent({
                type: "presence",
                timestamp: getRuntimeTimestamp(),
              });

              if (presenceAccepted) {
                sequenceActiveRef.current = false;
                setBehavior("presence");
              }
            },
            COMPLETION_HOLD_MS,
          );
        };

        streamNextChunk();
      },
      workDuration,
    );
  }, [cancelPending, dispatchRuntimeEvent, prompt, schedule]);

  useEffect(() => {
    return () => {
      runIdRef.current += 1;
      clearTimers();
    };
  }, [clearTimers]);

  return {
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
  };
}
