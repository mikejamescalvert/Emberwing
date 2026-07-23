import { describe, it, expect } from 'vitest';
import { combineInput, joystickVector, createTouchState, createKeyState } from '../src/core/input.js';

describe('joystickVector', () => {
  it('centre is zero', () => {
    expect(joystickVector(0, 0, 55)).toMatchObject({ x: 0, y: 0 });
  });
  it('maps axis extents to ±1', () => {
    expect(joystickVector(55, 0, 55).x).toBeCloseTo(1, 12);
    expect(joystickVector(0, 55, 55).y).toBeCloseTo(1, 12);
  });
  it('clamps offsets beyond the base radius to the unit circle', () => {
    const v = joystickVector(110, 0, 55); // twice the radius
    expect(v.x).toBeCloseTo(1, 12);
    expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1 + 1e-9);
  });
  it('preserves direction on the diagonal', () => {
    const v = joystickVector(100, 100, 55);
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 6);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 6);
  });
});

describe('combineInput — keyboard', () => {
  it('W climbs (pitch +1), S dives (pitch -1)', () => {
    expect(combineInput({ KeyW: true }).pitch).toBe(1);
    expect(combineInput({ KeyS: true }).pitch).toBe(-1);
  });
  it('D rolls right (+1), A rolls left (-1)', () => {
    expect(combineInput({ KeyD: true }).roll).toBe(1);
    expect(combineInput({ KeyA: true }).roll).toBe(-1);
  });
  it('Shift boosts, Space flaps', () => {
    expect(combineInput({ ShiftLeft: true }).boost).toBe(true);
    expect(combineInput({ ShiftRight: true }).boost).toBe(true);
    expect(combineInput({ Space: true }).flap).toBe(true);
  });
  it('opposing keys cancel', () => {
    expect(combineInput({ KeyW: true, KeyS: true }).pitch).toBe(0);
    expect(combineInput({ KeyA: true, KeyD: true }).roll).toBe(0);
  });
});

describe('combineInput — touch + pointer', () => {
  it('joystick up (negative y) climbs like W', () => {
    expect(combineInput({}, { joyY: -1 }).pitch).toBe(1);
  });
  it('joystick x drives roll', () => {
    expect(combineInput({}, { joyX: 0.5 }).roll).toBeCloseTo(0.5, 12);
  });
  it('touch buttons map to boost/flap/breathing', () => {
    expect(combineInput({}, { boost: true }).boost).toBe(true);
    expect(combineInput({}, { climb: true }).flap).toBe(true);
    expect(combineInput({}, { fire: true }).breathing).toBe(true);
    expect(combineInput({}, {}, { down: true }).breathing).toBe(true);
  });
});

describe('combineInput — keyboard + touch combine and clamp', () => {
  it('sums keyboard and joystick then clamps to [-1, 1]', () => {
    // KeyD (+1) plus full-right joystick (+1) must clamp to 1, not 2
    expect(combineInput({ KeyD: true }, { joyX: 1 }).roll).toBe(1);
    // KeyW (+1) plus full-up joystick (joyY -1 -> +1) clamps to 1
    expect(combineInput({ KeyW: true }, { joyY: -1 }).pitch).toBe(1);
  });
  it('default states produce a neutral signal', () => {
    expect(combineInput(createKeyState(), createTouchState())).toEqual({
      pitch: 0,
      roll: 0,
      boost: false,
      flap: false,
      breathing: false,
    });
  });
});
