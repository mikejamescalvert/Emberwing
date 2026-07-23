import * as THREE from 'three';
import './styles.css';

import { createFlightState, stepFlight, dragonOrientation, flightReadouts } from './core/flight.js';
import { combineInput } from './core/input.js';
import { CAMERA, desiredCameraPosition, desiredLookTarget, followFactor } from './core/camera.js';
import { ridgeNoise, makeRng } from './core/world.js';
import { wingRotations, jawOpen } from './core/dragonAnim.js';
import { COMBAT, stepBreath } from './core/combat.js';
import { EMBERSTONE } from './core/emberstone.js';
import { stageForXp, scaleForStage, breathForStage, growthProgress } from './core/growth.js';
import { FLAK } from './core/flak.js';
import { createVitality, damageVitality, stepVitality, isDead } from './core/vitality.js';
import { computeScore } from './core/score.js';
import { DEFAULT_COLOR } from './core/palette.js';
import { buildDragon } from './render/dragon.js';
import { addLighting, buildTerrain, buildSentinels } from './render/scene.js';
import { createFireSystem } from './render/particles.js';
import { createEmberstoneField } from './render/emberstone.js';
import { createFlakSystem } from './render/flak.js';
import { createHud } from './render/hud.js';
import { setupInput } from './input/bindings.js';

// --- Visible failure path (mobile has no console; a blank canvas is the worst case) ---
const errorBanner = document.getElementById('errorBanner');
function showError(msg) {
  errorBanner.style.display = 'block';
  errorBanner.textContent = 'EMBERWING FAILED TO START\n\n' + msg + '\n\nUA: ' + navigator.userAgent;
}
window.addEventListener('error', (e) =>
  showError((e.message || 'Unknown error') + '\nat ' + (e.filename || '') + ':' + (e.lineno || '')),
);
window.addEventListener('unhandledrejection', (e) => showError('Promise rejection: ' + e.reason));

try {
  main();
} catch (e) {
  showError((e.message || e) + (e.stack ? '\n\n' + e.stack : ''));
}

