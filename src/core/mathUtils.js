// Pure scalar helpers — no THREE, no DOM. Fully unit-tested.

/** Clamp `value` into the inclusive range [min, max]. */
export function clamp(value, min, max) {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation from `a` to `b` by `t` (t is not clamped). */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}

/**
 * Frame-rate-independent exponential smoothing toward `target`.
 * `lambda` is the rate; larger = snappier. Returns a value in [current, target].
 */
export function expDamp(current, target, lambda, dt) {
  return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** Move `current` toward `target` by at most `maxDelta` (never overshoots). */
export function moveTowards(current, target, maxDelta) {
  const d = target - current;
  if (Math.abs(d) <= maxDelta) return target;
  return current + Math.sign(d) * maxDelta;
}
