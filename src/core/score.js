// Pure run score — no THREE, no DOM.

export const SCORE = {
  perEmberstone: 10,
  perKill: 25,
  perStage: 100,
};

/** Weighted run score from the tallies collected during a run. */
export function computeScore({ emberstone = 0, kills = 0, stage = 0 } = {}, cfg = SCORE) {
  return emberstone * cfg.perEmberstone + kills * cfg.perKill + stage * cfg.perStage;
}
