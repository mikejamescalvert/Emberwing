// Pure flight/physics model — no THREE, no DOM. Given (state, input, dt) it
// returns a NEW state. This is the testable heart of the game; the render layer
// just copies the resulting numbers onto the Three.js dragon + camera.
//
// Control model: DIRECT ARCADE STEERING — "point where you want to go".
//   - The stick sets the bank with a fast ease (steerLambda), and the yaw rate
//     follows the bank immediately. Right stick turns screen-RIGHT (+Z when
//     facing +X): yaw INCREASES with right input. The prototype had this sign
//     flipped (yaw -= roll), which literally mirrored the turn — guarded now by
//     the steering-direction regression tests.
//   - Pitch is direct: stick up = nose up = climb, easing toward a target angle.
//   - No separate "flap" verb: climbing/boosting drives the wing-flap animation,
//     and speed trades with altitude instead (dive fast, climb slow).
//
// The vector-mutation camera bug stays designed out: vec3 helpers are immutable,
// so the heading can never be scaled in place (see test/flight.test.js).

import { clamp, expDamp } from './mathUtils.js';
import { vec3, scale, addScaled, lerpVec, normalize } from './vec3.js';

// All tunables in one place so DESIGN/balance changes are a single edit.
export const FLIGHT = {
  cruiseSpeed: 18,
  minSpeed: 8,
  maxSpeed: 55,
  speedLerp: 2, // how fast speed chases its target
  diveSpeedGain: 12, // dive to gain speed, climb to bleed it (± at full pitch)

  steerLambda: 8, // stick response rate (τ ≈ 0.12 s) — snappy but not twitchy
  bankMax: 0.9, // full-stick bank angle (rad); also the visual roll
  turnRate: 1.7, // yaw rate (rad/s) at full bank ≈ 97°/s

  pitchLambda: 6, // climb/dive response (τ ≈ 0.17 s)
  pitchMaxInput: 0.55, // full-stick pitch target (rad)
  pitchMax: 0.8, // hard clamp

  glideSink: -0.04, // gentle sink folded into the heading

  velocityLerp: 3, // how fast velocity chases heading*speed (slight drift feel)

  maxAltitude: 400,
  terrainClearance: 6,

  // wing-flap animation rate (rad/s): vigorous when climbing, brisk when
  // boosting, lazy at cruise. Purely visual — driven by input, not a verb.
  climbFlapThreshold: 0.3,
  flapRateClimb: 9,
  flapRateBoost: 6,
  flapRateCruise: 3.2,

  // Body-pose gains. The dragon model faces +X, so with Euler order 'YZX'
  // (yaw -> pitch -> roll, aircraft-style): nose-up is rotation.z and bank is
  // rotation.x. (The prototype mapped these to the +Z-facing axes — steering
  // visually pitched the nose and climbing visually banked the body.)
  bodyYawGain: -1, // rotation.y = -yaw faces the model along its heading
  bodyPitchGain: 0.9, // rotation.z — nose follows climb/dive
  bodyBankGain: 1.0, // rotation.x — banks into the turn (right stick dips right wing)
};

/** Fresh flight state. Pass overrides for tests / respawns. */
export function createFlightState(overrides = {}) {
  return {
    pos: vec3(0, 40, 0),
    yaw: 0,
    pitch: 0,
    roll: 0, // current bank angle; steering state AND the visual lean
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
 * Unit heading vector from flight angles (with a touch of glide-sink).
 * Always returns a normalized vector.
 */
export function forwardVector(pitch, yaw, cfg = FLIGHT) {
  return normalize(
    vec3(
      Math.cos(pitch) * Math.cos(yaw),
      Math.sin(pitch) + cfg.glideSink,
      Math.cos(pitch) * Math.sin(yaw),
    ),
  );
}

/** Wing-flap animation rate for the current input. */
function flapRate(input, cfg) {
  if (input.pitch > cfg.climbFlapThreshold) return cfg.flapRateClimb;
  if (input.boost) return cfg.flapRateBoost;
  return cfg.flapRateCruise;
}

/**
 * Advance the flight simulation by dt seconds.
 * @param {object} state    previous flight state (not mutated)
 * @param {object} input    normalized control signal { pitch, roll, boost }
 * @param {number} dt       seconds since last step
 * @param {(x:number,z:number)=>number} groundHeightAt  terrain height query
 * @param {object} cfg      tunables (defaults to FLIGHT)
 * @returns {object} new flight state
 */
export function stepFlight(state, input, dt, groundHeightAt = () => -Infinity, cfg = FLIGHT) {
  // --- steering: bank eases toward the stick; yaw follows the bank directly ---
  // Right input (+1) -> positive bank -> yaw increases -> heading toward +Z,
  // which is screen-right for the chase camera. Releasing the stick levels the
  // bank in ~3τ, so the turn stops instead of carrying on.
  const roll = expDamp(state.roll, input.roll * cfg.bankMax, cfg.steerLambda, dt);
  const yaw = state.yaw + (roll / cfg.bankMax) * cfg.turnRate * dt;

  // --- pitch: direct (stick up = nose up = climb) ---
  let pitch = expDamp(state.pitch, input.pitch * cfg.pitchMaxInput, cfg.pitchLambda, dt);
  pitch = clamp(pitch, -cfg.pitchMax, cfg.pitchMax);

  // --- speed: boost overrides; otherwise trade altitude for speed ---
  const base = input.boost ? cfg.maxSpeed : cfg.cruiseSpeed;
  const targetSpeed = base - Math.sin(pitch) * cfg.diveSpeedGain;
  let speed = state.speed + (targetSpeed - state.speed) * clamp(dt * cfg.speedLerp, 0, 1);
  speed = clamp(speed, cfg.minSpeed, cfg.maxSpeed);

  // --- heading + velocity + position ---
  // `forward` is a fresh immutable unit vector; scaling it below allocates a new
  // vector rather than mutating `forward`, so the camera can safely reuse it.
  const forward = forwardVector(pitch, yaw, cfg);
  const velLerp = clamp(dt * cfg.velocityLerp, 0, 1);
  const velocity = lerpVec(state.velocity, scale(forward, speed), velLerp);
  let pos = addScaled(state.pos, velocity, dt);

  // --- keep above terrain / below ceiling ---
  const groundY = groundHeightAt(pos.x, pos.z) + cfg.terrainClearance;
  if (pos.y < groundY) pos = { x: pos.x, y: groundY, z: pos.z };
  if (pos.y > cfg.maxAltitude) pos = { x: pos.x, y: cfg.maxAltitude, z: pos.z };

  // --- wing-flap animation phase ---
  const flapPhase = state.flapPhase + dt * flapRate(input, cfg);

  return { pos, yaw, pitch, roll, speed, velocity, flapPhase, forward };
}

/**
 * Visual body orientation (Euler radians) for the render layer. Pure.
 * Requires the dragon group's rotation order to be 'YZX' (set in the builder):
 * yaw about Y, then nose up/down about the lateral Z, then bank about the
 * longitudinal X — proper aircraft composition for a +X-facing model.
 */
export function dragonOrientation(state, cfg = FLIGHT) {
  return {
    x: state.roll * cfg.bodyBankGain,
    y: state.yaw * cfg.bodyYawGain,
    z: state.pitch * cfg.bodyPitchGain,
  };
}

/** HUD-facing readouts derived from state. Pure. */
export function flightReadouts(state) {
  return {
    speed: Math.round(state.speed * 3.2),
    altitude: Math.round(state.pos.y),
  };
}
