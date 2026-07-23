import { describe, it, expect } from 'vitest';
import { DRAGON_COLORS, DRAGON_COLOR_ORDER, DEFAULT_COLOR, getPalette } from '../src/core/palette.js';

describe('dragon palette', () => {
  it('defines exactly the six brief colours', () => {
    expect(Object.keys(DRAGON_COLORS).sort()).toEqual(['black', 'blue', 'brown', 'green', 'red', 'white']);
    expect(DRAGON_COLOR_ORDER).toHaveLength(6);
    expect([...DRAGON_COLOR_ORDER].sort()).toEqual(['black', 'blue', 'brown', 'green', 'red', 'white']);
  });

  it('every palette has scale/belly/wing colours and a display name', () => {
    for (const key of DRAGON_COLOR_ORDER) {
      const p = DRAGON_COLORS[key];
      expect(typeof p.scale).toBe('number');
      expect(typeof p.belly).toBe('number');
      expect(typeof p.wing).toBe('number');
      expect(typeof p.name).toBe('string');
    }
  });

  it('getPalette returns the requested palette', () => {
    expect(getPalette('blue')).toBe(DRAGON_COLORS.blue);
  });

  it('getPalette falls back to the default for unknown keys', () => {
    expect(getPalette('chartreuse')).toBe(DRAGON_COLORS[DEFAULT_COLOR]);
    expect(getPalette(undefined)).toBe(DRAGON_COLORS[DEFAULT_COLOR]);
  });
});
