// HUD updater — decoupled from the render loop. The loop calls update() with a
// plain snapshot; this module only pokes cached DOM nodes. No game logic here.
export function createHud() {
  const el = {
    health: document.getElementById('healthFill'),
    breath: document.getElementById('breathFill'),
    growth: document.getElementById('growthFill'),
    stage: document.getElementById('stageName'),
    speed: document.getElementById('speedVal'),
    alt: document.getElementById('altVal'),
    kills: document.getElementById('killCount'),
  };

  return {
    update({ health, breath, speed, altitude, kills, growth, stageName }) {
      el.health.style.width = health + '%';
      el.breath.style.width = breath + '%';
      el.growth.style.width = growth * 100 + '%';
      el.stage.textContent = stageName;
      el.speed.textContent = speed;
      el.alt.textContent = altitude;
      el.kills.textContent = kills;
    },
  };
}
