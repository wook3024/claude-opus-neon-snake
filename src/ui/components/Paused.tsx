// ========================================
// Paused Overlay Component
// ========================================

import { memo, useMemo, useState } from 'react';
import type { ThemeColors } from '../../types';
import { createStyles } from '../styles';

interface PausedProps {
  theme: ThemeColors;
  onResume: () => void;
  onMenu: () => void;
}

export const Paused = memo(function Paused({
  theme,
  onResume,
  onMenu,
}: PausedProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  return (
    <div
      style={{
        ...styles.overlay,
        background: 'rgba(0, 0, 0, 0.75)',
      }}
    >
      <h1
        style={{
          ...styles.title,
          fontSize: 'clamp(2rem, 6vw, 3rem)',
        }}
      >
        Paused
      </h1>

      <div
        style={{
          ...styles.subtitle,
          marginBottom: '2rem',
        }}
      >
        SYSTEM HALTED
      </div>

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          style={{
            ...styles.button,
            ...(hoveredButton === 'resume' ? styles.buttonHover : {}),
          }}
          onClick={onResume}
          onMouseEnter={() => setHoveredButton('resume')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Resume
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
          Quit
        </button>
      </div>

      <div style={styles.controlsHint}>
        Press <span style={styles.keyHint}>P</span> or{' '}
        <span style={styles.keyHint}>Esc</span> to resume
      </div>
    </div>
  );
});
