import { describe, it, expect } from 'vitest';
import {
  getEmptyCells,
  spawnFood,
  isFoodValid,
  getFoodScore,
  isOnSnake,
} from '../../src/engine/spawn';
import { SeededRNG } from '../../src/engine/rng';
import type { Food, SnakeSegment } from '../../src/types';

describe('Spawn System', () => {
  describe('getEmptyCells', () => {
    it('returns all cells when nothing is occupied', () => {
      const cells = getEmptyCells(5, 5, []);
      expect(cells.length).toBe(25);
    });

    it('excludes occupied cells', () => {
      const occupied = [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ];
      const cells = getEmptyCells(5, 5, occupied);
      expect(cells.length).toBe(22);
      expect(cells.some((c) => c.x === 0 && c.y === 0)).toBe(false);
      expect(cells.some((c) => c.x === 1 && c.y === 1)).toBe(false);
      expect(cells.some((c) => c.x === 2 && c.y === 2)).toBe(false);
    });

    it('returns empty array when all cells occupied', () => {
      const occupied = [];
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          occupied.push({ x, y });
        }
      }
      const cells = getEmptyCells(3, 3, occupied);
      expect(cells.length).toBe(0);
    });
  });

  describe('spawnFood', () => {
    const snake: SnakeSegment[] = [
      { x: 5, y: 5, prevX: 4, prevY: 5 },
      { x: 4, y: 5, prevX: 3, prevY: 5 },
      { x: 3, y: 5, prevX: 2, prevY: 5 },
    ];

    it('spawns food not on snake', () => {
      const rng = new SeededRNG(12345);
      const food = spawnFood(rng, snake, { gridWidth: 20, gridHeight: 15 });

      expect(food).not.toBeNull();
      expect(snake.some((s) => s.x === food!.x && s.y === food!.y)).toBe(false);
    });

    it('spawns normal food type by default at low scores', () => {
      const rng = new SeededRNG(12345);
      const foods: Food[] = [];

      // Spawn multiple foods at score 0 and check they're mostly normal
      for (let i = 0; i < 20; i++) {
        const food = spawnFood(rng, snake, { gridWidth: 20, gridHeight: 15 }, 0);
        if (food) foods.push(food);
      }

      const normalCount = foods.filter((f) => f.type === 'normal').length;
      expect(normalCount).toBe(20); // All should be normal at score 0
    });

    it('can spawn special food types at higher scores', () => {
      const rng = new SeededRNG(99999);
      const foods: Food[] = [];

      // Spawn many foods at high score
      for (let i = 0; i < 100; i++) {
        const food = spawnFood(rng, snake, { gridWidth: 20, gridHeight: 15 }, 100);
        if (food) foods.push(food);
      }

      const specialCount = foods.filter((f) => f.type !== 'normal').length;
      expect(specialCount).toBeGreaterThan(0);
    });

    it('returns null when grid is full', () => {
      const fullSnake: SnakeSegment[] = [];
      for (let x = 0; x < 3; x++) {
        for (let y = 0; y < 3; y++) {
          fullSnake.push({ x, y, prevX: x, prevY: y });
        }
      }

      const rng = new SeededRNG(12345);
      const food = spawnFood(rng, fullSnake, { gridWidth: 3, gridHeight: 3 });

      expect(food).toBeNull();
    });

    it('produces deterministic results with same seed', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);

      const food1 = spawnFood(rng1, snake, { gridWidth: 20, gridHeight: 15 });
      const food2 = spawnFood(rng2, snake, { gridWidth: 20, gridHeight: 15 });

      expect(food1!.x).toBe(food2!.x);
      expect(food1!.y).toBe(food2!.y);
      expect(food1!.type).toBe(food2!.type);
    });
  });

  describe('isFoodValid', () => {
    it('returns true for normal food (no expiration)', () => {
      const food: Food = {
        x: 5,
        y: 5,
        type: 'normal',
        spawnTime: 1000,
      };
      expect(isFoodValid(food, 5000)).toBe(true);
    });

    it('returns true for special food before expiration', () => {
      const food: Food = {
        x: 5,
        y: 5,
        type: 'special',
        spawnTime: 1000,
        expiresAt: 10000,
      };
      expect(isFoodValid(food, 5000)).toBe(true);
    });

    it('returns false for expired special food', () => {
      const food: Food = {
        x: 5,
        y: 5,
        type: 'special',
        spawnTime: 1000,
        expiresAt: 10000,
      };
      expect(isFoodValid(food, 15000)).toBe(false);
    });
  });

  describe('getFoodScore', () => {
    it('returns base score for normal food with no combo', () => {
      expect(getFoodScore('normal', 0)).toBe(10);
    });

    it('returns higher score for special food', () => {
      expect(getFoodScore('special', 0)).toBe(50);
    });

    it('adds combo bonus', () => {
      expect(getFoodScore('normal', 3)).toBe(10 + 15); // base + 3*5
    });

    it('combines special score with combo', () => {
      expect(getFoodScore('special', 5)).toBe(50 + 25); // 50 + 5*5
    });
  });

  describe('isOnSnake', () => {
    const snake: SnakeSegment[] = [
      { x: 5, y: 5, prevX: 4, prevY: 5 },
      { x: 4, y: 5, prevX: 3, prevY: 5 },
    ];

    it('returns true when position is on snake', () => {
      expect(isOnSnake({ x: 5, y: 5 }, snake)).toBe(true);
      expect(isOnSnake({ x: 4, y: 5 }, snake)).toBe(true);
    });

    it('returns false when position is not on snake', () => {
      expect(isOnSnake({ x: 6, y: 5 }, snake)).toBe(false);
      expect(isOnSnake({ x: 5, y: 6 }, snake)).toBe(false);
    });
  });
});
