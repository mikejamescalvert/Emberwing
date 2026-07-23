import { describe, it, expect } from 'vitest';
import {
  COMBAT,
  createSentinel,
  damageSentinel,
  ticksToKill,
  stepBreath,
  isHit,
  spawnParticleVelocity,
  stepParticle,
  particleExpired,
} from '../src/core/combat.js';

describe('sentinel damage & death', () => {
  it('reduces HP and stays alive above zero', () => {
    const s = damageSentinel(createSentinel(), COMBAT.breathDamage);
    expect(s.hp).toBe(COMBAT.sentinelHp - COMBAT.breathDamage);
    expect(s.alive).toBe(true);
  });
  it('dies when HP reaches zero or below', () => {
    let s = createSentinel();
    s = damageSentinel(s); // 30 -> 16
    s = damageSentinel(s); // 16 -> 2
    expect(s.alive).toBe(true);
    s = damageSentinel(s); // 2 -> -12
    expect(s.alive).toBe(false);
    expect(s.hp).toBeLessThanOrEqual(0);
  });
  it('does not mutate the input sentinel', () => {
    const s = createSentinel();
    damageSentinel(s, 10);
    expect(s.hp).toBe(COMBAT.sentinelHp);
  });
  it('ticksToKill matches the prototype feel (~2-3 breath ticks)', () => {
    expect(ticksToKill()).toBe(3); // ceil(30 / 14)
  });
});

describe('breath resource', () => {
  it('drains while breathing', () => {
    const r = stepBreath(100, true, 1, COMBAT);
    expect(r.breath).toBeCloseTo(100 - COMBAT.breathDrainPerSec, 12);
    expect(r.breathing).toBe(true);
  });
  it('regenerates when not breathing, clamped at max', () => {
    expect(stepBreath(50, false, 1).breath).toBeCloseTo(50 + COMBAT.breathRegenPerSec, 12);
    expect(stepBreath(99, false, 10).breath).toBe(COMBAT.breathMax);
  });
  it('cannot go below zero and forces breathing off when empty', () => {
    const r = stepBreath(5, true, 1); // would drain 28
    expect(r.breath).toBe(0);
    expect(r.breathing).toBe(false);
  });
});

describe('hit test', () => {
  it('registers within the hit radius and misses beyond it', () => {
    expect(isHit({ x: 0, y: 0, z: 0 }, { x: 0, y: 3, z: 0 })).toBe(true);
    expect(isHit({ x: 0, y: 0, z: 0 }, { x: 0, y: 5, z: 0 })).toBe(false);
  });
});

describe('fire particles', () => {
  it('spawn velocity follows heading plus a share of dragon velocity', () => {
    const v = spawnParticleVelocity({ x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 10 });
    // (forward + 0)*1.4 + dragonVel*0.3
    expect(v.x).toBeCloseTo(1.4, 12);
    expect(v.z).toBeCloseTo(3, 12);
  });
  it('advances position and decays life, then expires', () => {
    let p = { pos: { x: 0, y: 0, z: 0 }, vel: { x: 1, y: 0, z: 0 }, life: COMBAT.particleLife };
    p = stepParticle(p, 0.05);
    expect(p.pos.x).toBeCloseTo(1 * 0.05 * COMBAT.particleSpeed, 12);
    expect(p.life).toBeLessThan(COMBAT.particleLife);
    expect(particleExpired(p)).toBe(false);
    for (let i = 0; i < 100; i++) p = stepParticle(p, 0.05);
    expect(particleExpired(p)).toBe(true);
  });
});
