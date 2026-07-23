import { describe, it, expect } from 'vitest';
import { VITALITY, createVitality, damageVitality, stepVitality, isDead } from '../src/core/vitality.js';

describe('createVitality', () => {
  it('starts full', () => {
    expect(createVitality().hp).toBe(VITALITY.max);
  });
});

describe('damageVitality', () => {
  it('lowers hp, resets the regen delay, clamps at 0, and is immutable', () => {
    const v = createVitality();
    const d = damageVitality(v, 30);
    expect(v.hp).toBe(VITALITY.max); // input untouched
    expect(d.hp).toBe(VITALITY.max - 30);
    expect(d.sinceHit).toBe(0);
    expect(damageVitality({ hp: 5, sinceHit: 0 }, 20).hp).toBe(0);
  });
});

describe('stepVitality', () => {
  it('does not regen before the delay elapses', () => {
    const r = stepVitality({ hp: 50, sinceHit: 0 }, 1); // 1s < regenDelay
    expect(r.hp).toBe(50);
    expect(r.sinceHit).toBe(1);
  });
  it('regens after the delay, clamped to max', () => {
    const r = stepVitality({ hp: 50, sinceHit: 3 }, 1);
    expect(r.hp).toBeCloseTo(50 + VITALITY.regenPerSec, 12);
    expect(stepVitality({ hp: 99, sinceHit: 100 }, 10).hp).toBe(VITALITY.max);
  });
});

describe('isDead', () => {
  it('true only at zero hp', () => {
    expect(isDead({ hp: 0 })).toBe(true);
    expect(isDead({ hp: 1 })).toBe(false);
  });
});
