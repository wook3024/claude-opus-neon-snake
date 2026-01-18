// ========================================
// Food Spawn System
// Efficiently spawns food avoiding snake body
// ========================================

import type { Food, FoodType, SnakeSegment, Vector2 } from '../types';
import { SeededRNG } from './rng';

export interface SpawnConfig {
  gridWidth: number;
  gridHeight: number;
  specialChance: number;
  speedChance: number;
  slowChance: number;
  specialDuration: number;
}

const DEFAULT_CONFIG: SpawnConfig = {
  gridWidth: 20,
  gridHeight: 20,
  specialChance: 0.08,
  speedChance: 0.05,
  slowChance: 0.05,
  specialDuration: 8000,
};

// Create a set key from coordinates for O(1) lookup
function coordKey(x: number, y: number): string {
  return `${x},${y}`;
}

// Get all empty cells efficiently
export function getEmptyCells(
  gridWidth: number,
  gridHeight: number,
  occupied: Vector2[]
): Vector2[] {
  const occupiedSet = new Set<string>();

  for (const pos of occupied) {
    occupiedSet.add(coordKey(pos.x, pos.y));
  }

  const emptyCells: Vector2[] = [];

  for (let x = 0; x < gridWidth; x++) {
    for (let y = 0; y < gridHeight; y++) {
      if (!occupiedSet.has(coordKey(x, y))) {
        emptyCells.push({ x, y });
      }
    }
  }

  return emptyCells;
}

// Spawn food at random empty position
export function spawnFood(
  rng: SeededRNG,
  snake: SnakeSegment[],
  config: Partial<SpawnConfig> = {},
  currentScore: number = 0
): Food | null {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const emptyCells = getEmptyCells(cfg.gridWidth, cfg.gridHeight, snake);

  if (emptyCells.length === 0) {
    return null; // No space left (you've basically won!)
  }

  // Pick random empty cell
  const pos = rng.pick(emptyCells);

  // Determine food type
  let type: FoodType = 'normal';
  const roll = rng.next();

  // Special types only after score threshold
  if (currentScore > 30) {
    if (roll < cfg.specialChance) {
      type = 'special';
    } else if (roll < cfg.specialChance + cfg.speedChance) {
      type = 'speed';
    } else if (roll < cfg.specialChance + cfg.speedChance + cfg.slowChance) {
      type = 'slow';
    }
  }

  const now = performance.now();

  return {
    x: pos.x,
    y: pos.y,
    type,
    spawnTime: now,
    expiresAt: type !== 'normal' ? now + cfg.specialDuration : undefined,
  };
}

// Check if food is still valid
export function isFoodValid(food: Food, currentTime: number): boolean {
  if (food.expiresAt && currentTime > food.expiresAt) {
    return false;
  }
  return true;
}

// Get food score value
export function getFoodScore(foodType: FoodType, combo: number): number {
  const baseScores: Record<FoodType, number> = {
    normal: 10,
    special: 50,
    speed: 30,
    slow: 20,
  };

  const base = baseScores[foodType];
  const comboBonus = combo * 5;

  return base + comboBonus;
}

// Check if position is on snake
export function isOnSnake(pos: Vector2, snake: SnakeSegment[]): boolean {
  return snake.some(seg => seg.x === pos.x && seg.y === pos.y);
}
