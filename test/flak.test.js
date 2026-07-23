import { describe, it, expect } from 'vitest';
import { length } from '../src/core/vec3.js';
import {
  FLAK,
  aimDirection,
  withinRange,
  spawnFlak,
  stepFlak,
  flakExpired,
  flakHitsDragon,
  randomFireInterval,
} from '../src/core/flak.js';
import { makeRng } from '../src/core/world.js';

describe('aimDirection', () => {
  it('is a unit vector pointing at the target', () => {
    const d = aimDirection({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 10 });
    expect(length(d)).toBeCloseTo(1, 12);
    expect(d).toMatchObject({ x: 0, y: 0, z: 1 });
  });
});

describe('withinRange', () => {
  it('true inside range, false outside', () => {
    expect(withinRange({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 100 })).toBe(true);
    expect(withinRange({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 1000 })).toBe(false);
  });
});

describe('spawnFlak', () => {
  it('starts at origin with projectileSpeed toward the target', () => {
    const p = spawnFlak({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 5 });
    expect(p.pos).toEqual({ x: 0, y: 0, z: 0 });
    expect(length(p.vel)).toBeCloseTo(FLAK.projectileSpeed, 6);
    expect(p.vel.z).toBeGreaterThan(0);
    expect(p.life).toBe(FLAK.projectileLife);
  });
});

describe('stepFlak', () => {
  it('moves along vel, decays life, and does not mutate input', () => {
    const p = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 10, y: 0, z: 0 }, life: 4 };
    const snap = JSON.parse(JSON.stringify(p));
    const n = stepFlak(p, 0.1);
    expect(p).toEqual(snap);
    expect(n.pos.x).toBeCloseTo(1, 12);
    expect(n.life).toBeCloseTo(3.9, 12);
  });
  it('expires at zero life', () => {
    expect(flakExpired({ life: 0 })).toBe(true);
    expect(flakExpired({ life: 0.1 })).toBe(false);
  });
});

describe('flakHitsDragon', () => {
  it('hits within radius, misses beyond', () => {
    expect(flakHitsDragon({ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 0 })).toBe(true);
    expect(flakHitsDragon({ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 })).toBe(false);
  });
});

describe('randomFireInterval', () => {
  it('stays within [min,max] and is deterministic per seed', () => {
    const r = makeRng(3);
    for (let i = 0; i < 50; i++) {
      const v = randomFireInterval(r);
      expect(v).toBeGreaterThanOrEqual(FLAK.fireIntervalMin);
      expect(v).toBeLessThanOrEqual(FLAK.fireIntervalMax);
    }
    expect(randomFireInterval(makeRng(9))).toBe(randomFireInterval(makeRng(9)));
  });
});
