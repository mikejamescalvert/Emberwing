// Pure input mapping — no DOM. Keyboard state and virtual-joystick/touch state
// are combined into ONE normalized control signal so desktop and mobile drive
// identical downstream logic. The thin DOM event wiring lives in
// src/input/bindings.js and only writes into the plain state objects consumed here.

import { clamp } from './mathUtils.js';

/** Fresh keyboard state (a code -> bool map, e.g. { KeyW: true }). */
export function createKeyState() {
  return {};
}

/** Fresh touch/joystick state. */
export function createTouchState() {
  return { joyX: 0, joyY: 0, fire: false, boost: false, climb: false };
}

/**
 * Convert a raw pointer offset from the joystick centre into a normalized
 * { x, y } in [-1, 1] (plus the clamped pixel offset px/py for rendering the
 * knob). Clamped to `radius`. Pure — mirrors the prototype's updateJoy().
 */
export function joystickVector(dx, dy, radius) {
  const dist = Math.min(Math.hypot(dx, dy), radius);
  const ang = Math.atan2(dy, dx);
  const px = Math.cos(ang) * dist;
  const py = Math.sin(ang) * dist;
  return { x: px / radius, y: py / radius, px, py };
}

/**
 * Combine keyboard + touch + pointer into one control signal.
 * @param {Object} keys    code -> bool (KeyW/KeyS/KeyA/KeyD/Space/ShiftLeft/ShiftRight)
 * @param {Object} touch   { joyX, joyY, fire, boost, climb }
 * @param {Object} pointer { down } — mouse/touch held to breathe fire
 * @returns {{pitch:number, roll:number, boost:boolean, flap:boolean, breathing:boolean}}
 */
export function combineInput(keys = {}, touch = {}, pointer = {}) {
  const kbPitch = (keys.KeyW ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const kbRoll = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const joyX = touch.joyX || 0;
  const joyY = touch.joyY || 0;

  return {
    // Knob up = negative y; combined with KeyW this yields the prototype's
    // pitch mapping (W / knob-up = nose down). The joystick-Y feel is flagged
    // in DESIGN.md as a candidate to invert for mobile.
    pitch: clamp(kbPitch - joyY, -1, 1),
    roll: clamp(kbRoll + joyX, -1, 1),
    boost: !!keys.ShiftLeft || !!keys.ShiftRight || !!touch.boost,
    flap: !!keys.Space || !!touch.climb,
    breathing: !!pointer.down || !!touch.fire,
  };
}
