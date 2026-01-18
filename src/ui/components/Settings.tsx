// ========================================
// Settings Panel Component
// ========================================

import { memo, useCallback, useMemo, useState } from 'react';
import type { GameSettings, ThemeColors, ThemeName } from '../../types';
import { THEMES } from '../../types';
import { createStyles } from '../styles';

interface SettingsProps {
  theme: ThemeColors;
  settings: GameSettings;
  onClose: () => void;
  onUpdate: (updates: Partial<GameSettings>) => void;
}

const THEME_OPTIONS: { id: ThemeName; label: string }[] = [
  { id: 'cyber', label: 'Cyber' },
  { id: 'vaporwave', label: 'Vaporwave' },
  { id: 'midnight', label: 'Midnight' },
];

export const Settings = memo(function Settings({
  theme,
  settings,
  onClose,
  onUpdate,
}: SettingsProps) {
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const handleBloomChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ bloomIntensity: parseFloat(e.target.value) });
    },
    [onUpdate]
  );

  const handleSfxVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ sfxVolume: parseFloat(e.target.value) });
    },
    [onUpdate]
  );

  const handleBgmVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ bgmVolume: parseFloat(e.target.value) });
    },
    [onUpdate]
  );

  const Toggle = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: () => void;
  }) => (
    <div style={styles.toggle} onClick={onChange}>
      <div
        style={{
          ...styles.toggleSwitch,
          ...(value ? styles.toggleSwitchActive : {}),
        }}
      >
        <div
          style={{
            ...styles.toggleKnob,
            ...(value ? styles.toggleKnobActive : {}),
          }}
        />
      </div>
      <span>{label}</span>
    </div>
  );

  return (
    <div style={styles.overlay}>
      <div
        style={{
          ...styles.panel,
          width: 'min(400px, 90vw)',
          animation: 'scaleIn 0.3s ease',
        }}
      >
        <h2
          style={{
            ...styles.title,
            fontSize: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Settings
        </h2>

        {/* Theme Selection */}
        <div style={styles.settingsGroup}>
          <div style={styles.settingsLabel}>Theme</div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  background:
                    settings.theme === t.id
                      ? `${THEMES[t.id].textAccent}20`
                      : 'transparent',
                  border: `1px solid ${
                    settings.theme === t.id
                      ? THEMES[t.id].textAccent
                      : theme.panelBorder
                  }`,
                  color:
                    settings.theme === t.id
                      ? THEMES[t.id].textAccent
                      : theme.text,
                  fontFamily: "'Share Tech Mono', monospace",
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onClick={() => onUpdate({ theme: t.id })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bloom Intensity */}
        <div style={styles.settingsGroup}>
          <div style={styles.settingsLabel}>
            <span>Bloom Intensity</span>
            <span style={{ opacity: 0.7 }}>
              {Math.round(settings.bloomIntensity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.bloomIntensity}
            onChange={handleBloomChange}
            style={{ ...styles.slider, color: theme.textAccent }}
          />
        </div>

        {/* Motion Reduce */}
        <div style={styles.settingsGroup}>
          <Toggle
            label="Reduce Motion"
            value={settings.motionReduce}
            onChange={() => onUpdate({ motionReduce: !settings.motionReduce })}
          />
        </div>

        {/* SFX */}
        <div style={styles.settingsGroup}>
          <Toggle
            label="Sound Effects"
            value={settings.sfxEnabled}
            onChange={() => onUpdate({ sfxEnabled: !settings.sfxEnabled })}
          />
          {settings.sfxEnabled && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={styles.settingsLabel}>
                <span>SFX Volume</span>
                <span style={{ opacity: 0.7 }}>
                  {Math.round(settings.sfxVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={handleSfxVolumeChange}
                style={{ ...styles.slider, color: theme.textAccent }}
              />
            </div>
          )}
        </div>

        {/* BGM */}
        <div style={styles.settingsGroup}>
          <Toggle
            label="Background Music"
            value={settings.bgmEnabled}
            onChange={() => onUpdate({ bgmEnabled: !settings.bgmEnabled })}
          />
          {settings.bgmEnabled && (
            <div style={{ marginTop: '0.5rem' }}>
              <div style={styles.settingsLabel}>
                <span>BGM Volume</span>
                <span style={{ opacity: 0.7 }}>
                  {Math.round(settings.bgmVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.bgmVolume}
                onChange={handleBgmVolumeChange}
                style={{ ...styles.slider, color: theme.textAccent }}
              />
            </div>
          )}
        </div>

        {/* Show FPS */}
        <div style={styles.settingsGroup}>
          <Toggle
            label="Show FPS"
            value={settings.showFps}
            onChange={() => onUpdate({ showFps: !settings.showFps })}
          />
        </div>

        {/* Close Button */}
        <button
          style={{
            ...styles.button,
            width: '100%',
            marginTop: '1rem',
            ...(hoveredButton === 'close' ? styles.buttonHover : {}),
          }}
          onClick={onClose}
          onMouseEnter={() => setHoveredButton('close')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          Close
        </button>
      </div>
    </div>
  );
});
