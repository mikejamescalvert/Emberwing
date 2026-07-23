// Pure world/terrain helpers — no THREE, no DOM.
// Terrain height is a cheap deterministic ridge function; object placement uses
// a seeded RNG so a given seed always produces the same world (reproducible +
// testable, unlike the prototype's Math.random() scatter).

/** Ridge-noise terrain height at (x, z). Deterministic. */
export function ridgeNoise(x, z) {
  return Math.sin(x * 0.006) * 18 + Math.cos(z * 0.005) * 18 + Math.sin((x + z) * 0.003) * 10;
}

/** Alias used by the flight terrain-clearance check. */
export const groundHeight = ridgeNoise;

/** Deterministic PRNG (mulberry32). Same seed → same sequence, values in [0,1). */
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Scatter `count` {x, z} positions uniformly in a square of side `spread`,
 * centred on the origin, using the provided RNG. Deterministic given the RNG.
 */
export function scatter(rng, count, spread) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({ x: (rng() - 0.5) * spread, z: (rng() - 0.5) * spread });
  }
  return out;
}
