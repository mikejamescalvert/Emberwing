import { describe, it, expect } from 'vitest';
import { length } from '../src/core/vec3.js';
import {
  FLIGHT,
  createFlightState,
  forwardVector,
  stepFlight,
  dragonOrientation,
  flightReadouts,
} from '../src/core/flight.js';

const NO_GROUND = () => -Infinity;
const LEVEL = { pitch: 0, roll: 0, boost: false, flap: false };

describe('forwardVector', () => {
  it('is always a unit vector', () => {
    for (const [p, y] of [
      [0, 0],
      [0.5, 1],
      [-0.8, 3],
      [0.3, -2],
    ]) {
      expect(length(forwardVector(p, y, false))).toBeCloseTo(1, 6);
      expect(length(forwardVector(p, y, true))).toBeCloseTo(1, 6);
    }
  });
});

describe('stepFlight — vector-mutation regression (the prototype\'s worst bug)', () => {
  it('keeps the returned heading a UNIT vector even at max speed', () => {
    // If velocity integration mutated `forward` (the old bug), its length would
    // scale with speed (~55) instead of staying 1, and the camera would fly away.
    const s = createFlightState({ speed: FLIGHT.maxSpeed });
    const next = stepFlight(s, { ...LEVEL, boost: true }, 0.016, NO_GROUND);
    expect(length(next.forward)).toBeCloseTo(1, 6);
  });

  it('does not mutate the input state', () => {
    const s = createFlightState();
    const snapshot = JSON.parse(JSON.stringify(s));
    stepFlight(s, { pitch: 1, roll: 1, boost: true, flap: true }, 0.05, NO_GROUND);
    expect(s).toEqual(snapshot);
  });
});

describe('stepFlight — speed', () => {
  it('accelerates toward maxSpeed while boosting but never exceeds it', () => {
    let s = createFlightState();
    for (let i = 0; i < 600; i++) s = stepFlight(s, { ...LEVEL, boost: true }, 0.05, NO_GROUND);
    expect(s.speed).toBeLessThanOrEqual(FLIGHT.maxSpeed + 1e-9);
    expect(s.speed).toBeCloseTo(FLIGHT.maxSpeed, 1);
  });

  it('settles at cruiseSpeed when idle and never drops below minSpeed', () => {
    let s = createFlightState({ speed: FLIGHT.minSpeed });
    for (let i = 0; i < 600; i++) s = stepFlight(s, LEVEL, 0.05, NO_GROUND);
    expect(s.speed).toBeGreaterThanOrEqual(FLIGHT.minSpeed - 1e-9);
    expect(s.speed).toBeCloseTo(FLIGHT.cruiseSpeed, 1);
  });
});

describe('stepFlight — attitude', () => {
  it('keeps pitch and roll within their clamped bounds under sustained input', () => {
    let s = createFlightState();
    for (let i = 0; i < 600; i++) s = stepFlight(s, { pitch: -1, roll: 1, boost: false, flap: false }, 0.05, NO_GROUND);
    expect(Math.abs(s.pitch)).toBeLessThanOrEqual(FLIGHT.pitchMax + 1e-9);
    expect(Math.abs(s.roll)).toBeLessThanOrEqual(FLIGHT.rollMax + 1e-9);
  });

  it('banking (roll input) turns the heading', () => {
    let s = createFlightState();
    s = stepFlight(s, { ...LEVEL, roll: 1 }, 0.05, NO_GROUND);
    s = stepFlight(s, { ...LEVEL, roll: 1 }, 0.05, NO_GROUND);
    expect(s.roll).toBeGreaterThan(0);
    expect(s.yaw).not.toBe(0); // rolled → yaw drifts (banking turn)
  });
});

describe('stepFlight — world limits', () => {
  it('never sinks below terrain + clearance', () => {
    let s = createFlightState({ pos: { x: 0, y: 10, z: 0 } });
    const HIGH_GROUND = () => 100;
    for (let i = 0; i < 5; i++) s = stepFlight(s, LEVEL, 0.05, HIGH_GROUND);
    expect(s.pos.y).toBeGreaterThanOrEqual(100 + FLIGHT.terrainClearance - 1e-9);
  });

  it('caps altitude at maxAltitude when climbing hard', () => {
    let s = createFlightState({ pos: { x: 0, y: 399, z: 0 } });
    for (let i = 0; i < 100; i++) s = stepFlight(s, { pitch: -1, roll: 0, boost: true, flap: true }, 0.05, NO_GROUND);
    expect(s.pos.y).toBeLessThanOrEqual(FLIGHT.maxAltitude + 1e-9);
  });
});

describe('derived readouts', () => {
  it('dragonOrientation maps flight angles to body euler', () => {
    const s = createFlightState({ pitch: 0.5, yaw: 1, roll: 0.2 });
    const o = dragonOrientation(s);
    expect(o.x).toBeCloseTo(0.5 * FLIGHT.bodyPitchGain, 12);
    expect(o.y).toBeCloseTo(1 * FLIGHT.bodyYawGain, 12);
    expect(o.z).toBeCloseTo(0.2 * FLIGHT.bodyRollGain, 12);
  });

  it('flightReadouts rounds speed and altitude', () => {
    const s = createFlightState({ speed: 18, pos: { x: 0, y: 123.7, z: 0 } });
    expect(flightReadouts(s)).toEqual({ speed: Math.round(18 * 3.2), altitude: 124 });
  });
});
