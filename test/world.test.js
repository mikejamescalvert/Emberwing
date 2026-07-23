import { describe, it, expect } from 'vitest';
import { ridgeNoise, groundHeight, makeRng, scatter } from '../src/core/world.js';

describe('ridgeNoise', () => {
  it('is deterministic', () => {
    expect(ridgeNoise(12, 34)).toBe(ridgeNoise(12, 34));
  });
  it('matches the closed-form value at the origin', () => {
    // sin(0)*18 + cos(0)*18 + sin(0)*10 = 18
    expect(ridgeNoise(0, 0)).toBeCloseTo(18, 12);
  });
  it('groundHeight is the same function', () => {
    expect(groundHeight(5, -7)).toBe(ridgeNoise(5, -7));
  });
});

describe('makeRng (seeded)', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(1234);
    const b = makeRng(1234);
    for (let i = 0; i < 10; i++) expect(a()).toBe(b());
  });
  it('produces values in [0, 1)', () => {
    const r = makeRng(99);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('different seeds diverge', () => {
    expect(makeRng(1)()).not.toBe(makeRng(2)());
  });
});

describe('scatter', () => {
  it('produces `count` positions within the centred square', () => {
    const pts = scatter(makeRng(7), 50, 1400);
    expect(pts).toHaveLength(50);
    for (const p of pts) {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(700);
      expect(Math.abs(p.z)).toBeLessThanOrEqual(700);
    }
  });
  it('is reproducible for the same seed', () => {
    expect(scatter(makeRng(7), 5, 100)).toEqual(scatter(makeRng(7), 5, 100));
  });
});
