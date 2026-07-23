import { describe, it, expect } from 'vitest';
import { length, sub } from '../src/core/vec3.js';
import { CAMERA, desiredCameraPosition, desiredLookTarget, followFactor } from '../src/core/camera.js';
import { createFlightState, forwardVector, stepFlight } from '../src/core/flight.js';

const NO_GROUND = () => -Infinity;
const LEVEL = { pitch: 0, roll: 0, boost: false };

/** Planar "behind" distance from dragon to camera (excludes the fixed height rise). */
function behindDistance(pos, forward) {
  const cam = desiredCameraPosition(pos, forward);
  const off = sub(cam, pos);
  off.y -= CAMERA.aboveHeight;
  return length(off);
}

describe('desiredCameraPosition — runaway-camera regression', () => {
  it('sits exactly behindDist behind for any heading', () => {
    for (const [p, y] of [
      [0, 0],
      [0.5, 1.3],
      [-0.7, -2.1],
    ]) {
      expect(behindDistance({ x: 0, y: 40, z: 0 }, forwardVector(p, y))).toBeCloseTo(CAMERA.behindDist, 6);
    }
  });

  it('follow distance is IDENTICAL at min and max speed (the bug that flew the camera away)', () => {
    const low = stepFlight(createFlightState({ speed: 8 }), LEVEL, 0.016, NO_GROUND);
    const high = stepFlight(createFlightState({ speed: 55 }), { ...LEVEL, boost: true }, 0.016, NO_GROUND);
    expect(behindDistance(low.pos, low.forward)).toBeCloseTo(CAMERA.behindDist, 6);
    expect(behindDistance(high.pos, high.forward)).toBeCloseTo(CAMERA.behindDist, 6);
  });

  it('does not mutate the heading vector passed to it', () => {
    const fwd = forwardVector(0.3, 1.1);
    const snapshot = { ...fwd };
    desiredCameraPosition({ x: 1, y: 2, z: 3 }, fwd);
    desiredLookTarget({ x: 1, y: 2, z: 3 }, fwd);
    expect(fwd).toEqual(snapshot);
  });
});

describe('desiredLookTarget', () => {
  it('is lookAhead units ahead of the dragon along its heading', () => {
    const pos = { x: 0, y: 40, z: 0 };
    const fwd = forwardVector(0, 0);
    const look = desiredLookTarget(pos, fwd);
    expect(length(sub(look, pos))).toBeCloseTo(CAMERA.lookAhead, 6);
  });
});

describe('camera size scaling (dragon growth)', () => {
  it('pulls the camera back proportionally to sizeScale', () => {
    const pos = { x: 0, y: 40, z: 0 };
    const fwd = forwardVector(0, 0);
    const cam2 = desiredCameraPosition(pos, fwd, CAMERA, 2);
    const off = sub(cam2, pos);
    off.y -= CAMERA.aboveHeight * 2;
    expect(length(off)).toBeCloseTo(CAMERA.behindDist * 2, 6);
  });
  it('scales the look-ahead distance too', () => {
    const pos = { x: 0, y: 40, z: 0 };
    const fwd = forwardVector(0, 0);
    const look = desiredLookTarget(pos, fwd, CAMERA, 3);
    expect(length(sub(look, pos))).toBeCloseTo(CAMERA.lookAhead * 3, 6);
  });
});

describe('followFactor', () => {
  it('is 0 at dt=0 and approaches 1 for large dt', () => {
    expect(followFactor(0)).toBe(0);
    expect(followFactor(100)).toBeCloseTo(1, 6);
    const f = followFactor(0.016);
    expect(f).toBeGreaterThan(0);
    expect(f).toBeLessThan(1);
  });
});
