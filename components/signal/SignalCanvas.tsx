"use client";

import { useEffect, useRef } from "react";

import { SignalEngine } from "@/components/signal/signal-engine";
import { SIGNAL_PRESETS } from "@/components/signal/signal-presets";
import type { SignalBehavior } from "@/components/signal/signal-types";

interface SignalCanvasProps {
  behavior: SignalBehavior;
  className?: string;
}

export function SignalCanvas({
  behavior,
  className = "signal-canvas",
}: SignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SignalEngine | null>(null);
  const initialBehaviorRef = useRef(behavior);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const engine = new SignalEngine(canvas, initialBehaviorRef.current);
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    const finePointerQuery = window.matchMedia(
      "(hover: hover) and (pointer: fine)",
    );

    engineRef.current = engine;
    engine.setReducedMotion(reducedMotionQuery.matches);

    const resizeObserver = new ResizeObserver(() => engine.resize());
    const handleReducedMotion = (event: MediaQueryListEvent) => {
      engine.setReducedMotion(event.matches);
    };
    const handlePointerMove = (event: PointerEvent) => {
      if (!finePointerQuery.matches) {
        return;
      }

      const bounds = canvas.getBoundingClientRect();
      engine.setPointer({
        x: ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
        y: ((event.clientY - bounds.top) / bounds.height) * 2 - 1,
        active: true,
      });
    };
    const handlePointerLeave = () => {
      engine.setPointer({ x: 0, y: 0, active: false });
    };
    const handleVisibilityChange = () => {
      if (document.hidden) {
        engine.stop();
      } else {
        engine.start();
      }
    };

    resizeObserver.observe(canvas);
    reducedMotionQuery.addEventListener("change", handleReducedMotion);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    engine.resize();
    if (!document.hidden) {
      engine.start();
    }

    return () => {
      engine.stop();
      resizeObserver.disconnect();
      reducedMotionQuery.removeEventListener("change", handleReducedMotion);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    engineRef.current?.setBehavior(behavior);
  }, [behavior]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={`${SIGNAL_PRESETS[behavior].label} signal: ${SIGNAL_PRESETS[behavior].description}`}
    >
      An animated signal visualization. The active behavior is{" "}
      {SIGNAL_PRESETS[behavior].label}.
    </canvas>
  );
}
