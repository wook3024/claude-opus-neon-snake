// ========================================
// Game Engine - Core Logic Layer
// Completely independent from React
// ========================================

import type {
  Direction,
  EventCallback,
  GameEvent,
  GameMode,
  GamePhase,
  GameState,
  Particle,
  RenderState,
  SnakeSegment,
  Vector2,
} from '../types';
import { DIRECTION_VECTORS, OPPOSITE_DIRECTION } from '../types';
import {
  checkSelfCollision,
  checkWallCollision,
  getNextHeadPosition,
  wrapPosition,
} from './collision';
import { SeededRNG, createDefaultRNG, getDailySeed } from './rng';
import { getFoodScore, isFoodValid, spawnFood } from './spawn';

// ========================================
// Constants
// ========================================

const COMBO_WINDOW_MS = 2500;
const GRACE_PERIOD_TICKS = 3;
const BASE_TICK_RATES: Record<GameMode, number> = {
  classic: 100, // 10 ticks per second
  daily: 100,
  zen: 150, // Slower, more relaxed
};
const MIN_TICK_RATE = 50; // Maximum speed cap
const SPEED_INCREMENT_SCORE = 50; // Score interval for speed increase
const SPEED_INCREMENT_MS = 3; // How much faster per interval

// ========================================
// Game Engine Class
// ========================================

export class GameEngine {
  private state: GameState;
  private rng: SeededRNG;
  private listeners: Set<EventCallback> = new Set();
  private particles: Particle[] = [];
  private poppedTail: SnakeSegment | null = null;
  private shake: number = 0;

  constructor() {
    this.rng = createDefaultRNG();
    this.state = this.createInitialState();
  }

  // ========================================
  // State Management
  // ========================================

  private createInitialState(): GameState {
    return {
      phase: 'boot',
      mode: 'classic',
      score: 0,
      highScore: this.loadHighScore('classic'),
      combo: 0,
      lastEatTime: 0,
      comboWindow: COMBO_WINDOW_MS,
      snake: [],
      direction: 'RIGHT',
      nextDirection: null,
      directionBuffer: [],
      food: null,
      gridWidth: 20,
      gridHeight: 20,
      tickRate: BASE_TICK_RATES.classic,
      baseTickRate: BASE_TICK_RATES.classic,
      tickCount: 0,
      gracePeriodTicks: GRACE_PERIOD_TICKS,
      dailySeed: getDailySeed(),
    };
  }

