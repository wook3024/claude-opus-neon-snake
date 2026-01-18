// ========================================
// Web Audio API Sound System
// Premium synthesized electronic sounds
// ========================================

import type { FoodType } from '../types';

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';

interface ToneConfig {
  frequency: number;
  type: OscillatorType;
  duration: number;
  volume: number;
  attack?: number;
  release?: number;
  detune?: number;
}

export class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private bgmOscillators: OscillatorNode[] = [];
  private bgmPlaying: boolean = false;

  private _sfxVolume: number = 0.5;
  private _bgmVolume: number = 0.3;
  private _sfxEnabled: boolean = true;
  private _bgmEnabled: boolean = true;

  // ========================================
  // Initialization (requires user gesture)
  // ========================================

  async init(): Promise<boolean> {
    if (this.ctx) return true;

    try {
      this.ctx = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);

      // SFX channel
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this._sfxVolume;
      this.sfxGain.connect(this.masterGain);

      // BGM channel
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.value = this._bgmVolume;
      this.bgmGain.connect(this.masterGain);

      // Resume if suspended
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      return true;
    } catch {
      console.warn('Audio initialization failed');
      return false;
    }
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // ========================================
  // Volume Controls
  // ========================================

  get sfxVolume(): number {
    return this._sfxVolume;
  }

  set sfxVolume(value: number) {
    this._sfxVolume = Math.max(0, Math.min(1, value));
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(
        this._sfxEnabled ? this._sfxVolume : 0,
        this.ctx!.currentTime,
        0.05
      );
    }
  }

  get bgmVolume(): number {
    return this._bgmVolume;
  }

  set bgmVolume(value: number) {
    this._bgmVolume = Math.max(0, Math.min(1, value));
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(
        this._bgmEnabled ? this._bgmVolume : 0,
        this.ctx!.currentTime,
        0.05
      );
    }
  }

  get sfxEnabled(): boolean {
    return this._sfxEnabled;
  }

  set sfxEnabled(value: boolean) {
    this._sfxEnabled = value;
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(
        value ? this._sfxVolume : 0,
        this.ctx!.currentTime,
        0.05
      );
    }
  }

  get bgmEnabled(): boolean {
    return this._bgmEnabled;
  }

  set bgmEnabled(value: boolean) {
    this._bgmEnabled = value;
    if (this.bgmGain) {
      this.bgmGain.gain.setTargetAtTime(
        value ? this._bgmVolume : 0,
        this.ctx!.currentTime,
        0.05
      );
    }
  }

  toggleSfx(): boolean {
    this.sfxEnabled = !this._sfxEnabled;
    return this._sfxEnabled;
  }

  toggleBgm(): boolean {
    this.bgmEnabled = !this._bgmEnabled;
    return this._bgmEnabled;
  }

  toggleMute(): boolean {
    const newMuted = this._sfxEnabled || this._bgmEnabled;
    this.sfxEnabled = !newMuted;
    this.bgmEnabled = !newMuted;
    return !newMuted;
  }

  // ========================================
  // Tone Generator
  // ========================================

  private playTone(config: ToneConfig): void {
    if (!this.ctx || !this.sfxGain || !this._sfxEnabled) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = config.type;
      osc.frequency.setValueAtTime(config.frequency, this.ctx.currentTime);

      if (config.detune) {
        osc.detune.setValueAtTime(config.detune, this.ctx.currentTime);
      }

      const attack = config.attack ?? 0.01;
      // release is available for future ADSR improvements
      const _release = config.release ?? config.duration * 0.8;
      void _release;

      // ADSR envelope
      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(
        config.volume,
        this.ctx.currentTime + attack
      );
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.ctx.currentTime + config.duration
      );

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(this.ctx.currentTime);
      osc.stop(this.ctx.currentTime + config.duration + 0.1);
    } catch {
      // Ignore audio errors
    }
  }

  private playChord(tones: ToneConfig[], delayBetween: number = 0): void {
    tones.forEach((tone, i) => {
      setTimeout(() => this.playTone(tone), i * delayBetween);
    });
  }

  // ========================================
  // Game Sound Effects
  // ========================================

  playEat(foodType: FoodType = 'normal'): void {
    if (foodType === 'normal') {
      // Clean, satisfying "pop"
      this.playChord(
        [
          { frequency: 660, type: 'sine', duration: 0.08, volume: 0.4 },
          { frequency: 880, type: 'sine', duration: 0.12, volume: 0.3 },
        ],
        40
      );
    } else if (foodType === 'special') {
      // Sparkling arpeggio
      this.playChord(
        [
          { frequency: 880, type: 'square', duration: 0.1, volume: 0.25 },
          { frequency: 1100, type: 'square', duration: 0.1, volume: 0.2 },
          { frequency: 1320, type: 'sine', duration: 0.2, volume: 0.3 },
        ],
        60
      );
    } else if (foodType === 'speed') {
      // Rising urgency
      this.playChord(
        [
          { frequency: 440, type: 'sawtooth', duration: 0.08, volume: 0.2 },
          { frequency: 660, type: 'sawtooth', duration: 0.08, volume: 0.2 },
          { frequency: 880, type: 'sawtooth', duration: 0.15, volume: 0.25 },
        ],
        50
      );
    } else if (foodType === 'slow') {
      // Descending calm
      this.playChord(
        [
          { frequency: 660, type: 'triangle', duration: 0.15, volume: 0.3 },
          { frequency: 440, type: 'triangle', duration: 0.2, volume: 0.25 },
        ],
        80
      );
    }
  }

  playMove(): void {
    // Very subtle tick (only if motion sounds enabled)
    this.playTone({
      frequency: 80,
      type: 'triangle',
      duration: 0.03,
      volume: 0.08,
    });
  }

  playComboUp(): void {
    // Quick ascending chime
    this.playChord(
      [
        { frequency: 523, type: 'sine', duration: 0.1, volume: 0.2 },
        { frequency: 659, type: 'sine', duration: 0.15, volume: 0.25 },
      ],
      50
    );
  }

  playComboBreak(): void {
    // Subtle "womp" down
    this.playTone({
      frequency: 200,
      type: 'sine',
      duration: 0.15,
      volume: 0.15,
    });
  }

  playGameOver(): void {
    // Dramatic descending sequence
    this.playChord(
      [
        { frequency: 220, type: 'sawtooth', duration: 0.3, volume: 0.3 },
        { frequency: 165, type: 'sawtooth', duration: 0.4, volume: 0.25 },
        { frequency: 110, type: 'sawtooth', duration: 0.6, volume: 0.35 },
      ],
      150
    );

    // Stop BGM
    this.stopBGM();
  }

  playStart(): void {
    // Crisp startup sequence
    this.playChord(
      [
        { frequency: 330, type: 'square', duration: 0.1, volume: 0.2 },
        { frequency: 440, type: 'square', duration: 0.1, volume: 0.2 },
        { frequency: 550, type: 'sine', duration: 0.2, volume: 0.25 },
      ],
      80
    );
  }

  playUIClick(): void {
    this.playTone({
      frequency: 800,
      type: 'sine',
      duration: 0.05,
      volume: 0.15,
    });
  }

  playUIHover(): void {
    this.playTone({
      frequency: 1200,
      type: 'sine',
      duration: 0.02,
      volume: 0.08,
    });
  }

  // ========================================
  // Background Music (Ambient Drone)
  // ========================================

  startBGM(): void {
    if (!this.ctx || !this.bgmGain || this.bgmPlaying) return;

    try {
      // Deep base drone
      const drone1 = this.ctx.createOscillator();
      drone1.type = 'sawtooth';
      drone1.frequency.value = 55;

      // Harmonic
      const drone2 = this.ctx.createOscillator();
      drone2.type = 'sine';
      drone2.frequency.value = 110;

      // LFO for movement
      const lfo = this.ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.08;

      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 5;

      // Filter for warmth
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 300;
      filter.Q.value = 2;

      // Drone gains
      const droneGain1 = this.ctx.createGain();
      droneGain1.gain.value = 0.15;

      const droneGain2 = this.ctx.createGain();
      droneGain2.gain.value = 0.08;

      // Connections
      lfo.connect(lfoGain);
      lfoGain.connect(drone1.detune);

      drone1.connect(filter);
      drone2.connect(filter);

      filter.connect(droneGain1);
      droneGain1.connect(this.bgmGain);

      // Start
      drone1.start();
      drone2.start();
      lfo.start();

      this.bgmOscillators = [drone1, drone2, lfo];
      this.bgmPlaying = true;
    } catch {
      // Ignore
    }
  }

  stopBGM(): void {
    for (const osc of this.bgmOscillators) {
      try {
        osc.stop();
      } catch {
        // Ignore
      }
    }
    this.bgmOscillators = [];
    this.bgmPlaying = false;
  }

  // ========================================
  // Cleanup
  // ========================================

  destroy(): void {
    this.stopBGM();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

// Singleton export
export const soundSystem = new SoundSystem();
