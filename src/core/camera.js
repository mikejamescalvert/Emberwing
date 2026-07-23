// Pure third-person chase-camera math — no THREE, no DOM. Reads flight state
// (position + unit heading) and returns where the camera wants to be and look.
// It has NO side effects on flight state.
//
// The follow distance is derived from a UNIT heading vector via the immutable
// scale(), so it is constant — it does NOT scale with speed. That is precisely
// the fix for the prototype's runaway camera (see test/camera.test.js).

import { scale, addScaled } from './vec3.js';

export const CAMERA = {
  behindDist: 9,
  aboveHeight: 3,
  lookAhead: 14,
  followLambda: 9, // exponential follow rate (frame-rate independent)
  fov: 65,
  near: 0.1,
  far: 3000,
};

/** Desired camera world position: behindDist behind along heading, aboveHeight up. */
export function desiredCameraPosition(pos, forward, cfg = CAMERA) {
  const behind = scale(forward, -cfg.behindDist); // forward not mutated
  return {
    x: pos.x + behind.x,
    y: pos.y + behind.y + cfg.aboveHeight,
    z: pos.z + behind.z,
  };
}

/** Desired look-at target: lookAhead ahead of the dragon along its heading. */
export function desiredLookTarget(pos, forward, cfg = CAMERA) {
  return addScaled(pos, forward, cfg.lookAhead);
}

/** Frame-rate-independent lerp factor for easing the camera toward its target. */
export function followFactor(dt, cfg = CAMERA) {
  return 1 - Math.exp(-cfg.followLambda * dt);
}
