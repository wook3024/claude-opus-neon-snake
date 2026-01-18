// ========================================
// Game Settings Hook with localStorage
// ========================================

import { useCallback, useEffect, useState } from 'react';
import type { GameSettings, ThemeName } from '../../types';

const STORAGE_KEY = 'neonSnake_settings_v1';

const DEFAULT_SETTINGS: GameSettings = {
  bloomIntensity: 0.6,
  motionReduce: false,
  theme: 'cyber',
  sfxVolume: 0.5,
  bgmVolume: 0.3,
  sfxEnabled: true,
  bgmEnabled: true,
  showFps: false,
};

function loadSettings(): GameSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function useGameSettings() {
  const [settings, setSettingsState] = useState<GameSettings>(loadSettings);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const setSettings = useCallback((updates: Partial<GameSettings>) => {
    setSettingsState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setBloomIntensity = useCallback((value: number) => {
    setSettings({ bloomIntensity: Math.max(0, Math.min(1, value)) });
  }, [setSettings]);

  const setMotionReduce = useCallback((value: boolean) => {
    setSettings({ motionReduce: value });
  }, [setSettings]);

  const setTheme = useCallback((theme: ThemeName) => {
    setSettings({ theme });
  }, [setSettings]);

  const setSfxVolume = useCallback((value: number) => {
    setSettings({ sfxVolume: Math.max(0, Math.min(1, value)) });
  }, [setSettings]);

  const setBgmVolume = useCallback((value: number) => {
    setSettings({ bgmVolume: Math.max(0, Math.min(1, value)) });
  }, [setSettings]);

  const toggleSfx = useCallback(() => {
    setSettings({ sfxEnabled: !settings.sfxEnabled });
  }, [settings.sfxEnabled, setSettings]);

  const toggleBgm = useCallback(() => {
    setSettings({ bgmEnabled: !settings.bgmEnabled });
  }, [settings.bgmEnabled, setSettings]);

  const toggleFps = useCallback(() => {
    setSettings({ showFps: !settings.showFps });
  }, [settings.showFps, setSettings]);

  const resetSettings = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  const cycleTheme = useCallback(() => {
    const themes: ThemeName[] = ['cyber', 'vaporwave', 'midnight'];
    const currentIndex = themes.indexOf(settings.theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setSettings({ theme: themes[nextIndex] });
  }, [settings.theme, setSettings]);

  return {
    settings,
    setSettings,
    setBloomIntensity,
    setMotionReduce,
    setTheme,
    setSfxVolume,
    setBgmVolume,
    toggleSfx,
    toggleBgm,
    toggleFps,
    resetSettings,
    cycleTheme,
  };
}
