"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { SignalBehavior } from "@/components/signal/signal-types";

const LISTENING_SETTLE_MS = 720;
const COMPLETION_HOLD_MS = 2_400;
const RESPONSE_STEP_MS = 42;
const SIMULATED_RESPONSE =
  "This is a local simulation. SIGNAL is using one continuous trace to express attention, cognition, response, and resolution without implying that a model is running.";

type PendingTimer = ReturnType<typeof setTimeout>;

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
  const sequenceActiveRef = useRef(false);

  const clearTimers = useCallback(() => {
    for (const timer of timersRef.current) {
      clearTimeout(timer);
    }

    timersRef.current.clear();
  }, []);

  const cancelPending = useCallback(() => {
    runIdRef.current += 1;
    sequenceActiveRef.current = false;
    clearTimers();
    return runIdRef.current;
  }, [clearTimers]);

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
    cancelPending();
    resetSimulationCopy();
    setIsListeningSettled(false);
    setBehavior("attention");
  }, [cancelPending, resetSimulationCopy]);

  const handlePromptChange = useCallback(
    (value: string) => {
      const runId = cancelPending();
      const hasText = value.trim().length > 0;

      setPrompt(value);
      resetSimulationCopy();
      setIsListeningSettled(false);
      setBehavior(hasText ? "listening" : "attention");

      if (hasText) {
        schedule(
          runId,
          () => {
            setIsListeningSettled(true);
          },
          LISTENING_SETTLE_MS,
        );
      }
    },
    [cancelPending, resetSimulationCopy, schedule],
  );

  const handleBlur = useCallback(() => {
    if (sequenceActiveRef.current) {
      return;
    }

    setIsListeningSettled(prompt.trim().length > 0);
    setBehavior(prompt.trim().length > 0 ? "listening" : "presence");
  }, [prompt]);

  const selectBehavior = useCallback(
    (nextBehavior: SignalBehavior) => {
      cancelPending();
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

    const runId = cancelPending();
    const workDuration = getSimulatedWorkDuration(submittedPrompt, runId);
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
        setBehavior("responding");
        setResponseStatus("Temporary simulated response.");

        const streamNextChunk = () => {
          const chunkSize = 2 + ((responseIndex + runId) % 3);
          responseIndex = Math.min(
            responseIndex + chunkSize,
            SIMULATED_RESPONSE.length,
          );
          setResponse(SIMULATED_RESPONSE.slice(0, responseIndex));

          if (responseIndex < SIMULATED_RESPONSE.length) {
            schedule(runId, streamNextChunk, RESPONSE_STEP_MS);
            return;
          }

          setBehavior("completion");
          setResponseStatus("Temporary simulated response complete.");
          schedule(
            runId,
            () => {
              sequenceActiveRef.current = false;
              setBehavior("presence");
            },
            COMPLETION_HOLD_MS,
          );
        };

        streamNextChunk();
      },
      workDuration,
    );
  }, [cancelPending, prompt, schedule]);

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
