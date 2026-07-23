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
  it('Space is a climb alias (and stacks with W without exceeding +1)', () => {
    expect(combineInput({ Space: true }).pitch).toBe(1);
    expect(combineInput({ KeyW: true, Space: true }).pitch).toBe(1);
  });
  it('D turns right (+1), A turns left (-1)', () => {
    expect(combineInput({ KeyD: true }).roll).toBe(1);
    expect(combineInput({ KeyA: true }).roll).toBe(-1);
  });
  it('Shift boosts', () => {
    expect(combineInput({ ShiftLeft: true }).boost).toBe(true);
    expect(combineInput({ ShiftRight: true }).boost).toBe(true);
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
  it('joystick right turns right (direct: right goes right)', () => {
    expect(combineInput({}, { joyX: 0.5 }).roll).toBeCloseTo(0.5, 12);
    expect(combineInput({}, { joyX: -1 }).roll).toBe(-1);
  });
  it('touch buttons map to boost/breathing', () => {
    expect(combineInput({}, { boost: true }).boost).toBe(true);
    expect(combineInput({}, { fire: true }).breathing).toBe(true);
    expect(combineInput({}, {}, { down: true }).breathing).toBe(true);
  });
});

describe('combineInput — keyboard + touch combine and clamp', () => {
  it('sums keyboard and joystick then clamps to [-1, 1]', () => {
    expect(combineInput({ KeyD: true }, { joyX: 1 }).roll).toBe(1);
    expect(combineInput({ KeyW: true }, { joyY: -1 }).pitch).toBe(1);
  });
  it('default states produce a neutral signal', () => {
    expect(combineInput(createKeyState(), createTouchState())).toEqual({
      pitch: 0,
      roll: 0,
      boost: false,
      breathing: false,
    });
  });
});
