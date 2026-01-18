// ========================================
// Seeded Random Number Generator
// Uses mulberry32 algorithm for reproducibility
// ========================================

export class SeededRNG {
  private seed: number;

  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      this.seed = this.hashString(seed);
    } else {
      this.seed = seed;
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // mulberry32 algorithm
  next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Random integer in range [min, max] inclusive
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random boolean with probability
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  // Pick random item from array
  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  // Get current seed for saving state
  getSeed(): number {
    return this.seed;
  }

  // Clone with current state
  clone(): SeededRNG {
    return new SeededRNG(this.seed);
  }
}

// Generate daily seed based on date
export function getDailySeed(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `daily-${year}${month}${day}`;
}

// Default RNG for non-seeded use
export function createDefaultRNG(): SeededRNG {
  return new SeededRNG(Date.now());
}
