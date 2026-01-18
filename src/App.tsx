// ========================================
// Main App Component
// Orchestrates game engine, renderer, and UI
// ========================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameEngine } from './engine';
import { CanvasRenderer } from './render';
import { soundSystem } from './audio';
import { HUD, Menu, Settings, GameOver, Paused } from './ui/components';
import { useGameSettings, useGameLoop, useInput } from './ui/hooks';
import { globalStyles } from './ui/styles';
import type { GameMode, GamePhase, GameEvent, ThemeColors } from './types';
import { THEMES } from './types';

export function App() {
  // ========================================
  // Refs
  // ========================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<CanvasRenderer | null>(null);

  // ========================================
  // State
  // ========================================
  const { settings, setSettings } = useGameSettings();
  const [phase, setPhase] = useState<GamePhase>('menu');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [tickRate, setTickRate] = useState(100);
  const [baseTickRate, setBaseTickRate] = useState(100);
  const [mode, setMode] = useState<GameMode>('classic');
  const [showSettings, setShowSettings] = useState(false);
  const [fps, setFps] = useState(0);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [dailySeed, setDailySeed] = useState('');

  // High scores from localStorage
  const [highScores, setHighScores] = useState<Record<GameMode, number>>({
    classic: 0,
    daily: 0,
    zen: 0,
  });

  // Theme
  const theme: ThemeColors = useMemo(() => THEMES[settings.theme], [settings.theme]);

  // ========================================
  // Initialize Engine & Renderer
  // ========================================
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create engine
    const engine = new GameEngine();
    engineRef.current = engine;

    // Create renderer
    const renderer = new CanvasRenderer(canvasRef.current);
    rendererRef.current = renderer;

    // Initial resize
    const handleResize = () => {
      const config = renderer.resize(window.innerWidth, window.innerHeight);
      engine.setGridSize(config.gridWidth, config.gridHeight);
    };

    // Debounced resize
    let resizeTimeout: number;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(handleResize, 100);
    };

    handleResize();
    window.addEventListener('resize', debouncedResize);

    // Load high scores
    try {
      const data = localStorage.getItem('neonSnake_v1');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.highScores) {
          setHighScores({
            classic: parsed.highScores.classic ?? 0,
            daily: parsed.highScores.daily ?? 0,
            zen: parsed.highScores.zen ?? 0,
          });
        }
      }
    } catch {
      // Ignore
    }

    // Set initial state
    setDailySeed(engine.getDailySeed());
    engine.goToMenu();
    setPhase('menu');

    // Engine events
    const unsubscribe = engine.on((event: GameEvent) => {
      switch (event.type) {
        case 'FOOD_EATEN':
          setScore(event.score);
          setCombo(event.combo);
          soundSystem.playEat(event.foodType);
          if (event.combo > 1) {
            soundSystem.playComboUp();
          }
          break;

        case 'COMBO_BREAK':
          setCombo(0);
          soundSystem.playComboBreak();
          break;

        case 'COLLISION':
          soundSystem.playGameOver();
          break;

        case 'PHASE_CHANGE':
          setPhase(event.to);
          if (event.to === 'gameover') {
            const state = engine.getState();
            setHighScore(state.highScore);
            setIsNewRecord(state.score === state.highScore && state.score > 0);

            // Update high scores state
            setHighScores((prev) => ({
              ...prev,
              [state.mode]: Math.max(prev[state.mode], state.score),
            }));
          }
          break;

        case 'SPEED_CHANGE':
          setTickRate(event.newTickRate);
          break;
      }
    });

    return () => {
      unsubscribe();
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  // ========================================
  // Update renderer settings
  // ========================================
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.setSettings(settings);
    }

    // Update sound system
    soundSystem.sfxEnabled = settings.sfxEnabled;
    soundSystem.bgmEnabled = settings.bgmEnabled;
    soundSystem.sfxVolume = settings.sfxVolume;
    soundSystem.bgmVolume = settings.bgmVolume;
  }, [settings]);

  // ========================================
  // Game Loop
  // ========================================
  const handleRender = useCallback(() => {
    if (rendererRef.current && settings.showFps) {
      setFps(rendererRef.current.getFps());
    }
  }, [settings.showFps]);

  const { start: startLoop, reset: resetLoop } = useGameLoop({
    engine: engineRef.current!,
    renderer: rendererRef.current,
    onRender: handleRender,
  });

  // Start loop on mount
  useEffect(() => {
    startLoop();
  }, [startLoop]);

  // ========================================
  // Game Actions
  // ========================================
  const handleStart = useCallback(
    async (selectedMode: GameMode) => {
      if (!engineRef.current) return;

      // Initialize audio on user gesture
      await soundSystem.init();
      await soundSystem.resume();

      if (settings.bgmEnabled) {
        soundSystem.startBGM();
      }

      soundSystem.playStart();

      // Start game
      engineRef.current.startGame(selectedMode);
      setMode(selectedMode);
      setScore(0);
      setCombo(0);
      setIsNewRecord(false);

      const state = engineRef.current.getState();
      setTickRate(state.tickRate);
      setBaseTickRate(state.baseTickRate);
      setHighScore(state.highScore);

      resetLoop();
    },
    [settings.bgmEnabled, resetLoop]
  );

  const handleRestart = useCallback(async () => {
    if (!engineRef.current) return;

    await soundSystem.resume();
    soundSystem.playStart();

    if (settings.bgmEnabled && !soundSystem.bgmEnabled) {
      soundSystem.startBGM();
    }

    engineRef.current.startGame(mode);
    setScore(0);
    setCombo(0);
    setIsNewRecord(false);

    const state = engineRef.current.getState();
    setTickRate(state.tickRate);
    setBaseTickRate(state.baseTickRate);

    resetLoop();
  }, [mode, settings.bgmEnabled, resetLoop]);

  const handleMenu = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.goToMenu();
    soundSystem.stopBGM();
    setShowSettings(false);
  }, []);

  const handlePause = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.togglePause();
    soundSystem.playUIClick();
  }, []);

  const handleResume = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.resume();
    soundSystem.playUIClick();
  }, []);

  // ========================================
  // Input Handling
  // ========================================
  useInput({
    onDirection: (dir) => {
      if (engineRef.current) {
        engineRef.current.setDirection(dir);
      }
    },
    onPause: handlePause,
    onReset: handleRestart,
    onMenu: handleMenu,
    onMute: () => {
      const muted = soundSystem.toggleMute();
      setSettings({
        sfxEnabled: !muted,
        bgmEnabled: !muted,
      });
    },
    onThemeCycle: () => {
      const themes: Array<'cyber' | 'vaporwave' | 'midnight'> = [
        'cyber',
        'vaporwave',
        'midnight',
      ];
      const idx = themes.indexOf(settings.theme);
      setSettings({ theme: themes[(idx + 1) % themes.length] });
      soundSystem.playUIClick();
    },
    getPhase: () => engineRef.current?.getPhase() ?? 'menu',
  });

  // ========================================
  // Render
  // ========================================
  return (
    <>
      {/* Inject global styles */}
      <style>{globalStyles}</style>

      {/* Game Canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />

      {/* HUD (visible during gameplay) */}
      {(phase === 'playing' || phase === 'paused') && (
        <HUD
          score={score}
          highScore={highScore}
          combo={combo}
          tickRate={tickRate}
          baseTickRate={baseTickRate}
          mode={mode}
          theme={theme}
          showFps={settings.showFps}
          fps={fps}
        />
      )}

      {/* Menu */}
      {phase === 'menu' && !showSettings && (
        <Menu
          theme={theme}
          highScores={highScores}
          dailySeed={dailySeed}
          onStart={handleStart}
          onOpenSettings={() => setShowSettings(true)}
        />
      )}

      {/* Settings */}
      {showSettings && (
        <Settings
          theme={theme}
          settings={settings}
          onClose={() => setShowSettings(false)}
          onUpdate={setSettings}
        />
      )}

      {/* Paused */}
      {phase === 'paused' && (
        <Paused theme={theme} onResume={handleResume} onMenu={handleMenu} />
      )}

      {/* Game Over */}
      {phase === 'gameover' && (
        <GameOver
          theme={theme}
          score={score}
          highScore={highScore}
          isNewRecord={isNewRecord}
          mode={mode}
          onRestart={handleRestart}
          onMenu={handleMenu}
        />
      )}
    </>
  );
}

export default App;
