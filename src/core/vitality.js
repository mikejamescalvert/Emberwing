// Pure vitality (health) logic — no THREE, no DOM.
// Flak hits drain vitality; after a quiet spell it regenerates. Zero = death.

export const VITALITY = {
  max: 100,
  regenPerSec: 6,
  regenDelay: 2.5, // seconds after the last hit before regen resumes
};

/** Fresh full vitality. `sinceHit` large so regen is available immediately. */
export function createVitality(cfg = VITALITY) {
  return { hp: cfg.max, sinceHit: Infinity };
}

/** Apply damage: lower hp (clamped at 0) and reset the regen delay. Returns NEW state. */
export function damageVitality(v, amount) {
  return { hp: Math.max(0, v.hp - amount), sinceHit: 0 };
}

/**
 * Advance vitality by dt: regen resumes only once `regenDelay` has elapsed since
 * the last hit, clamped to max. Returns a NEW state.
 */
export function stepVitality(v, dt, cfg = VITALITY) {
  const sinceHit = v.sinceHit + dt;
  let hp = v.hp;
  if (sinceHit >= cfg.regenDelay) hp = Math.min(cfg.max, hp + dt * cfg.regenPerSec);
  return { hp, sinceHit };
}

export function isDead(v) {
  return v.hp <= 0;
}
