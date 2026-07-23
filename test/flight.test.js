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
const LEVEL = { pitch: 0, roll: 0, boost: false };

describe('forwardVector', () => {
  it('is always a unit vector', () => {
    for (const [p, y] of [
      [0, 0],
      [0.5, 1],
      [-0.8, 3],
      [0.3, -2],
    ]) {
      expect(length(forwardVector(p, y))).toBeCloseTo(1, 6);
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
    stepFlight(s, { pitch: 1, roll: 1, boost: true }, 0.05, NO_GROUND);
    expect(s).toEqual(snapshot);
  });
});

describe('stepFlight — steering direction (the "left should go left" regression)', () => {
  // The prototype derived yaw from bank with a flipped sign, so right input
  // turned the dragon screen-LEFT. Facing +X with the chase camera behind,
  // screen-right is +Z: right input must drive heading.z and pos.z POSITIVE.
  it('right input turns and moves the dragon screen-right (+Z)', () => {
    let s = createFlightState();
    for (let i = 0; i < 24; i++) s = stepFlight(s, { ...LEVEL, roll: 1 }, 0.05, NO_GROUND);
    expect(s.yaw).toBeGreaterThan(0);
    expect(s.forward.z).toBeGreaterThan(0);
    expect(s.pos.z).toBeGreaterThan(0);
  });

  it('left input turns and moves the dragon screen-left (-Z)', () => {
    let s = createFlightState();
    for (let i = 0; i < 24; i++) s = stepFlight(s, { ...LEVEL, roll: -1 }, 0.05, NO_GROUND);
    expect(s.yaw).toBeLessThan(0);
    expect(s.forward.z).toBeLessThan(0);
    expect(s.pos.z).toBeLessThan(0);
  });

  it('banks into the turn, then levels out and STOPS turning on release', () => {
    let s = createFlightState();
    for (let i = 0; i < 20; i++) s = stepFlight(s, { ...LEVEL, roll: 1 }, 0.05, NO_GROUND);
    expect(s.roll).toBeGreaterThan(0.7); // banked hard right (visual lean)
    for (let i = 0; i < 10; i++) s = stepFlight(s, LEVEL, 0.05, NO_GROUND); // 0.5 s neutral
    expect(Math.abs(s.roll)).toBeLessThan(0.05); // level again
    const settledYaw = s.yaw;
    for (let i = 0; i < 20; i++) s = stepFlight(s, LEVEL, 0.05, NO_GROUND); // 1 s more
    expect(Math.abs(s.yaw - settledYaw)).toBeLessThan(0.05); // no drifting carry-on turn
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

  it('diving is faster than level flight; climbing is slower', () => {
    let dive = createFlightState();
    let climb = createFlightState();
    for (let i = 0; i < 100; i++) {
      dive = stepFlight(dive, { ...LEVEL, pitch: -1 }, 0.05, NO_GROUND);
      climb = stepFlight(climb, { ...LEVEL, pitch: 1 }, 0.05, NO_GROUND);
    }
    expect(dive.speed).toBeGreaterThan(FLIGHT.cruiseSpeed + 2);
    expect(climb.speed).toBeLessThan(FLIGHT.cruiseSpeed - 2);
    expect(climb.speed).toBeGreaterThanOrEqual(FLIGHT.minSpeed - 1e-9);
  });
});

describe('stepFlight — attitude & motion', () => {
  it('direct pitch: +1 climbs (nose up), -1 dives', () => {
    let up = createFlightState();
    let down = createFlightState();
    for (let i = 0; i < 40; i++) {
      up = stepFlight(up, { ...LEVEL, pitch: 1 }, 0.05, NO_GROUND);
      down = stepFlight(down, { ...LEVEL, pitch: -1 }, 0.05, NO_GROUND);
    }
    expect(up.pitch).toBeGreaterThan(0);
    expect(up.forward.y).toBeGreaterThan(0);
    expect(up.pos.y).toBeGreaterThan(40);
    expect(down.pitch).toBeLessThan(0);
    expect(down.forward.y).toBeLessThan(0);
    expect(down.pos.y).toBeLessThan(40);
  });

  it('keeps pitch and bank within their bounds under sustained input', () => {
    let s = createFlightState();
    for (let i = 0; i < 200; i++) s = stepFlight(s, { pitch: 1, roll: 1, boost: false }, 0.05, NO_GROUND);
    expect(Math.abs(s.pitch)).toBeLessThanOrEqual(FLIGHT.pitchMaxInput + 1e-9);
    expect(Math.abs(s.roll)).toBeLessThanOrEqual(FLIGHT.bankMax + 1e-9);
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
    for (let i = 0; i < 100; i++) s = stepFlight(s, { pitch: 1, roll: 0, boost: true }, 0.05, NO_GROUND);
    expect(s.pos.y).toBeLessThanOrEqual(FLIGHT.maxAltitude + 1e-9);
  });
});

describe('derived readouts', () => {
  it('dragonOrientation: bank on X, yaw on Y, nose on Z (the +X-facing axes)', () => {
    // The prototype swapped these (pitch->x, roll->z — the +Z-facing mapping),
    // so steering visually reared the nose and climbing visually banked the body.
    const s = createFlightState({ pitch: 0.4, yaw: 1, roll: 0.6 });
    const o = dragonOrientation(s);
    expect(o.x).toBeCloseTo(0.6 * FLIGHT.bodyBankGain, 12);
    expect(o.y).toBeCloseTo(1 * FLIGHT.bodyYawGain, 12);
    expect(o.z).toBeCloseTo(0.4 * FLIGHT.bodyPitchGain, 12);
  });

  it('flightReadouts rounds speed and altitude', () => {
    const s = createFlightState({ speed: 18, pos: { x: 0, y: 123.7, z: 0 } });
    expect(flightReadouts(s)).toEqual({ speed: Math.round(18 * 3.2), altitude: 124 });
  });
});
