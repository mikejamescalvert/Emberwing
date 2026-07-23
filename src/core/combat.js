// Pure combat/resource logic — no THREE, no DOM.
// Covers sentinel HP/damage/death, the breath resource (drain while breathing,
// regen otherwise), fire-particle motion/decay, and hit tests.

import { distance, add, scale } from './vec3.js';

export const COMBAT = {
  sentinelHp: 30,
  breathDamage: 14,
  breathMax: 100,
  breathDrainPerSec: 28,
  breathRegenPerSec: 12,
  hitRadius: 4,
  respawnDelayMs: 3000,
  particleLife: 0.9,
  particleSpeed: 20, // position advance multiplier
  particleFade: 1.4, // life decay per second
};

/** Fresh sentinel enemy. */
export function createSentinel(overrides = {}) {
  return { alive: true, hp: COMBAT.sentinelHp, ...overrides };
}

/** Apply breath damage; returns a NEW sentinel with updated hp/alive. */
export function damageSentinel(sentinel, amount = COMBAT.breathDamage) {
  const hp = sentinel.hp - amount;
  return { ...sentinel, hp, alive: hp > 0 };
}

/** Breath ticks (hits) needed to kill from `hp`. */
export function ticksToKill(hp = COMBAT.sentinelHp, dmg = COMBAT.breathDamage) {
  return Math.ceil(hp / dmg);
}

/**
 * Step the breath resource by dt seconds.
 * Drains while breathing (and non-empty), regens otherwise, clamped to [0, max].
 * @returns {{breath:number, breathing:boolean}} breathing is forced false when empty.
 */
export function stepBreath(breath, breathing, dt, cfg = COMBAT) {
  if (breathing && breath > 0) {
    const next = Math.max(0, breath - dt * cfg.breathDrainPerSec);
    return { breath: next, breathing: next > 0 };
  }
  if (!breathing) {
    return { breath: Math.min(cfg.breathMax, breath + dt * cfg.breathRegenPerSec), breathing: false };
  }
  return { breath, breathing: false }; // requested but empty
}

/** Sphere-overlap hit test. */
export function isHit(aPos, bPos, radius = COMBAT.hitRadius) {
  return distance(aPos, bPos) < radius;
}

/**
 * Initial velocity for a spawned fire particle. Matches the prototype:
 * (forward + spread) * 1.4 + dragonVelocity * 0.3. Pure.
 */
export function spawnParticleVelocity(forward, dragonVel, spread = { x: 0, y: 0, z: 0 }) {
  return add(scale(add(forward, spread), 1.4), scale(dragonVel, 0.3));
}

/** Advance a fire particle: move by vel and decay life. Returns a NEW particle. */
export function stepParticle(p, dt, cfg = COMBAT) {
  return {
    ...p,
    pos: {
      x: p.pos.x + p.vel.x * dt * cfg.particleSpeed,
      y: p.pos.y + p.vel.y * dt * cfg.particleSpeed,
      z: p.pos.z + p.vel.z * dt * cfg.particleSpeed,
    },
    life: p.life - dt * cfg.particleFade,
  };
}

/** A particle is dead once its life reaches zero. */
export function particleExpired(p) {
  return p.life <= 0;
}
