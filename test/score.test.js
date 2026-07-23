import { describe, it, expect } from 'vitest';
import { SCORE, computeScore } from '../src/core/score.js';

describe('computeScore', () => {
  it('is zero for an empty run', () => {
    expect(computeScore()).toBe(0);
  });
  it('weights emberstone, kills, and stage', () => {
    expect(computeScore({ emberstone: 10, kills: 4, stage: 2 })).toBe(
      10 * SCORE.perEmberstone + 4 * SCORE.perKill + 2 * SCORE.perStage,
    );
  });
  it('each tally contributes independently', () => {
    expect(computeScore({ emberstone: 1 })).toBe(SCORE.perEmberstone);
    expect(computeScore({ kills: 1 })).toBe(SCORE.perKill);
    expect(computeScore({ stage: 1 })).toBe(SCORE.perStage);
  });
});
