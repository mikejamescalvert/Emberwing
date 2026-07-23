// Pure emberstone logic — no THREE, no DOM.
// A burned sentinel shatters into glowing "emberstone" motes that pop outward
// and fall. Flying the dragon through one absorbs it (xp toward growth).

import { addScaled, distance } from './vec3.js';

export const EMBERSTONE = {
  motesPerKill: 6,
  burstSpeed: 9, // outward horizontal speed
  upBias: 6, // initial upward pop
  gravity: 14, // downward acceleration
  life: 6, // seconds before a mote fades
  pickupRadius: 5, // base fly-through radius (scaled by dragon size in game)
  xpPerMote: 1,
};

/**
 * Deterministic burst of motes from `origin`, using an rng() in [0,1).
 * Each mote starts at the origin with an outward+upward velocity.
 */
export function spawnBurst(origin, rng, cfg = EMBERSTONE) {
  const motes = [];
  for (let i = 0; i < cfg.motesPerKill; i++) {
    const ang = rng() * Math.PI * 2;
    const horiz = 0.4 + rng() * 0.6;
    motes.push({
      pos: { x: origin.x, y: origin.y, z: origin.z },
      vel: {
        x: Math.cos(ang) * cfg.burstSpeed * horiz,
        y: cfg.upBias * (0.6 + rng() * 0.8),
        z: Math.sin(ang) * cfg.burstSpeed * horiz,
      },
      life: cfg.life,
    });
  }
  return motes;
}

/** Advance one mote (gravity + drift, life decay). Returns a NEW mote. */
export function stepMote(mote, dt, cfg = EMBERSTONE) {
  const vel = { x: mote.vel.x, y: mote.vel.y - cfg.gravity * dt, z: mote.vel.z };
  return { pos: addScaled(mote.pos, vel, dt), vel, life: mote.life - dt };
}

export function moteExpired(mote) {
  return mote.life <= 0;
}

/** True when the dragon is close enough to absorb the mote. */
export function moteCollected(motePos, dragonPos, radius = EMBERSTONE.pickupRadius) {
  return distance(motePos, dragonPos) < radius;
}