function main() {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1235);
  scene.fog = new THREE.FogExp2(0x2a1f4a, 0.0032);

  const camera = new THREE.PerspectiveCamera(CAMERA.fov, window.innerWidth / window.innerHeight, CAMERA.near, CAMERA.far);
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  addLighting(scene);

  // Seeded world so every session is reproducible (and matches tests).
  const rng = makeRng(1337);
  buildTerrain(scene, rng);
  let sentinels = buildSentinels(scene, rng, 14);

  const dragon = buildDragon(DEFAULT_COLOR);
  scene.add(dragon.group);

  const fire = createFireSystem(scene);
  const ember = createEmberstoneField(scene, rng);
  const flak = createFlakSystem(scene, rng);
  const hud = createHud();

  // --- game state ---
  let flight = createFlightState();
  let vitality = createVitality();
  const game = { breath: COMBAT.breathMax, kills: 0, xp: 0, stage: 0, over: false };

  // Apply a growth stage: scale the dragon and upgrade its breath.
  function setStage(stage) {
    game.stage = stage;
    dragon.group.scale.setScalar(scaleForStage(stage));
    fire.setBreath(breathForStage(stage));
  }
  setStage(0);

  const input = setupInput({
    onColor: (key) => dragon.applyColor(key),
  });

  // initial placement
  syncDragon();
  const startCam = desiredCameraPosition(flight.pos, flight.forward);
  camera.position.set(startCam.x, startCam.y, startCam.z);
  const lookTarget = new THREE.Vector3();
  const startLook = desiredLookTarget(flight.pos, flight.forward);
  lookTarget.set(startLook.x, startLook.y, startLook.z);
  camera.lookAt(lookTarget);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  const scratch = new THREE.Vector3();
  let last = performance.now();

  function syncDragon() {
    dragon.group.position.set(flight.pos.x, flight.pos.y, flight.pos.z);
    const o = dragonOrientation(flight);
    dragon.group.rotation.set(o.x, o.y, o.z);
  }

  function respawnLater(dead) {
    scene.remove(dead.group);
    dead.group.traverse((o) => o.geometry?.dispose());
    window.setTimeout(() => {
      const i = sentinels.indexOf(dead);
      if (i >= 0) sentinels.splice(i, 1);
      sentinels = sentinels.concat(buildSentinels(scene, rng, 1));
    }, COMBAT.respawnDelayMs);
  }

  // On a kill: shatter the sentinel into emberstone, then respawn one elsewhere.
  function onKill(dead) {
    ember.burst(dead.pos);
    respawnLater(dead);
  }

  // --- run over / restart ---
  const gameOverEl = document.getElementById('gameOver');
  const objectiveEl = document.getElementById('objective');
  function showGameOver() {
    const score = computeScore({ emberstone: game.xp, kills: game.kills, stage: game.stage });
    document.getElementById('finalScore').textContent = score;
    document.getElementById('finalStage').textContent = growthProgress(game.xp).name;
    document.getElementById('finalKills').textContent = game.kills;
    document.getElementById('finalEmber').textContent = game.xp;
    gameOverEl.hidden = false;
  }
  function endRun() {
    if (game.over) return;
    game.over = true;
    showGameOver();
  }
  function resetRun() {
    flight = createFlightState();
    vitality = createVitality();
    game.breath = COMBAT.breathMax;
    game.kills = 0;
    game.xp = 0;
    game.over = false;
    setStage(0);
    fire.clear();
    ember.clear();
    flak.clear();
    for (const s of sentinels) scene.remove(s.group);
    sentinels = buildSentinels(scene, rng, 14);
    syncDragon();
    gameOverEl.hidden = true;
  }
  const restartBtn = document.getElementById('restartBtn');
  restartBtn.addEventListener('click', resetRun);
  restartBtn.addEventListener('touchend', (e) => {
    e.preventDefault();
    resetRun();
  });

  function step(dt) {
    if (input.isStarted() && !game.over) {
      const signal = combineInput(input.keys, input.touch, input.pointer);
      flight = stepFlight(flight, signal, dt, ridgeNoise);
      syncDragon();

      const stageScale = scaleForStage(game.stage);

      // wings + jaw (procedural, animation-light)
      const wings = wingRotations(flight.flapPhase, signal.flap);
      dragon.wingL.rotation.x = wings.left;
      dragon.wingR.rotation.x = wings.right;
      dragon.jaw.rotation.y = jawOpen(signal.breathing);

      // breath resource + fire
      const canBreathe = signal.breathing && game.breath > 0;
      game.breath = stepBreath(game.breath, signal.breathing, dt).breath;
      if (canBreathe) fire.spawn(dragon.jaw, dragon.group.quaternion, flight.velocity);
      game.kills += fire.update(dt, sentinels, onKill);

      // emberstone: burned sentinels drop motes; fly through them to grow
      const gained = ember.update(dt, dragon.group.position, EMBERSTONE.pickupRadius * stageScale);
      if (gained > 0) {
        game.xp += gained * EMBERSTONE.xpPerMote;
        const nextStage = stageForXp(game.xp);
        if (nextStage !== game.stage) setStage(nextStage);
      }

      // wardstone flak + vitality (flak arms once you've grown past hatchling)
      const flakDamage = flak.update(dt, {
        sentinels,
        dragonPos: dragon.group.position,
        hitRadius: FLAK.hitRadius * stageScale,
        armed: game.stage >= 1,
      });
      if (flakDamage > 0) vitality = damageVitality(vitality, flakDamage);
      vitality = stepVitality(vitality, dt);
      if (isDead(vitality)) endRun();

      // camera (constant follow distance; pulls back as the dragon grows)
      const f = followFactor(dt);
      const camPos = desiredCameraPosition(flight.pos, flight.forward, CAMERA, stageScale);
      camera.position.lerp(scratch.set(camPos.x, camPos.y, camPos.z), f);
      const look = desiredLookTarget(flight.pos, flight.forward, CAMERA, stageScale);
      lookTarget.lerp(scratch.set(look.x, look.y, look.z), f);
      camera.lookAt(lookTarget);

      // sentinels bob + spin
      for (const s of sentinels) {
        s.spinSeed += dt;
        s.crystal.rotation.y = s.spinSeed * 0.8;
        s.crystal.position.y = 3.5 + Math.sin(s.spinSeed * 1.5) * 0.3;
      }

      const readouts = flightReadouts(flight);
      const prog = growthProgress(game.xp);
      hud.update({
        health: vitality.hp,
        breath: game.breath,
        speed: readouts.speed,
        altitude: readouts.altitude,
        kills: game.kills,
        growth: prog.ratio,
        stageName: prog.name,
      });

      // onboarding objective fades once the first sentinel falls
      objectiveEl.style.opacity = game.kills === 0 ? '1' : '0';
    }

    renderer.render(scene, camera);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    step(dt);
  }
  requestAnimationFrame(frame);

  // Dev-only inspection hook for smoke-testing the loop headlessly.
  // Stripped from production builds (import.meta.env.DEV is false there).
  if (import.meta.env.DEV) {
    window.__emberwing = {
      start: () => document.getElementById('startScreen').click(),
      press: (code, down = true) => {
        input.keys[code] = down;
      },
      // Advance the sim `n` fixed steps of `dt` — decoupled from rAF so the loop
      // can be smoke-tested even when the preview pane isn't compositing frames.
      tick: (dt = 0.05, n = 1) => {
        for (let i = 0; i < n; i++) step(dt);
        return window.__emberwing.snapshot();
      },
      addXp: (n) => {
        game.xp += n;
        const s = stageForXp(game.xp);
        if (s !== game.stage) setStage(s);
        return window.__emberwing.snapshot();
      },
      burstHere: () => ember.burst({ ...dragon.group.position }),
      damage: (n) => {
        vitality = damageVitality(vitality, n);
        if (isDead(vitality)) endRun();
        return window.__emberwing.snapshot();
      },
      restart: () => {
        resetRun();
        return window.__emberwing.snapshot();
      },
      snapshot: () => ({
        started: input.isStarted(),
        over: game.over,
        pos: { x: flight.pos.x, y: flight.pos.y, z: flight.pos.z },
        speed: flight.speed,
        yaw: flight.yaw,
        flapPhase: flight.flapPhase,
        wingL: dragon.wingL.rotation.x,
        wingR: dragon.wingR.rotation.x,
        cam: camera.position.toArray(),
        health: vitality.hp,
        breath: game.breath,
        kills: game.kills,
        xp: game.xp,
        stage: game.stage,
        dragonScale: dragon.group.scale.x,
        motes: ember.count(),
        flak: flak.count(),
        sentinels: sentinels.length,
        sceneChildren: scene.children.length,
      }),
    };
  }
}
