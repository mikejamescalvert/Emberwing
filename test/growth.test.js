import { describe, it, expect } from 'vitest';
import { GROWTH, maxStage, stageForXp, scaleForStage, breathForStage, stageName, growthProgress } from '../src/core/growth.js';

describe('stageForXp', () => {
  it('maps xp to the reached stage at the boundaries', () => {
    expect(stageForXp(0)).toBe(0);
    expect(stageForXp(7)).toBe(0);
    expect(stageForXp(8)).toBe(1);
    expect(stageForXp(19)).toBe(1);
    expect(stageForXp(20)).toBe(2);
    expect(stageForXp(70)).toBe(maxStage());
    expect(stageForXp(9999)).toBe(maxStage());
  });
});

describe('per-stage tables', () => {
  it('scale strictly increases with stage and clamps out of range', () => {
    expect(scaleForStage(0)).toBe(GROWTH.scales[0]);
    expect(scaleForStage(99)).toBe(GROWTH.scales[maxStage()]);
    for (let s = 1; s <= maxStage(); s++) expect(scaleForStage(s)).toBeGreaterThan(scaleForStage(s - 1));
  });
  it('breath damage strictly increases with stage', () => {
    for (let s = 1; s <= maxStage(); s++) {
      expect(breathForStage(s).damage).toBeGreaterThan(breathForStage(s - 1).damage);
    }
  });
  it('names line up and clamp', () => {
    expect(stageName(0)).toBe('Hatchling');
    expect(stageName(maxStage())).toBe('Elder');
    expect(stageName(99)).toBe('Elder');
  });
});

describe('growthProgress', () => {
  it('reports the fill ratio within the current stage', () => {
    const p = growthProgress(4); // stage 0 spans [0,8)
    expect(p.stage).toBe(0);
    expect(p.isMax).toBe(false);
    expect(p.ratio).toBeCloseTo(4 / 8, 12);
  });
  it('is full and flagged at max stage', () => {
    const p = growthProgress(1000);
    expect(p.isMax).toBe(true);
    expect(p.ratio).toBe(1);
    expect(p.name).toBe('Elder');
  });
  it('ratio always stays within [0,1]', () => {
    for (const xp of [0, 3, 8, 15, 20, 39, 40, 70, 200]) {
      const r = growthProgress(xp).ratio;
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
    }
  });
});
