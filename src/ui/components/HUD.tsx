// ========================================
// HUD Component
// Score, combo, speed display
// ========================================

import { memo, useMemo } from 'react';
import type { GameMode, ThemeColors } from '../../types';
import { createStyles } from '../styles';

interface HUDProps {
  score: number;
  highScore: number;
  combo: number;
  tickRate: number;
  baseTickRate: number;
  mode: GameMode;
  theme: ThemeColors;
  showFps?: boolean;
  fps?: number;
}

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'CLASSIC',
  daily: 'DAILY',
  zen: 'ZEN',
};

export const HUD = memo(function HUD({
  score,
  highScore,
  combo,
  tickRate,
  baseTickRate,
  mode,
  theme,
  showFps,
  fps = 0,
}: HUDProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);

  // Calculate speed percentage
  const speedPercent = Math.round(((baseTickRate - tickRate) / baseTickRate) * 100 + 100);

  return (
    <>
      {/* HUD Container */}
      <div style={styles.hud}>
        {/* Left Panel - Score */}
        <div style={{ ...styles.hudPanel, ...styles.panelAccent }}>
          <div style={styles.hudLabel}>Score</div>
          <div style={styles.hudValue}>{score.toLocaleString()}</div>
        </div>

        {/* Center - Mode & Combo */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div
            style={{
              ...styles.hudLabel,
              color: theme.text,
              opacity: 0.6,
              marginBottom: '0.5rem',
            }}
          >
            {MODE_LABELS[mode]}
          </div>

          {/* Combo Badge */}
          <div
            style={{
              ...styles.comboBadge,
              position: 'relative',
              top: 0,
              left: 0,
              transform: 'none',
              ...(combo > 1 ? styles.comboBadgeActive : {}),
            }}
          >
            x{combo} COMBO
          </div>
        </div>

        {/* Right Panel - High Score */}
        <div
          style={{
            ...styles.hudPanel,
            borderLeft: 'none',
            borderRight: `3px solid ${theme.textAccent}`,
            textAlign: 'right',
          }}
        >
          <div style={styles.hudLabel}>Best</div>
          <div style={styles.hudValue}>{highScore.toLocaleString()}</div>
        </div>
      </div>

      {/* Bottom HUD - Speed indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        <div
          style={{
            ...styles.hudLabel,
            marginBottom: 0,
            opacity: 0.6,
          }}
        >
          SPEED
        </div>
        <div
          style={{
            width: '80px',
            height: '4px',
            background: theme.panelBorder,
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${Math.min(100, (speedPercent - 100) / 0.5 + 50)}%`,
              height: '100%',
              background: speedPercent > 130 ? theme.warning : theme.textAccent,
              transition: 'width 0.3s, background 0.3s',
            }}
          />
        </div>
        <div
          style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: '0.7rem',
            color: speedPercent > 130 ? theme.warning : theme.text,
            opacity: 0.8,
            minWidth: '35px',
          }}
        >
          {speedPercent}%
        </div>
      </div>

      {/* Debug FPS */}
      {showFps && (
        <div style={styles.debugOverlay}>
          FPS: {fps} | Tick: {tickRate}ms
        </div>
      )}
    </>
  );
});
