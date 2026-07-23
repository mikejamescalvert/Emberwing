// Pure input mapping — no DOM. Keyboard state and virtual-joystick/touch state
// are combined into ONE normalized control signal so desktop and mobile drive
// identical downstream logic. The thin DOM event wiring lives in
// src/input/bindings.js and only writes into the plain state objects consumed here.
//
// Control philosophy: "point where you want to go". Stick right = turn right,
// stick up = climb. Three verbs total: steer (pitch+roll), boost, breathe.
// There is no separate flap verb — climbing drives the wing animation instead.

import { clamp } from './mathUtils.js';

/** Fresh keyboard state (a code -> bool map, e.g. { KeyW: true }). */
export function createKeyState() {
  return {};
}

/** Fresh touch/joystick state. */
export function createTouchState() {
  return { joyX: 0, joyY: 0, fire: false, boost: false };
}

/**
 * Convert a raw pointer offset from the joystick centre into a normalized
 * { x, y } in [-1, 1] (plus the clamped pixel offset px/py for rendering the
 * knob). Clamped to `radius`. Pure.
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
 * @param {Object} touch   { joyX, joyY, fire, boost }
 * @param {Object} pointer { down } — mouse/touch held to breathe fire
 * @returns {{pitch:number, roll:number, boost:boolean, breathing:boolean}}
 */
export function combineInput(keys = {}, touch = {}, pointer = {}) {
  // Space is a climb alias (comfortable for mouse+keyboard one-handed play).
  const kbPitch = (keys.KeyW ? 1 : 0) + (keys.Space ? 1 : 0) - (keys.KeyS ? 1 : 0);
  const kbRoll = (keys.KeyD ? 1 : 0) - (keys.KeyA ? 1 : 0);
  const joyX = touch.joyX || 0;
  const joyY = touch.joyY || 0;

  return {
    // Direct control: +1 = nose up / climb. W, Space, and knob-up all climb.
    pitch: clamp(kbPitch - joyY, -1, 1),
    // Direct control: +1 = turn right. D and knob-right turn right.
    roll: clamp(kbRoll + joyX, -1, 1),
    boost: !!keys.ShiftLeft || !!keys.ShiftRight || !!touch.boost,
    breathing: !!pointer.down || !!touch.fire,
  };
}
