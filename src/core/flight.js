// Pure flight/physics model — no THREE, no DOM. Given (state, input, dt) it
// returns a NEW state. This is the testable heart of the game; the render layer
// just copies the resulting numbers onto the Three.js dragon + camera.
//
// Ported from legacy/prototype.html updateFlight(), with two deliberate changes:
//   1. The vector-mutation camera bug is gone by construction — vec3 helpers are
//      immutable, so the heading vector can never be scaled in place. (Regression
//      test: test/flight.test.js "does not mutate the heading vector".)
//   2. The velocity-lerp factor is clamped to [0,1] for stability under dt spikes
//      (a no-op at the loop's clamped dt, but robust).

import { clamp } from './mathUtils.js';
import { vec3, scale, addScaled, lerpVec, normalize } from './vec3.js';

// All tunables in one place so DESIGN/balance changes are a single edit.
export const FLIGHT = {
  cruiseSpeed: 18,
  minSpeed: 8,
  maxSpeed: 55,
  flapSpeedBonus: 6,
  speedLerp: 1.5,

  rollAccel: 1.6,
  rollDamp: 2.2,
  rollMax: 1.1,
  yawFromRoll: 1.1, // banking turns: roll bleeds into heading change

  pitchAccel: 0.9,
  pitchDamp: 1.8,
  pitchMax: 0.8,

  velocityLerp: 3, // how fast velocity chases the heading*speed target

  flapLift: 0.18, // vertical bias added to heading while flapping
  glideSink: -0.04, // gentle sink while gliding

  maxAltitude: 400,
  terrainClearance: 6,

  // wing-flap cycle rate (rad/s) by mode
  flapRateFlapping: 9,
  flapRateBoosting: 6,
  flapRateCruise: 3.2,

  // visual orientation gains (how far the body leans vs. the flight angles)
  bodyYawGain: -1, // rotation.y = -yaw
  bodyRollGain: 0.9,
  bodyPitchGain: 0.6,
};

/** Fresh flight state. Pass overrides for tests / respawns. */
export function createFlightState(overrides = {}) {
  return {
    pos: vec3(0, 40, 0),
    yaw: 0,
    pitch: 0,
    roll: 0,
    speed: FLIGHT.cruiseSpeed,
    velocity: vec3(0, 0, 0),
    flapPhase: 0,
    // heading is recomputed every step; kept on state so the camera can reuse
    // the exact same unit vector without recomputing (and without mutating it).
    forward: vec3(1, 0, 0),
    ...overrides,
  };
}

/**
 * Unit heading vector from flight angles. `flapping` adds a little lift bias.
 * Always returns a normalized vector.
 */
export function forwardVector(pitch, yaw, flapping, cfg = FLIGHT) {
  return normalize(
    vec3(
      Math.cos(pitch) * Math.cos(yaw),
      Math.sin(pitch) + (flapping ? cfg.flapLift : cfg.glideSink),
      Math.cos(pitch) * Math.sin(yaw),
    ),
  );
}

/** Wing-flap cycle rate for the current input mode. */
function flapRate(input, cfg) {
  if (input.flap) return cfg.flapRateFlapping;
  if (input.boost) return cfg.flapRateBoosting;
  return cfg.flapRateCruise;
}

/**
 * Advance the flight simulation by dt seconds.
 * @param {object} state    previous flight state (not mutated)
 * @param {object} input    normalized control signal { pitch, roll, boost, flap }
 * @param {number} dt       seconds since last step
 * @param {(x:number,z:number)=>number} groundHeightAt  terrain height query
 * @param {object} cfg      tunables (defaults to FLIGHT)
 * @returns {object} new flight state
 */
export function stepFlight(state, input, dt, groundHeightAt = () => -Infinity, cfg = FLIGHT) {
  // --- roll, then banking yaw ---
  let roll = state.roll + (input.roll * cfg.rollAccel - state.roll * cfg.rollDamp) * dt;
  roll = clamp(roll, -cfg.rollMax, cfg.rollMax);
  const yaw = state.yaw - roll * dt * cfg.yawFromRoll;

  // --- pitch --- (direct control: input.pitch +1 = nose up / climb)
  let pitch = state.pitch + (input.pitch * cfg.pitchAccel - state.pitch * cfg.pitchDamp) * dt;
  pitch = clamp(pitch, -cfg.pitchMax, cfg.pitchMax);

  // --- speed ---
  const targetSpeed = input.boost ? cfg.maxSpeed : cfg.cruiseSpeed + (input.flap ? cfg.flapSpeedBonus : 0);
  let speed = state.speed + (targetSpeed - state.speed) * dt * cfg.speedLerp;
  speed = clamp(speed, cfg.minSpeed, cfg.maxSpeed);

  // --- heading + velocity + position ---
  // `forward` is a fresh immutable unit vector; scaling it below allocates a new
  // vector rather than mutating `forward`, so the camera can safely reuse it.
  const forward = forwardVector(pitch, yaw, input.flap, cfg);
  const velLerp = clamp(dt * cfg.velocityLerp, 0, 1);
  const velocity = lerpVec(state.velocity, scale(forward, speed), velLerp);
  let pos = addScaled(state.pos, velocity, dt);

  // --- keep above terrain / below ceiling ---
  const groundY = groundHeightAt(pos.x, pos.z) + cfg.terrainClearance;
  if (pos.y < groundY) pos = { x: pos.x, y: groundY, z: pos.z };
  if (pos.y > cfg.maxAltitude) pos = { x: pos.x, y: cfg.maxAltitude, z: pos.z };

  // --- wing-flap phase ---
  const flapPhase = state.flapPhase + dt * flapRate(input, cfg);

  return { pos, yaw, pitch, roll, speed, velocity, flapPhase, forward };
}

/** Visual body orientation (Euler radians) for the render layer. Pure. */
export function dragonOrientation(state, cfg = FLIGHT) {
  return {
    x: state.pitch * cfg.bodyPitchGain,
    y: state.yaw * cfg.bodyYawGain,
    z: state.roll * cfg.bodyRollGain,
  };
}

/** HUD-facing readouts derived from state. Pure. */
export function flightReadouts(state) {
  return {
    speed: Math.round(state.speed * 3.2),
    altitude: Math.round(state.pos.y),
  };
}
