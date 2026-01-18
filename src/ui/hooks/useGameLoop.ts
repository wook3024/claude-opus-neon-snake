// ========================================
// Game Loop Hook
// Fixed timestep accumulator pattern
// ========================================

import { useCallback, useEffect, useRef } from 'react';
import type { GameEngine } from '../../engine';
import type { RenderState } from '../../types';
import type { CanvasRenderer } from '../../render';

interface GameLoopOptions {
  engine: GameEngine;
  renderer: CanvasRenderer | null;
  onRender?: (state: RenderState, alpha: number) => void;
}

export function useGameLoop({ engine, renderer, onRender }: GameLoopOptions) {
  const accumulatorRef = useRef(0);
  const lastTimeRef = useRef(0);
  const rafRef = useRef<number>(0);
  const isFirstFrameRef = useRef(true);

  const loop = useCallback(
    (timestamp: number) => {
      // Sync time on first frame
      if (isFirstFrameRef.current) {
        lastTimeRef.current = timestamp;
        accumulatorRef.current = 0;
        isFirstFrameRef.current = false;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const deltaMs = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Cap delta to prevent spiral of death
      const cappedDelta = Math.min(deltaMs, 250);

      const state = engine.getState();
      const tickRate = state.tickRate;

      // Only run game logic when playing
      if (state.phase === 'playing') {
        accumulatorRef.current += cappedDelta;

        // Fixed timestep updates
        while (accumulatorRef.current >= tickRate) {
          engine.tick(tickRate);
          accumulatorRef.current -= tickRate;
        }
      }

      // Calculate interpolation alpha
      const alpha = accumulatorRef.current / tickRate;

      // Render
      const renderState = engine.getRenderState();

      if (renderer) {
        renderer.render(renderState, alpha, cappedDelta);
      }

      if (onRender) {
        onRender(renderState, alpha);
      }

      rafRef.current = requestAnimationFrame(loop);
    },
    [engine, renderer, onRender]
  );

  const start = useCallback(() => {
    isFirstFrameRef.current = true;
    rafRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const stop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const reset = useCallback(() => {
    accumulatorRef.current = 0;
    isFirstFrameRef.current = true;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { start, stop, reset };
}
