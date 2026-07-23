import { describe, it, expect } from 'vitest';
import { clamp, lerp, expDamp, moveTowards } from '../src/core/mathUtils.js';

describe('clamp', () => {
  it('clamps below, above, and within range', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(clamp(5, 0, 10)).toBe(5);
  });
});

describe('lerp', () => {
  it('returns endpoints and midpoint', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });
});

describe('expDamp', () => {
  it('does not move at dt=0', () => {
    expect(expDamp(0, 10, 5, 0)).toBe(0);
  });
  it('stays strictly between current and target for finite dt', () => {
    const v = expDamp(0, 10, 5, 1);
    expect(v).toBeGreaterThan(0);
    expect(v).toBeLessThan(10);
  });
  it('approaches target as dt grows', () => {
    expect(expDamp(0, 10, 5, 100)).toBeCloseTo(10, 5);
  });
});

describe('moveTowards', () => {
  it('snaps to target when within maxDelta', () => {
    expect(moveTowards(0, 10, 100)).toBe(10);
  });
  it('steps by maxDelta when target is far', () => {
    expect(moveTowards(0, 10, 2)).toBe(2);
    expect(moveTowards(10, 0, 3)).toBe(7);
  });
});