  private loadHighScore(mode: GameMode): number {
    try {
      const data = localStorage.getItem('neonSnake_v1');
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.highScores?.[mode] ?? 0;
      }
    } catch {
      // Ignore
    }
    return 0;
  }

  private saveHighScore(mode: GameMode, score: number): void {
    try {
      const data = localStorage.getItem('neonSnake_v1');
      const parsed = data ? JSON.parse(data) : { highScores: {} };
      parsed.highScores = parsed.highScores || {};
      parsed.highScores[mode] = Math.max(parsed.highScores[mode] ?? 0, score);
      localStorage.setItem('neonSnake_v1', JSON.stringify(parsed));
    } catch {
      // Ignore
    }
  }

  // ========================================
  // Game Lifecycle
  // ========================================

  setGridSize(width: number, height: number): void {
    this.state.gridWidth = width;
    this.state.gridHeight = height;
  }

  startGame(mode: GameMode): void {
    const previousPhase = this.state.phase;

    // Setup RNG based on mode
    if (mode === 'daily') {
      this.state.dailySeed = getDailySeed();
      this.rng = new SeededRNG(this.state.dailySeed);
    } else {
      this.rng = createDefaultRNG();
    }

    // Reset state
    this.state.mode = mode;
    this.state.score = 0;
    this.state.highScore = this.loadHighScore(mode);
    this.state.combo = 0;
    this.state.lastEatTime = 0;
    this.state.direction = 'RIGHT';
    this.state.nextDirection = null;
    this.state.directionBuffer = [];
    this.state.tickCount = 0;
    this.state.gracePeriodTicks = GRACE_PERIOD_TICKS;
    this.state.baseTickRate = BASE_TICK_RATES[mode];
    this.state.tickRate = this.state.baseTickRate;

    // Initialize snake at center
    const startX = Math.floor(this.state.gridWidth / 2);
    const startY = Math.floor(this.state.gridHeight / 2);

    this.state.snake = [
      { x: startX, y: startY, prevX: startX, prevY: startY },
      { x: startX - 1, y: startY, prevX: startX - 1, prevY: startY },
      { x: startX - 2, y: startY, prevX: startX - 2, prevY: startY },
    ];

    // Spawn first food
    this.state.food = spawnFood(
      this.rng,
      this.state.snake,
      {
        gridWidth: this.state.gridWidth,
        gridHeight: this.state.gridHeight,
      },
      0
    );

    // Clear particles
    this.particles = [];
    this.poppedTail = null;
    this.shake = 0;

    // Transition to playing
    this.state.phase = 'playing';
    this.emit({ type: 'PHASE_CHANGE', from: previousPhase, to: 'playing' });
  }

  goToMenu(): void {
    const previousPhase = this.state.phase;
    this.state.phase = 'menu';
    this.emit({ type: 'PHASE_CHANGE', from: previousPhase, to: 'menu' });
  }

  pause(): void {
    if (this.state.phase === 'playing') {
      const previousPhase = this.state.phase;
      this.state.phase = 'paused';
      this.emit({ type: 'PHASE_CHANGE', from: previousPhase, to: 'paused' });
    }
  }

  resume(): void {
    if (this.state.phase === 'paused') {
      const previousPhase = this.state.phase;
      this.state.phase = 'playing';
      this.emit({ type: 'PHASE_CHANGE', from: previousPhase, to: 'playing' });
    }
  }

  togglePause(): void {
    if (this.state.phase === 'playing') {
      this.pause();
    } else if (this.state.phase === 'paused') {
      this.resume();
    }
  }

  // ========================================
  // Input Handling
  // ========================================

  setDirection(dir: Direction): void {
    if (this.state.phase !== 'playing') return;

    // Get the reference direction (last buffered or current)
    const refDir =
      this.state.directionBuffer.length > 0
        ? this.state.directionBuffer[this.state.directionBuffer.length - 1]
        : this.state.direction;

    // Cannot reverse direction
    if (OPPOSITE_DIRECTION[dir] === refDir) return;

    // Cannot set same direction
    if (dir === refDir) return;

    // Buffer up to 2 inputs
    if (this.state.directionBuffer.length < 2) {
      this.state.directionBuffer.push(dir);
    }
  }

  // ========================================
  // Game Tick (Fixed Timestep)
  // ========================================

  tick(deltaMs: number): void {
    if (this.state.phase !== 'playing') return;

    const now = performance.now();

    // Check combo expiration
    if (
      this.state.combo > 0 &&
      now - this.state.lastEatTime > this.state.comboWindow
    ) {
      this.state.combo = 0;
      this.emit({ type: 'COMBO_BREAK' });
    }

    // Check food expiration
    if (this.state.food && !isFoodValid(this.state.food, now)) {
      this.state.food = spawnFood(
        this.rng,
        this.state.snake,
        {
          gridWidth: this.state.gridWidth,
          gridHeight: this.state.gridHeight,
        },
        this.state.score
      );
    }

    // Process direction buffer
    if (this.state.directionBuffer.length > 0) {
      const nextDir = this.state.directionBuffer.shift()!;
      if (OPPOSITE_DIRECTION[nextDir] !== this.state.direction) {
        this.state.direction = nextDir;
      }
    }

    // Store previous positions for interpolation
    for (const seg of this.state.snake) {
      seg.prevX = seg.x;
      seg.prevY = seg.y;
    }

    // Calculate new head position
    const dirVec = DIRECTION_VECTORS[this.state.direction];
    const head = this.state.snake[0];
    let newHead: Vector2 = getNextHeadPosition(head, dirVec);

    // Zen mode: wrap around instead of wall collision
    if (this.state.mode === 'zen') {
      newHead = wrapPosition(
        newHead,
        this.state.gridWidth,
        this.state.gridHeight
      );
    }

    // Check collisions
    const wallHit = checkWallCollision(
      newHead,
      this.state.gridWidth,
      this.state.gridHeight
    );
    const selfHit = checkSelfCollision(newHead, this.state.snake);

    // Handle collision
    if (wallHit || selfHit) {
      if (
        this.state.gracePeriodTicks > 0 ||
        (this.state.mode === 'zen' && selfHit)
      ) {
        // Grace period: don't die, just don't move
        this.state.gracePeriodTicks--;
        this.emit({ type: 'TICK' });
        return;
      }

      // Game over
      this.gameOver(wallHit ? 'wall' : 'self');
      return;
    }

    // Move snake
    const newSegment: SnakeSegment = {
      x: newHead.x,
      y: newHead.y,
      prevX: head.x,
      prevY: head.y,
    };
    this.state.snake.unshift(newSegment);

    // Check food collision
    if (
      this.state.food &&
      newHead.x === this.state.food.x &&
      newHead.y === this.state.food.y
    ) {
      this.eatFood();
    } else {
      // Remove tail (snake didn't grow)
      this.poppedTail = this.state.snake.pop() ?? null;
    }

    // Decrease grace period
    if (this.state.gracePeriodTicks > 0) {
      this.state.gracePeriodTicks--;
    }

    // Update tick count
    this.state.tickCount++;

    // Decay shake
    this.shake = Math.max(0, this.shake - deltaMs * 0.01);

    // Update particles
    this.updateParticles(deltaMs);

    this.emit({ type: 'TICK' });
  }

  private eatFood(): void {
    if (!this.state.food) return;

    const now = performance.now();
    const foodType = this.state.food.type;

    // Update combo
    if (now - this.state.lastEatTime < this.state.comboWindow) {
      this.state.combo++;
    } else {
      this.state.combo = 1;
    }
    this.state.lastEatTime = now;

    // Calculate score
    const scoreGain = getFoodScore(foodType, this.state.combo);
    this.state.score += scoreGain;

    // Update high score
    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score;
    }

    // Speed food effect
    if (foodType === 'speed') {
      this.state.tickRate = Math.max(
        MIN_TICK_RATE,
        this.state.tickRate - 20
      );
      this.emit({ type: 'SPEED_CHANGE', newTickRate: this.state.tickRate });
    }

    // Slow food effect - temporary (resets after a while)
    if (foodType === 'slow') {
      this.state.tickRate = Math.min(
        this.state.baseTickRate,
        this.state.tickRate + 30
      );
      // Will gradually speed back up
    }

    // Gradual speed increase based on score
    const speedLevel = Math.floor(this.state.score / SPEED_INCREMENT_SCORE);
    const targetTickRate = Math.max(
      MIN_TICK_RATE,
      this.state.baseTickRate - speedLevel * SPEED_INCREMENT_MS
    );

    // Smoothly approach target (don't suddenly jump)
    if (foodType !== 'slow' && this.state.tickRate > targetTickRate) {
      this.state.tickRate = Math.max(targetTickRate, this.state.tickRate - 2);
    }

    // Create particles
    this.createEatParticles(this.state.food.x, this.state.food.y, foodType);
    this.shake = 8;

    // Clear tail pop since we grew
    this.poppedTail = null;

    // Emit event
    this.emit({
      type: 'FOOD_EATEN',
      foodType,
      score: this.state.score,
      combo: this.state.combo,
    });

    // Spawn new food
    this.state.food = spawnFood(
      this.rng,
      this.state.snake,
      {
        gridWidth: this.state.gridWidth,
        gridHeight: this.state.gridHeight,
      },
      this.state.score
    );
  }

  private gameOver(reason: 'wall' | 'self'): void {
    const previousPhase = this.state.phase;
    this.state.phase = 'gameover';

    // Save high score
    this.saveHighScore(this.state.mode, this.state.score);

    // Big shake for game over
    this.shake = 20;

    this.emit({ type: 'COLLISION', reason });
    this.emit({ type: 'PHASE_CHANGE', from: previousPhase, to: 'gameover' });
  }

  // ========================================
  // Particle System
  // ========================================

  private createEatParticles(x: number, y: number, foodType: string): void {
    const colors: Record<string, string> = {
      normal: '#ff00ff',
      special: '#ffd700',
      speed: '#ff4444',
      slow: '#44ff44',
    };
    const color = colors[foodType] || colors.normal;

    // Burst particles
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 2 + Math.random() * 3;

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color,
        size: 0.3 + Math.random() * 0.2,
        type: 'particle',
      });
    }

    // Shockwave
    this.particles.push({
      x,
      y,
      vx: 0,
      vy: 0,
      life: 1,
      maxLife: 1,
      color,
      size: 0,
      type: 'shockwave',
    });
  }

  private updateParticles(deltaMs: number): void {
    const decay = deltaMs / 400;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.type === 'particle') {
        p.x += p.vx * (deltaMs / 16);
        p.y += p.vy * (deltaMs / 16);
        p.vx *= 0.95;
        p.vy *= 0.95;
      } else if (p.type === 'shockwave') {
        p.size += deltaMs * 0.01;
      }

      p.life -= decay;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ========================================
  // Event System
  // ========================================

  on(callback: EventCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  // ========================================
  // State Getters (Read-only snapshots)
  // ========================================

  getState(): Readonly<GameState> {
    return this.state;
  }

  getRenderState(): RenderState {
    return {
      snake: [...this.state.snake],
      poppedTail: this.poppedTail,
      food: this.state.food,
      particles: [...this.particles],
      score: this.state.score,
      combo: this.state.combo,
      shake: this.shake,
    };
  }

  getPhase(): GamePhase {
    return this.state.phase;
  }

  getScore(): number {
    return this.state.score;
  }

  getHighScore(): number {
    return this.state.highScore;
  }

  getCombo(): number {
    return this.state.combo;
  }

  getTickRate(): number {
    return this.state.tickRate;
  }

  getMode(): GameMode {
    return this.state.mode;
  }

  getDailySeed(): string {
    return this.state.dailySeed;
  }
}

// Singleton export
export const gameEngine = new GameEngine();
