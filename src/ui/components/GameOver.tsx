// ========================================
// Game Over Screen Component
// ========================================

import { memo, useMemo, useState } from 'react';
import type { GameMode, ThemeColors } from '../../types';
import { createStyles } from '../styles';

interface GameOverProps {
  theme: ThemeColors;
  score: number;
  highScore: number;
  isNewRecord: boolean;
  mode: GameMode;
  onRestart: () => void;
  onMenu: () => void;
}

const MODE_LABELS: Record<GameMode, string> = {
  classic: 'CLASSIC',
  daily: 'DAILY CHALLENGE',
  zen: 'ZEN MODE',
};

export const GameOver = memo(function GameOver({
  theme,
  score,
  highScore,
  isNewRecord,
  mode,
  onRestart,
  onMenu,
}: GameOverProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div
      style={{
        ...styles.overlay,
        animation: 'fadeIn 0.5s ease',
      }}
    >
      {/* Fail Title */}
      <h1
        style={{
          ...styles.title,
          color: theme.danger,
          textShadow: `0 0 30px ${theme.danger}`,
          fontSize: 'clamp(2.5rem, 10vw, 5rem)',
        }}
      >
        Game Over
      </h1>

      <div
        style={{
          ...styles.subtitle,
          color: theme.danger,
          opacity: 0.8,
        }}
      >
        SYSTEM CRASHED // {MODE_LABELS[mode]}
      </div>

      {/* Score Card */}
      <div
        style={{
          ...styles.panel,
          ...styles.scoreCard,
          minWidth: '280px',
          animation: 'scaleIn 0.4s ease 0.1s both',
        }}
      >
        <div style={styles.hudLabel}>Final Score</div>
        <div style={styles.finalScore}>{score.toLocaleString()}</div>

        {isNewRecord && <div style={styles.newRecord}>New Record!</div>}

        <div
          style={{
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: `1px solid ${theme.panelBorder}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: '0.85rem',
            }}
          >
            <span style={{ opacity: 0.6 }}>Best Score</span>
            <span style={{ color: theme.textAccent }}>
              {highScore.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          animation: 'fadeIn 0.4s ease 0.2s both',
        }}
      >
        <button
          style={{
            ...styles.button,
            ...(hoveredButton === 'restart' ? styles.buttonHover : {}),
          }}
          onClick={onRestart}
          onMouseEnter={() => setHoveredButton('restart')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Try Again
        </button>

        <button
          style={{
            ...styles.button,
            ...styles.buttonSecondary,
            ...(hoveredButton === 'menu' ? styles.buttonHover : {}),
          }}
          onClick={onMenu}
          onMouseEnter={() => setHoveredButton('menu')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Menu
        </button>
      </div>

      {/* Hint */}
      <div style={styles.controlsHint}>
        Press <span style={styles.keyHint}>Enter</span> to retry or{' '}
        <span style={styles.keyHint}>Esc</span> for menu
      </div>
    </div>
  );
});
