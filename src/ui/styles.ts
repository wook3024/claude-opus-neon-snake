// ========================================
// UI Styles - CSS-in-JS for components
// Premium neon aesthetic with restraint
// ========================================

import type { ThemeColors } from '../types';

export const createStyles = (theme: ThemeColors) => ({
  // ========================================
  // Overlay (Menu, Settings, GameOver)
  // ========================================
  overlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
    opacity: 1,
    transition: 'opacity 0.3s ease',
  },

  overlayHidden: {
    opacity: 0,
    pointerEvents: 'none' as const,
  },

  // ========================================
  // Title
  // ========================================
  title: {
    fontFamily: "'Rajdhani', 'Segoe UI', sans-serif",
    fontSize: 'clamp(2rem, 8vw, 4rem)',
    fontWeight: 700,
    margin: 0,
    color: theme.text,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.3em',
    textShadow: `0 0 20px ${theme.textAccent}40`,
    animation: 'glitch 3s infinite',
  },

  subtitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 'clamp(0.7rem, 2vw, 1rem)',
    color: theme.textAccent,
    letterSpacing: '0.2em',
    marginBottom: '2rem',
    opacity: 0.8,
  },

  // ========================================
  // Buttons
  // ========================================
  button: {
    background: 'transparent',
    border: `2px solid ${theme.textAccent}`,
    color: theme.textAccent,
    padding: '1rem 3rem',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '1.2rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.15em',
    cursor: 'pointer',
    position: 'relative' as const,
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: `0 0 15px ${theme.textAccent}20`,
  },

  buttonHover: {
    background: theme.textAccent,
    color: theme.background,
    boxShadow: `0 0 30px ${theme.textAccent}60`,
    transform: 'scale(1.02)',
  },

  buttonSecondary: {
    padding: '0.7rem 1.5rem',
    fontSize: '0.9rem',
    opacity: 0.8,
  },

  buttonDanger: {
    borderColor: theme.danger,
    color: theme.danger,
  },

  // ========================================
  // Panel
  // ========================================
  panel: {
    background: theme.panel,
    border: `1px solid ${theme.panelBorder}`,
    padding: '1.5rem 2rem',
    backdropFilter: 'blur(12px)',
    position: 'relative' as const,
  },

  panelAccent: {
    borderLeft: `3px solid ${theme.textAccent}`,
  },

  // ========================================
  // HUD
  // ========================================
  hud: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    pointerEvents: 'none' as const,
    zIndex: 50,
  },

  hudPanel: {
    background: theme.panel,
    border: `1px solid ${theme.panelBorder}`,
    padding: '0.75rem 1.25rem',
    backdropFilter: 'blur(8px)',
    minWidth: '120px',
  },

  hudLabel: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 700,
    color: theme.textAccent,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    marginBottom: '0.25rem',
  },

  hudValue: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '1.5rem',
    color: theme.text,
    textShadow: `0 0 10px ${theme.textAccent}40`,
  },

  // ========================================
  // Combo Badge
  // ========================================
  comboBadge: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: theme.warning,
    textShadow: `0 0 15px ${theme.warning}`,
    opacity: 0,
    transition: 'opacity 0.2s, transform 0.15s',
    pointerEvents: 'none' as const,
    zIndex: 60,
  },

  comboBadgeActive: {
    opacity: 1,
    transform: 'translate(-50%, -50%) scale(1.1)',
  },

  // ========================================
  // Settings
  // ========================================
  settingsGroup: {
    marginBottom: '1.5rem',
  },

  settingsLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.85rem',
    color: theme.text,
  },

  slider: {
    width: '100%',
    height: '4px',
    appearance: 'none' as const,
    background: theme.panelBorder,
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer',
  },

  toggle: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.85rem',
    color: theme.text,
  },

  toggleSwitch: {
    width: '40px',
    height: '20px',
    borderRadius: '10px',
    background: theme.panelBorder,
    position: 'relative' as const,
    transition: 'background 0.2s',
  },

  toggleSwitchActive: {
    background: theme.textAccent,
  },

  toggleKnob: {
    position: 'absolute' as const,
    top: '2px',
    left: '2px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: theme.text,
    transition: 'transform 0.2s',
  },

  toggleKnobActive: {
    transform: 'translateX(20px)',
  },

  // ========================================
  // Mode Selection
  // ========================================
  modeSelector: {
    display: 'flex',
    gap: '1rem',
    marginBottom: '2rem',
  },

  modeButton: {
    flex: 1,
    padding: '1rem',
    background: 'transparent',
    border: `1px solid ${theme.panelBorder}`,
    color: theme.text,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.85rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  modeButtonActive: {
    borderColor: theme.textAccent,
    background: `${theme.textAccent}15`,
    color: theme.textAccent,
  },

  // ========================================
  // Controls Hint
  // ========================================
  controlsHint: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${theme.panelBorder}`,
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.75rem',
    color: `${theme.text}80`,
    textAlign: 'center' as const,
    lineHeight: 1.8,
  },

  keyHint: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    margin: '0 0.2rem',
    border: `1px solid ${theme.textAccent}60`,
    borderRadius: '2px',
    color: theme.textAccent,
    fontSize: '0.7rem',
  },

  // ========================================
  // GameOver Score Card
  // ========================================
  scoreCard: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },

  finalScore: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '4rem',
    color: theme.text,
    textShadow: `0 0 30px ${theme.textAccent}`,
    margin: '0.5rem 0',
  },

  newRecord: {
    fontFamily: "'Rajdhani', sans-serif",
    fontSize: '1rem',
    fontWeight: 700,
    color: theme.warning,
    textShadow: `0 0 10px ${theme.warning}`,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.2em',
    animation: 'pulse 1s infinite',
  },

  // ========================================
  // Debug Overlay
  // ========================================
  debugOverlay: {
    position: 'absolute' as const,
    bottom: '0.5rem',
    left: '0.5rem',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: '0.65rem',
    color: `${theme.text}50`,
    pointerEvents: 'none' as const,
    zIndex: 200,
  },
});

// ========================================
// Global Keyframe Animations
// ========================================
export const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@500;700&display=swap');

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Share Tech Mono', monospace;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    user-select: none;
    -webkit-user-select: none;
  }

  @keyframes glitch {
    0%, 5%, 100% {
      text-shadow:
        2px 0 currentColor,
        -2px 0 currentColor;
      transform: translate(0);
    }
    1% {
      text-shadow:
        -2px 0 #ff0055,
        2px 0 #00f3ff;
      transform: translate(1px, -1px);
    }
    2% {
      text-shadow:
        2px 0 #ff0055,
        -2px 0 #00f3ff;
      transform: translate(-1px, 1px);
    }
    3% {
      text-shadow:
        -2px 0 #00f3ff,
        2px 0 #ff0055;
      transform: translate(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.6;
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  /* Slider styling */
  input[type="range"] {
    -webkit-appearance: none;
    appearance: none;
    height: 4px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 2px;
    outline: none;
  }

  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: currentColor;
    cursor: pointer;
    box-shadow: 0 0 10px currentColor;
  }

  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: currentColor;
    cursor: pointer;
    border: none;
    box-shadow: 0 0 10px currentColor;
  }
`;
