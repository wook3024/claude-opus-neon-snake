// ========================================
// Input Handler Hook
// Keyboard + touch support, direction buffer
// ========================================

import { useCallback, useEffect, useRef } from 'react';
import type { Direction, GamePhase } from '../../types';

interface InputCallbacks {
  onDirection: (dir: Direction) => void;
  onPause: () => void;
  onReset: () => void;
  onMenu: () => void;
  onMute: () => void;
  onThemeCycle: () => void;
  getPhase: () => GamePhase;
}

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  KeyW: 'UP',
  KeyS: 'DOWN',
  KeyA: 'LEFT',
  KeyD: 'RIGHT',
};

export function useInput(callbacks: InputCallbacks) {
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Touch support
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Prevent key repeat
    if (e.repeat) return;

    const { onDirection, onPause, onReset, onMenu, onMute, onThemeCycle, getPhase } =
      callbacksRef.current;

    const phase = getPhase();

    // Global shortcuts
    switch (e.code) {
      case 'KeyM':
        onMute();
        e.preventDefault();
        return;
      case 'KeyT':
        onThemeCycle();
        e.preventDefault();
        return;
    }

    // Phase-specific shortcuts
    if (phase === 'gameover') {
      if (e.code === 'Enter' || e.code === 'Space') {
        onReset();
        e.preventDefault();
      } else if (e.code === 'Escape') {
        onMenu();
        e.preventDefault();
      }
      return;
    }

    if (phase === 'playing' || phase === 'paused') {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        onPause();
        e.preventDefault();
        return;
      }

      if (e.code === 'KeyR') {
        onReset();
        e.preventDefault();
        return;
      }
    }

    if (phase === 'playing') {
      const direction = KEY_TO_DIRECTION[e.code];
      if (direction) {
        onDirection(direction);
        e.preventDefault();
      }
    }

    if (phase === 'menu') {
      if (e.code === 'Enter' || e.code === 'Space') {
        // This should trigger start, but we don't have that callback
        // The menu component handles this directly
        return;
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const { onDirection, getPhase } = callbacksRef.current;

    if (getPhase() !== 'playing') return;
    if (!touchStartRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    const minSwipe = 30;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < minSwipe) {
      touchStartRef.current = null;
      return;
    }

    let direction: Direction;

    if (absDx > absDy) {
      direction = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      direction = dy > 0 ? 'DOWN' : 'UP';
    }

    onDirection(direction);
    touchStartRef.current = null;
    e.preventDefault();
  }, []);

  // Visibility change (auto-pause)
  const handleVisibilityChange = useCallback(() => {
    const { onPause, getPhase } = callbacksRef.current;

    if (document.hidden && getPhase() === 'playing') {
      onPause();
    }
  }, []);

  // Window blur (auto-pause)
  const handleBlur = useCallback(() => {
    const { onPause, getPhase } = callbacksRef.current;

    if (getPhase() === 'playing') {
      onPause();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [handleKeyDown, handleTouchStart, handleTouchEnd, handleVisibilityChange, handleBlur]);
}
