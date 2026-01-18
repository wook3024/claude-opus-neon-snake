import { describe, it, expect } from 'vitest';
import {
  checkWallCollision,
  checkSelfCollision,
  checkFoodCollision,
  checkCollision,
  getNextHeadPosition,
  wrapPosition,
  distance,
  manhattanDistance,
} from '../../src/engine/collision';
import type { SnakeSegment, Vector2 } from '../../src/types';

describe('Collision Detection', () => {
  describe('checkWallCollision', () => {
    const gridWidth = 20;
    const gridHeight = 15;

    it('returns true when hitting left wall', () => {
      expect(checkWallCollision({ x: -1, y: 5 }, gridWidth, gridHeight)).toBe(true);
    });

    it('returns true when hitting right wall', () => {
      expect(checkWallCollision({ x: 20, y: 5 }, gridWidth, gridHeight)).toBe(true);
    });

    it('returns true when hitting top wall', () => {
      expect(checkWallCollision({ x: 5, y: -1 }, gridWidth, gridHeight)).toBe(true);
    });

    it('returns true when hitting bottom wall', () => {
      expect(checkWallCollision({ x: 5, y: 15 }, gridWidth, gridHeight)).toBe(true);
    });

    it('returns false when inside grid', () => {
      expect(checkWallCollision({ x: 10, y: 7 }, gridWidth, gridHeight)).toBe(false);
    });

    it('returns false at grid edges (valid positions)', () => {
      expect(checkWallCollision({ x: 0, y: 0 }, gridWidth, gridHeight)).toBe(false);
      expect(checkWallCollision({ x: 19, y: 14 }, gridWidth, gridHeight)).toBe(false);
    });
  });

  describe('checkSelfCollision', () => {
    const snake: SnakeSegment[] = [
      { x: 5, y: 5, prevX: 4, prevY: 5 },
      { x: 4, y: 5, prevX: 3, prevY: 5 },
      { x: 3, y: 5, prevX: 2, prevY: 5 },
      { x: 2, y: 5, prevX: 1, prevY: 5 },
    ];

    it('returns true when head hits body', () => {
      expect(checkSelfCollision({ x: 3, y: 5 }, snake)).toBe(true);
    });

    it('returns false when head does not hit body', () => {
      expect(checkSelfCollision({ x: 6, y: 5 }, snake)).toBe(false);
    });

    it('skips first N segments when specified', () => {
      expect(checkSelfCollision({ x: 4, y: 5 }, snake, 2)).toBe(false);
    });

    it('returns false for empty body', () => {
      expect(checkSelfCollision({ x: 5, y: 5 }, [])).toBe(false);
    });
  });

  describe('checkFoodCollision', () => {
    const food: Vector2 = { x: 10, y: 10 };

    it('returns true when head is on food', () => {
      expect(checkFoodCollision({ x: 10, y: 10 }, food)).toBe(true);
    });

    it('returns false when head is not on food', () => {
      expect(checkFoodCollision({ x: 10, y: 11 }, food)).toBe(false);
    });

    it('returns false when food is null', () => {
      expect(checkFoodCollision({ x: 10, y: 10 }, null)).toBe(false);
    });
  });

  describe('checkCollision (full check)', () => {
    const snake: SnakeSegment[] = [
      { x: 5, y: 5, prevX: 4, prevY: 5 },
      { x: 4, y: 5, prevX: 3, prevY: 5 },
      { x: 3, y: 5, prevX: 2, prevY: 5 },
    ];
    const food: Vector2 = { x: 10, y: 10 };
    const gridWidth = 20;
    const gridHeight = 15;

    it('detects wall collision first', () => {
      const result = checkCollision({ x: -1, y: 5 }, snake, food, gridWidth, gridHeight);
      expect(result.type).toBe('wall');
    });

    it('detects self collision', () => {
      const result = checkCollision({ x: 3, y: 5 }, snake, food, gridWidth, gridHeight);
      expect(result.type).toBe('self');
    });

    it('detects food collision', () => {
      const result = checkCollision({ x: 10, y: 10 }, snake, food, gridWidth, gridHeight);
      expect(result.type).toBe('food');
    });

    it('returns none when no collision', () => {
      const result = checkCollision({ x: 15, y: 10 }, snake, food, gridWidth, gridHeight);
      expect(result.type).toBe('none');
    });
  });

  describe('getNextHeadPosition', () => {
    it('moves right', () => {
      const result = getNextHeadPosition({ x: 5, y: 5 }, { x: 1, y: 0 });
      expect(result).toEqual({ x: 6, y: 5 });
    });

    it('moves left', () => {
      const result = getNextHeadPosition({ x: 5, y: 5 }, { x: -1, y: 0 });
      expect(result).toEqual({ x: 4, y: 5 });
    });

    it('moves up', () => {
      const result = getNextHeadPosition({ x: 5, y: 5 }, { x: 0, y: -1 });
      expect(result).toEqual({ x: 5, y: 4 });
    });

    it('moves down', () => {
      const result = getNextHeadPosition({ x: 5, y: 5 }, { x: 0, y: 1 });
      expect(result).toEqual({ x: 5, y: 6 });
    });
  });

  describe('wrapPosition', () => {
    const gridWidth = 20;
    const gridHeight = 15;

    it('wraps negative x to right edge', () => {
      const result = wrapPosition({ x: -1, y: 5 }, gridWidth, gridHeight);
      expect(result.x).toBe(19);
    });

    it('wraps x beyond grid to left edge', () => {
      const result = wrapPosition({ x: 20, y: 5 }, gridWidth, gridHeight);
      expect(result.x).toBe(0);
    });

    it('wraps negative y to bottom edge', () => {
      const result = wrapPosition({ x: 5, y: -1 }, gridWidth, gridHeight);
      expect(result.y).toBe(14);
    });

    it('wraps y beyond grid to top edge', () => {
      const result = wrapPosition({ x: 5, y: 15 }, gridWidth, gridHeight);
      expect(result.y).toBe(0);
    });

    it('does not change valid positions', () => {
      const result = wrapPosition({ x: 10, y: 7 }, gridWidth, gridHeight);
      expect(result).toEqual({ x: 10, y: 7 });
    });
  });

  describe('distance calculations', () => {
    it('calculates euclidean distance', () => {
      expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it('calculates manhattan distance', () => {
      expect(manhattanDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
    });
  });
});
