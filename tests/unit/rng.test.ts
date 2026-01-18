import { describe, it, expect } from 'vitest';
import { SeededRNG, getDailySeed, createDefaultRNG } from '../../src/engine/rng';

describe('SeededRNG', () => {
  describe('determinism', () => {
    it('produces same sequence with same numeric seed', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(12345);

      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('produces same sequence with same string seed', () => {
      const rng1 = new SeededRNG('daily-20240115');
      const rng2 = new SeededRNG('daily-20240115');

      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });

    it('produces different sequences with different seeds', () => {
      const rng1 = new SeededRNG(12345);
      const rng2 = new SeededRNG(54321);

      let same = true;
      for (let i = 0; i < 10; i++) {
        if (rng1.next() !== rng2.next()) {
          same = false;
          break;
        }
      }
      expect(same).toBe(false);
    });
  });

  describe('next()', () => {
    it('returns values between 0 and 1', () => {
      const rng = new SeededRNG(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    it('produces reasonably uniform distribution', () => {
      const rng = new SeededRNG(12345);
      const buckets = [0, 0, 0, 0, 0];
      const samples = 10000;

      for (let i = 0; i < samples; i++) {
        const value = rng.next();
        const bucket = Math.floor(value * 5);
        buckets[Math.min(bucket, 4)]++;
      }

      // Each bucket should have roughly 20% of samples (±5%)
      for (const count of buckets) {
        const percentage = count / samples;
        expect(percentage).toBeGreaterThan(0.15);
        expect(percentage).toBeLessThan(0.25);
      }
    });
  });

  describe('nextInt()', () => {
    it('returns integers within specified range', () => {
      const rng = new SeededRNG(12345);

      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(5, 10);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThanOrEqual(10);
      }
    });

    it('can return both min and max values', () => {
      const rng = new SeededRNG(12345);
      let hasMin = false;
      let hasMax = false;

      for (let i = 0; i < 1000; i++) {
        const value = rng.nextInt(0, 5);
        if (value === 0) hasMin = true;
        if (value === 5) hasMax = true;
      }

      expect(hasMin).toBe(true);
      expect(hasMax).toBe(true);
    });
  });

  describe('nextBool()', () => {
    it('returns boolean values', () => {
      const rng = new SeededRNG(12345);

      for (let i = 0; i < 100; i++) {
        const value = rng.nextBool();
        expect(typeof value).toBe('boolean');
      }
    });

    it('respects probability parameter', () => {
      const rng = new SeededRNG(12345);
      let trueCount = 0;
      const samples = 10000;

      for (let i = 0; i < samples; i++) {
        if (rng.nextBool(0.3)) trueCount++;
      }

      const percentage = trueCount / samples;
      expect(percentage).toBeGreaterThan(0.25);
      expect(percentage).toBeLessThan(0.35);
    });

    it('returns 50/50 with default probability', () => {
      const rng = new SeededRNG(12345);
      let trueCount = 0;
      const samples = 10000;

      for (let i = 0; i < samples; i++) {
        if (rng.nextBool()) trueCount++;
      }

      const percentage = trueCount / samples;
      expect(percentage).toBeGreaterThan(0.45);
      expect(percentage).toBeLessThan(0.55);
    });
  });

  describe('pick()', () => {
    it('returns item from array', () => {
      const rng = new SeededRNG(12345);
      const items = ['a', 'b', 'c', 'd', 'e'];

      for (let i = 0; i < 100; i++) {
        const picked = rng.pick(items);
        expect(items).toContain(picked);
      }
    });

    it('can pick all items over many tries', () => {
      const rng = new SeededRNG(12345);
      const items = ['a', 'b', 'c'];
      const picked = new Set<string>();

      for (let i = 0; i < 100; i++) {
        picked.add(rng.pick(items));
      }

      expect(picked.size).toBe(3);
    });
  });

  describe('clone()', () => {
    it('creates independent copy with same state', () => {
      const rng1 = new SeededRNG(12345);

      // Advance rng1 a bit
      for (let i = 0; i < 10; i++) rng1.next();

      // Clone
      const rng2 = rng1.clone();

      // Both should produce same sequence from here
      for (let i = 0; i < 100; i++) {
        expect(rng1.next()).toBe(rng2.next());
      }
    });
  });

  describe('getSeed()', () => {
    it('returns current seed state', () => {
      const rng = new SeededRNG(12345);
      rng.next();
      rng.next();

      const seed = rng.getSeed();
      const rng2 = new SeededRNG(seed);

      // Both should produce same sequence from here
      for (let i = 0; i < 100; i++) {
        expect(rng.next()).toBe(rng2.next());
      }
    });
  });
});

describe('getDailySeed', () => {
  it('returns consistent seed for same date', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-15');

    expect(getDailySeed(date1)).toBe(getDailySeed(date2));
  });

  it('returns different seeds for different dates', () => {
    const date1 = new Date('2024-01-15');
    const date2 = new Date('2024-01-16');

    expect(getDailySeed(date1)).not.toBe(getDailySeed(date2));
  });

  it('returns seed in expected format', () => {
    const date = new Date('2024-01-15');
    const seed = getDailySeed(date);

    expect(seed).toBe('daily-20240115');
  });
});

describe('createDefaultRNG', () => {
  it('creates RNG instance', () => {
    const rng = createDefaultRNG();
    expect(rng).toBeInstanceOf(SeededRNG);
  });

  it('creates different RNGs when called at different times', async () => {
    const rng1 = createDefaultRNG();
    await new Promise((r) => setTimeout(r, 5));
    const rng2 = createDefaultRNG();

    // Very likely to be different (based on Date.now())
    // We check by comparing first few values
    let same = true;
    for (let i = 0; i < 5; i++) {
      if (rng1.next() !== rng2.next()) {
        same = false;
        break;
      }
    }
    expect(same).toBe(false);
  });
});
