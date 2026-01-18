// ========================================
// Collision Detection System
// ========================================

import type { SnakeSegment, Vector2 } from '../types';

export interface CollisionResult {
  type: 'none' | 'wall' | 'self' | 'food';
  position?: Vector2;
}

// Check wall collision
export function checkWallCollision(
  pos: Vector2,
  gridWidth: number,
  gridHeight: number
): boolean {
  return pos.x < 0 || pos.x >= gridWidth || pos.y < 0 || pos.y >= gridHeight;
}

// Check self collision (head hitting body)
export function checkSelfCollision(
  head: Vector2,
  body: SnakeSegment[],
  skipFirst: number = 1
): boolean {
  // Skip first N segments (typically just the new head position)
  for (let i = skipFirst; i < body.length; i++) {
    if (body[i].x === head.x && body[i].y === head.y) {
      return true;
    }
  }
  return false;
}

// Check food collision
export function checkFoodCollision(
  head: Vector2,
  food: Vector2 | null
): boolean {
  if (!food) return false;
  return head.x === food.x && head.y === food.y;
}

// Full collision check
export function checkCollision(
  head: Vector2,
  snake: SnakeSegment[],
  food: Vector2 | null,
  gridWidth: number,
  gridHeight: number
): CollisionResult {
  if (checkWallCollision(head, gridWidth, gridHeight)) {
    return { type: 'wall', position: head };
  }

  if (checkSelfCollision(head, snake)) {
    return { type: 'self', position: head };
  }

  if (checkFoodCollision(head, food)) {
    return { type: 'food', position: head };
  }

  return { type: 'none' };
}

// Calculate next head position
export function getNextHeadPosition(
  current: Vector2,
  direction: Vector2
): Vector2 {
  return {
    x: current.x + direction.x,
    y: current.y + direction.y,
  };
}

// Wrap position for zen mode (toroidal)
export function wrapPosition(
  pos: Vector2,
  gridWidth: number,
  gridHeight: number
): Vector2 {
  return {
    x: ((pos.x % gridWidth) + gridWidth) % gridWidth,
    y: ((pos.y % gridHeight) + gridHeight) % gridHeight,
  };
}

// Calculate distance between two points
export function distance(a: Vector2, b: Vector2): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// Manhattan distance (grid distance)
export function manhattanDistance(a: Vector2, b: Vector2): number {
  return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
}
