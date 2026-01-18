// ========================================
// Main Menu Component
// Mode selection, settings access
// ========================================

import { memo, useCallback, useMemo, useState } from 'react';
import type { GameMode, ThemeColors } from '../../types';
import { createStyles } from '../styles';

interface MenuProps {
  theme: ThemeColors;
  highScores: Record<GameMode, number>;
  dailySeed: string;
  onStart: (mode: GameMode) => void;
  onOpenSettings: () => void;
}

const MODES: { id: GameMode; label: string; description: string }[] = [
  {
    id: 'classic',
    label: 'CLASSIC',
    description: 'Standard gameplay, increasing speed',
  },
  {
    id: 'daily',
    label: 'DAILY',
    description: 'Fixed seed challenge, compete globally',
  },
  {
    id: 'zen',
    label: 'ZEN',
    description: 'Relaxed pace, no wall deaths',
  },
];

export const Menu = memo(function Menu({
  theme,
  highScores,
  dailySeed,
  onStart,
  onOpenSettings,
}: MenuProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleStart = useCallback(() => {
    onStart(selectedMode);
  }, [onStart, selectedMode]);

  return (
    <div style={styles.overlay}>
      {/* Title */}
      <h1 style={styles.title}>Neon Snake</h1>
      <div style={styles.subtitle}>v1.0 // SYSTEM READY</div>

      {/* Mode Selection */}
      <div style={styles.modeSelector}>
        {MODES.map((mode) => (
          <button
            key={mode.id}
            style={{
              ...styles.modeButton,
              ...(selectedMode === mode.id ? styles.modeButtonActive : {}),
            }}
            onClick={() => setSelectedMode(mode.id)}
            onMouseEnter={() => setHoveredButton(`mode-${mode.id}`)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>
              {mode.label}
            </div>
            <div style={{ fontSize: '0.7rem', opacity: 0.7 }}>
              {mode.description}
            </div>
            {mode.id === 'daily' && (
              <div
                style={{
                  fontSize: '0.6rem',
                  opacity: 0.5,
                  marginTop: '0.5rem',
                }}
              >
                Seed: {dailySeed.slice(-8)}
              </div>
            )}
            <div
              style={{
                fontSize: '0.75rem',
                marginTop: '0.5rem',
                color: theme.warning,
              }}
            >
              Best: {highScores[mode.id].toLocaleString()}
            </div>
          </button>
        ))}
      </div>

      {/* Start Button */}
      <button
        style={{
          ...styles.button,
          ...(hoveredButton === 'start' ? styles.buttonHover : {}),
          marginBottom: '1rem',
        }}
        onClick={handleStart}
        onMouseEnter={() => setHoveredButton('start')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        Start Game
      </button>

      {/* Settings Button */}
      <button
        style={{
          ...styles.button,
          ...styles.buttonSecondary,
          ...(hoveredButton === 'settings' ? styles.buttonHover : {}),
        }}
        onClick={onOpenSettings}
        onMouseEnter={() => setHoveredButton('settings')}
        onMouseLeave={() => setHoveredButton(null)}
      >
        Settings
      </button>

      {/* Controls Hint */}
      <div style={styles.controlsHint}>
        <span style={styles.keyHint}>WASD</span> or{' '}
        <span style={styles.keyHint}>Arrows</span> Navigate
        <br />
        <span style={styles.keyHint}>P</span> Pause{' '}
        <span style={styles.keyHint}>M</span> Mute{' '}
        <span style={styles.keyHint}>T</span> Theme
      </div>
    </div>
  );
});
