import { describe, it, expect } from 'vitest';
import { vec3, clone, add, sub, scale, addScaled, length, distance, dot, normalize, lerpVec } from '../src/core/vec3.js';

describe('vec3 immutability (the anti-aliasing guarantee)', () => {
  it('scale returns a new vector and never mutates its input', () => {
    const v = vec3(1, 0, 0);
    const r = scale(v, 55);
    expect(v).toEqual({ x: 1, y: 0, z: 0 }); // untouched
    expect(r).toEqual({ x: 55, y: 0, z: 0 });
    expect(r).not.toBe(v);
  });

  it('add/sub/addScaled/normalize/lerpVec all leave inputs untouched', () => {
    const a = vec3(1, 2, 3);
    const b = vec3(4, 5, 6);
    const snapA = clone(a);
    const snapB = clone(b);
    add(a, b);
    sub(a, b);
    addScaled(a, b, 2);
    normalize(a);
    lerpVec(a, b, 0.5);
    expect(a).toEqual(snapA);
    expect(b).toEqual(snapB);
  });
});

describe('vec3 math', () => {
  it('add / sub / addScaled', () => {
    expect(add(vec3(1, 2, 3), vec3(4, 5, 6))).toEqual({ x: 5, y: 7, z: 9 });
    expect(sub(vec3(4, 5, 6), vec3(1, 2, 3))).toEqual({ x: 3, y: 3, z: 3 });
    expect(addScaled(vec3(1, 1, 1), vec3(2, 0, 0), 3)).toEqual({ x: 7, y: 1, z: 1 });
  });

  it('length / distance / dot', () => {
    expect(length(vec3(3, 4, 0))).toBe(5);
    expect(distance(vec3(0, 0, 0), vec3(0, 3, 4))).toBe(5);
    expect(dot(vec3(1, 2, 3), vec3(4, 5, 6))).toBe(32);
  });

  it('normalize yields a unit vector; zero-length stays zero', () => {
    expect(length(normalize(vec3(0, 5, 0)))).toBeCloseTo(1, 12);
    expect(normalize(vec3(0, 0, 0))).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('lerpVec interpolates componentwise', () => {
    expect(lerpVec(vec3(0, 0, 0), vec3(10, 20, 30), 0.5)).toEqual({ x: 5, y: 10, z: 15 });
  });
});
