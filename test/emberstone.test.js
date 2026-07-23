import { describe, it, expect } from 'vitest';
import { EMBERSTONE, spawnBurst, stepMote, moteExpired, moteCollected } from '../src/core/emberstone.js';
import { makeRng } from '../src/core/world.js';

describe('spawnBurst', () => {
  it('spawns motesPerKill motes at the origin, popping upward', () => {
    const origin = { x: 5, y: 40, z: -3 };
    const motes = spawnBurst(origin, makeRng(1));
    expect(motes).toHaveLength(EMBERSTONE.motesPerKill);
    for (const m of motes) {
      expect(m.pos).toEqual(origin);
      expect(m.vel.y).toBeGreaterThan(0); // initial upward pop
      expect(m.life).toBe(EMBERSTONE.life);
    }
  });
  it('is deterministic for a given seed', () => {
    expect(spawnBurst({ x: 0, y: 0, z: 0 }, makeRng(7))).toEqual(spawnBurst({ x: 0, y: 0, z: 0 }, makeRng(7)));
  });
});

describe('stepMote', () => {
  it('applies gravity, drifts, and decays life without mutating input', () => {
    const m = { pos: { x: 0, y: 10, z: 0 }, vel: { x: 1, y: 0, z: 0 }, life: EMBERSTONE.life };
    const snap = JSON.parse(JSON.stringify(m));
    const n = stepMote(m, 0.1);
    expect(m).toEqual(snap); // input untouched
    expect(n.vel.y).toBeLessThan(0); // gravity pulled it down
    expect(n.pos.x).toBeGreaterThan(0); // drifted along x
    expect(n.life).toBeCloseTo(EMBERSTONE.life - 0.1, 12);
  });
  it('eventually expires', () => {
    let m = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 0, y: 0, z: 0 }, life: 0.2 };
    m = stepMote(m, 0.15);
    expect(moteExpired(m)).toBe(false);
    m = stepMote(m, 0.15);
    expect(moteExpired(m)).toBe(true);
  });
});

describe('moteCollected', () => {
  it('true within the pickup radius, false beyond it', () => {
    expect(moteCollected({ x: 0, y: 0, z: 0 }, { x: 0, y: 4, z: 0 }, 5)).toBe(true);
    expect(moteCollected({ x: 0, y: 0, z: 0 }, { x: 0, y: 6, z: 0 }, 5)).toBe(false);
  });
});
