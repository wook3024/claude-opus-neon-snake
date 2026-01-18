// ========================================
// Core Game Types
// ========================================

export interface Vector2 {
  x: number;
  y: number;
}

export interface SnakeSegment extends Vector2 {
  prevX: number;
  prevY: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export const DIRECTION_VECTORS: Record<Direction, Vector2> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const OPPOSITE_DIRECTION: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
};

// ========================================
// Food Types
// ========================================

export type FoodType = 'normal' | 'special' | 'speed' | 'slow';

export interface Food extends Vector2 {
  type: FoodType;
  spawnTime: number;
  expiresAt?: number;
}

// ========================================
// Game State
// ========================================

export type GamePhase = 'boot' | 'menu' | 'playing' | 'paused' | 'gameover';

export type GameMode = 'classic' | 'daily' | 'zen';

export interface GameState {
  phase: GamePhase;
  mode: GameMode;
  score: number;
  highScore: number;
  combo: number;
  lastEatTime: number;
  comboWindow: number;
  snake: SnakeSegment[];
  direction: Direction;
  nextDirection: Direction | null;
  directionBuffer: Direction[];
  food: Food | null;
  gridWidth: number;
  gridHeight: number;
  tickRate: number;
  baseTickRate: number;
  tickCount: number;
  gracePeriodTicks: number;
  dailySeed: string;
}

// ========================================
// Settings
// ========================================

export interface GameSettings {
  bloomIntensity: number; // 0 ~ 1
  motionReduce: boolean;
  theme: ThemeName;
  sfxVolume: number; // 0 ~ 1
  bgmVolume: number; // 0 ~ 1
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  showFps: boolean;
}

export type ThemeName = 'cyber' | 'vaporwave' | 'midnight';

export interface ThemeColors {
  background: string;
  grid: string;
  gridAccent: string;
  snakeHead: string;
  snakeBody: string;
  snakeGlow: string;
  foodNormal: string;
  foodSpecial: string;
  foodSpeed: string;
  foodSlow: string;
  text: string;
  textAccent: string;
  danger: string;
  warning: string;
  panel: string;
  panelBorder: string;
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  cyber: {
    background: '#020408',
    grid: '#0a1420',
    gridAccent: '#00f3ff15',
    snakeHead: '#ffffff',
    snakeBody: '#00f3ff',
    snakeGlow: '#00f3ff',
    foodNormal: '#ff00ff',
    foodSpecial: '#ffd700',
    foodSpeed: '#ff4444',
    foodSlow: '#44ff44',
    text: '#e0faff',
    textAccent: '#00f3ff',
    danger: '#ff0055',
    warning: '#ffcc00',
    panel: 'rgba(10, 20, 30, 0.85)',
    panelBorder: 'rgba(0, 243, 255, 0.3)',
  },
  vaporwave: {
    background: '#0d0221',
    grid: '#1a0a30',
    gridAccent: '#ff71ce15',
    snakeHead: '#ffffff',
    snakeBody: '#ff71ce',
    snakeGlow: '#ff71ce',
    foodNormal: '#01cdfe',
    foodSpecial: '#fffb96',
    foodSpeed: '#ff6b6b',
    foodSlow: '#05ffa1',
    text: '#f8f8f2',
    textAccent: '#ff71ce',
    danger: '#ff6b6b',
    warning: '#fffb96',
    panel: 'rgba(13, 2, 33, 0.9)',
    panelBorder: 'rgba(255, 113, 206, 0.3)',
  },
  midnight: {
    background: '#000510',
    grid: '#0a0f1a',
    gridAccent: '#4a90d915',
    snakeHead: '#ffffff',
    snakeBody: '#4a90d9',
    snakeGlow: '#4a90d9',
    foodNormal: '#c084fc',
    foodSpecial: '#f59e0b',
    foodSpeed: '#ef4444',
    foodSlow: '#22c55e',
    text: '#e2e8f0',
    textAccent: '#4a90d9',
    danger: '#ef4444',
    warning: '#f59e0b',
    panel: 'rgba(0, 5, 16, 0.9)',
    panelBorder: 'rgba(74, 144, 217, 0.3)',
  },
};

// ========================================
// Storage
// ========================================

export interface StorageData {
  version: number;
  settings: GameSettings;
  highScores: Record<GameMode, number>;
  dailyHistory: DailyRecord[];
}

export interface DailyRecord {
  date: string;
  seed: string;
  score: number;
  completed: boolean;
}

// ========================================
// Missions
// ========================================

export interface Mission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  completed: boolean;
  type: 'score' | 'combo' | 'survive' | 'eat';
}

// ========================================
// Particles
// ========================================

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'particle' | 'shockwave' | 'trail';
}

// ========================================
// Render State (for interpolation)
// ========================================

export interface RenderState {
  snake: SnakeSegment[];
  poppedTail: SnakeSegment | null;
  food: Food | null;
  particles: Particle[];
  score: number;
  combo: number;
  shake: number;
}

// ========================================
// Engine Events
// ========================================

export type GameEvent =
  | { type: 'FOOD_EATEN'; foodType: FoodType; score: number; combo: number }
  | { type: 'COLLISION'; reason: 'wall' | 'self' }
  | { type: 'PHASE_CHANGE'; from: GamePhase; to: GamePhase }
  | { type: 'TICK' }
  | { type: 'COMBO_BREAK' }
  | { type: 'SPEED_CHANGE'; newTickRate: number };

export type EventCallback = (event: GameEvent) => void;
