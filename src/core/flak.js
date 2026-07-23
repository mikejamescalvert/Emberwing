// Pure flak/projectile logic — no THREE, no DOM.
// Wardstone sentinels fire slow, dodgeable projectiles at the dragon. Slow speed
// + straight-line travel means banking away is the counter — flying is the skill.

import { sub, scale, addScaled, normalize, distance } from './vec3.js';

export const FLAK = {
  wardstoneFraction: 0.35, // share of sentinels that are wardstones
  range: 320, // only fire when the dragon is within this distance
  fireIntervalMin: 2.2, // seconds between shots (randomized per wardstone)
  fireIntervalMax: 3.8,
  projectileSpeed: 42, // units/sec — slow enough to dodge
  projectileLife: 4, // seconds before it fizzles
  hitRadius: 3.2, // overlap with the dragon that counts as a hit
  damage: 12, // vitality lost per hit
};

/** Unit direction from origin to target. */
export function aimDirection(origin, target) {
  return normalize(sub(target, origin));
}

/** Is the target within firing range of the origin? */
export function withinRange(origin, target, range = FLAK.range) {
  return distance(origin, target) <= range;
}

/** Spawn a projectile from origin aimed at target's current position. */
export function spawnFlak(origin, target, cfg = FLAK) {
  return {
    pos: { x: origin.x, y: origin.y, z: origin.z },
    vel: scale(aimDirection(origin, target), cfg.projectileSpeed),
    life: cfg.projectileLife,
  };
}

/** Advance a projectile (straight line) and decay life. Returns a NEW projectile. */
export function stepFlak(proj, dt) {
  return { pos: addScaled(proj.pos, proj.vel, dt), vel: proj.vel, life: proj.life - dt };
}

export function flakExpired(proj) {
  return proj.life <= 0;
}

export function flakHitsDragon(projPos, dragonPos, radius = FLAK.hitRadius) {
  return distance(projPos, dragonPos) < radius;
}

/** A randomized cooldown for the next shot, using an rng() in [0,1). */
export function randomFireInterval(rng, cfg = FLAK) {
  return cfg.fireIntervalMin + rng() * (cfg.fireIntervalMax - cfg.fireIntervalMin);
}
