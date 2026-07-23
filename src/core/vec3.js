// Pure, immutable 3D vector helpers operating on plain {x, y, z} objects.
// No THREE, no DOM. Every function returns a NEW object and never mutates its
// inputs — this is deliberate: the prototype's worst bug was aliasing a shared
// `forward` vector and mutating it in place with multiplyScalar(). Immutable-by
// -construction makes that whole bug class impossible. See test/flight.test.js.

import { lerp } from './mathUtils.js';

export function vec3(x = 0, y = 0, z = 0) {
  return { x, y, z };
}

export function clone(a) {
  return { x: a.x, y: a.y, z: a.z };
}

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function scale(a, s) {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

/** a + b * s, in one allocation. */
export function addScaled(a, b, s) {
  return { x: a.x + b.x * s, y: a.y + b.y * s, z: a.z + b.z * s };
}

export function length(a) {
  return Math.hypot(a.x, a.y, a.z);
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/** Unit vector in the direction of `a`. Zero-length input returns a zero vector. */
export function normalize(a) {
  const len = length(a);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: a.x / len, y: a.y / len, z: a.z / len };
}

export function lerpVec(a, b, t) {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), z: lerp(a.z, b.z, t) };
}
