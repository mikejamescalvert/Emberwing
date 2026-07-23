// Pure growth/progression logic — no THREE, no DOM.
// Absorbed emberstone (xp) advances the dragon through growth stages. Each stage
// scales the dragon up and upgrades its breath. This is the reward curve and the
// difficulty ramp in one.

import { clamp } from './mathUtils.js';

export const GROWTH = {
  // Cumulative xp required to REACH each stage (index === stage).
  thresholds: [0, 8, 20, 40, 70],
  names: ['Hatchling', 'Fledgling', 'Drake', 'Wyrm', 'Elder'],
  scales: [1.0, 1.25, 1.55, 1.9, 2.3],
  // Breath upgrade per stage (consumed by the fire system).
  breath: [
    { damage: 14, spread: 0.3, life: 0.9 },
    { damage: 18, spread: 0.38, life: 1.02 },
    { damage: 24, spread: 0.46, life: 1.16 },
    { damage: 32, spread: 0.55, life: 1.32 },
    { damage: 42, spread: 0.66, life: 1.5 },
  ],
};

export function maxStage(cfg = GROWTH) {
  return cfg.thresholds.length - 1;
}

/** Highest stage whose xp threshold has been reached. */
export function stageForXp(xp, cfg = GROWTH) {
  let stage = 0;
  for (let i = 0; i < cfg.thresholds.length; i++) {
    if (xp >= cfg.thresholds[i]) stage = i;
  }
  return stage;
}

export function scaleForStage(stage, cfg = GROWTH) {
  return cfg.scales[clamp(stage, 0, maxStage(cfg))];
}

export function breathForStage(stage, cfg = GROWTH) {
  return cfg.breath[clamp(stage, 0, maxStage(cfg))];
}

export function stageName(stage, cfg = GROWTH) {
  return cfg.names[clamp(stage, 0, maxStage(cfg))];
}

/**
 * Progress info for the HUD growth meter.
 * @returns {{stage:number, name:string, isMax:boolean, into:number, needed:number, ratio:number}}
 */
export function growthProgress(xp, cfg = GROWTH) {
  const stage = stageForXp(xp, cfg);
  const isMax = stage >= maxStage(cfg);
  const base = cfg.thresholds[stage];
  const into = xp - base;
  const needed = isMax ? 0 : cfg.thresholds[stage + 1] - base;
  const ratio = isMax || needed === 0 ? 1 : clamp(into / needed, 0, 1);
  return { stage, name: stageName(stage, cfg), isMax, into, needed, ratio };
}
