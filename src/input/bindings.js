// Thin DOM glue: wires keyboard, mouse, touch joystick, hold-buttons, the start
// screen, and the colour-picker swatches into plain state objects. All the
// actual mapping/normalization lives in the pure core/input module.
import { DRAGON_COLOR_ORDER, DRAGON_COLORS, DEFAULT_COLOR } from '../core/palette.js';
import { joystickVector } from '../core/input.js';

const JOY_RADIUS = 55;

export function setupInput({ onStart, onColor } = {}) {
  const keys = {};
  const touch = { joyX: 0, joyY: 0, fire: false, boost: false, climb: false };
  const pointer = { down: false };
  let started = false;
  let selected = DEFAULT_COLOR;

  window.addEventListener('keydown', (e) => {
    keys[e.code] = true;
  });
  window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
  });
  window.addEventListener('mousedown', () => {
    if (started) pointer.down = true;
  });
  window.addEventListener('mouseup', () => {
    pointer.down = false;
  });

  // --- colour picker swatches (generated from the palette so they stay in sync) ---
  const swatches = document.getElementById('swatches');
  for (const key of DRAGON_COLOR_ORDER) {
    const btn = document.createElement('button');
    btn.className = 'swatch' + (key === selected ? ' selected' : '');
    btn.style.background = '#' + DRAGON_COLORS[key].scale.toString(16).padStart(6, '0');
    btn.title = DRAGON_COLORS[key].name;
    const choose = (e) => {
      e.stopPropagation(); // don't let a swatch tap start the game
      selected = key;
      for (const c of swatches.children) c.classList.remove('selected');
      btn.classList.add('selected');
      onColor?.(key);
    };
    btn.addEventListener('click', choose);
    btn.addEventListener('touchend', choose, { passive: false });
    swatches.appendChild(btn);
  }
  onColor?.(selected);

  // --- start ---
  const startScreen = document.getElementById('startScreen');
  function begin() {
    if (started) return;
    started = true;
    startScreen.hidden = true;
    document.getElementById('hud').hidden = false;
    onStart?.(selected);
  }
  startScreen.addEventListener('click', begin);
  startScreen.addEventListener('touchend', (e) => {
    e.preventDefault();
    begin();
  });

  // --- touch joystick ---
  const joyBase = document.getElementById('joyBase');
  const joyKnob = document.getElementById('joyKnob');
  let joyId = null;
  function joyUpdate(t) {
    const r = joyBase.getBoundingClientRect();
    const v = joystickVector(t.clientX - (r.left + r.width / 2), t.clientY - (r.top + r.height / 2), JOY_RADIUS);
    joyKnob.style.transform = `translate(${v.px}px, ${v.py}px)`;
    touch.joyX = v.x;
    touch.joyY = v.y;
  }
  joyBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    joyId = t.identifier;
    joyUpdate(t);
  }, { passive: false });
  joyBase.addEventListener('touchmove', (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === joyId) joyUpdate(t);
  }, { passive: false });
  const joyRelease = (e) => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier === joyId) {
        joyId = null;
        touch.joyX = 0;
        touch.joyY = 0;
        joyKnob.style.transform = 'translate(0px, 0px)';
      }
    }
  };
  joyBase.addEventListener('touchend', joyRelease, { passive: false });
  joyBase.addEventListener('touchcancel', joyRelease, { passive: false });

  // --- hold buttons ---
  bindHold('fireBtn', () => { touch.fire = true; }, () => { touch.fire = false; });
  bindHold('boostBtn', () => { touch.boost = true; }, () => { touch.boost = false; });
  bindHold('climbBtn', () => { touch.climb = true; }, () => { touch.climb = false; });

  return { keys, touch, pointer, isStarted: () => started };
}

function bindHold(id, onDown, onUp) {
  const el = document.getElementById(id);
  el.addEventListener('touchstart', (e) => {
    e.preventDefault();
    el.classList.add('active');
    onDown();
  }, { passive: false });
  const up = (e) => {
    e.preventDefault();
    el.classList.remove('active');
    onUp();
  };
  el.addEventListener('touchend', up, { passive: false });
  el.addEventListener('touchcancel', up, { passive: false });
}
