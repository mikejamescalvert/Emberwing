import { describe, it, expect } from 'vitest';
import { wingRotations, jawOpen, WING } from '../src/core/dragonAnim.js';

describe('wingRotations — mirror-sign relationship (Known Issue #3)', () => {
  it('the two wings are always opposite-signed (mirrored geometry stays in sync)', () => {
    for (const phase of [0, 0.3, 1, 2.5, Math.PI, -1.2, 42]) {
      const { left, right } = wingRotations(phase, false);
      expect(right).toBeCloseTo(-left, 12);
    }
  });

  it('is flat (both zero) at phase 0 and multiples of PI', () => {
    expect(wingRotations(0, true)).toEqual({ left: 0, right: -0 });
    expect(wingRotations(Math.PI, false).left).toBeCloseTo(0, 12);
  });

  it('amplitude is bounded by the mode amplitude and is larger when flapping', () => {
    const peak = Math.PI / 2; // sin = 1
    expect(Math.abs(wingRotations(peak, false).left)).toBeCloseTo(WING.restAmp, 12);
    expect(Math.abs(wingRotations(peak, true).left)).toBeCloseTo(WING.flapAmp, 12);
    expect(WING.flapAmp).toBeGreaterThan(WING.restAmp);
  });
});

describe('jawOpen', () => {
  it('opens while breathing, closed otherwise', () => {
    expect(jawOpen(true)).toBe(-0.4);
    expect(jawOpen(false)).toBe(0);
  });
});
