// HUD updater — decoupled from the render loop. The loop calls update() with a
// plain snapshot; this module only pokes cached DOM nodes. No game logic here.
export function createHud() {
  const el = {
    health: document.getElementById('healthFill'),
    breath: document.getElementById('breathFill'),
    speed: document.getElementById('speedVal'),
    alt: document.getElementById('altVal'),
    kills: document.getElementById('killCount'),
  };

  return {
    update({ health, breath, speed, altitude, kills }) {
      el.health.style.width = health + '%';
      el.breath.style.width = breath + '%';
      el.speed.textContent = speed;
      el.alt.textContent = altitude;
      el.kills.textContent = kills;
    },
  };
}
