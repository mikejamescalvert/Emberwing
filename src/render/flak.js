import * as THREE from 'three';
import { FLAK, spawnFlak, stepFlak, flakExpired, flakHitsDragon, withinRange, randomFireInterval } from '../core/flak.js';

// Wardstone flak: nearby wardstone sentinels lob slow, glowing projectiles at the
// dragon. Motion/aim/hit come from the (tested) core/flak module; this layer owns
// the meshes and a brief muzzle flash. No enemy rig — a moving sphere + a flash.
export function createFlakSystem(scene, rng) {
  const projectiles = []; // { mesh, pos, vel, life }
  const flashes = []; // { mesh, mat, life, ttl }
  const projGeo = new THREE.SphereGeometry(0.6, 6, 6);
  const projMat = new THREE.MeshBasicMaterial({ color: 0xff5a2a });
  const flashGeo = new THREE.SphereGeometry(1.4, 6, 6);
  const originV = new THREE.Vector3();

  function fire(ws, dragonPos) {
    ws.crystal.getWorldPosition(originV);
    const origin = { x: originV.x, y: originV.y, z: originV.z };
    const p = spawnFlak(origin, dragonPos);
    const mesh = new THREE.Mesh(projGeo, projMat);
    mesh.position.copy(originV);
    scene.add(mesh);
    projectiles.push({ mesh, pos: p.pos, vel: p.vel, life: p.life });

    // muzzle flash — a quick expanding, fading sphere
    const fmat = new THREE.MeshBasicMaterial({ color: 0xffb060, transparent: true, opacity: 0.9 });
    const flash = new THREE.Mesh(flashGeo, fmat);
    flash.position.copy(originV);
    scene.add(flash);
    flashes.push({ mesh: flash, mat: fmat, life: 0.25, ttl: 0.25 });
  }

  /**
   * Fire from ready wardstones (when `armed`), advance projectiles, and test them
   * against the dragon. Returns total damage dealt this frame.
   * @param {object} opts { sentinels, dragonPos, hitRadius, armed }
   */
  function update(dt, opts) {
    const { sentinels, dragonPos, hitRadius = FLAK.hitRadius, armed = true } = opts;

    for (const s of sentinels) {
      if (!s.alive || !s.isWardstone) continue;
      s.cooldown -= dt;
      if (s.cooldown <= 0) {
        if (armed && withinRange(s.pos, dragonPos)) fire(s, dragonPos);
        s.cooldown = randomFireInterval(rng);
      }
    }

    let damage = 0;
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const p = projectiles[i];
      const n = stepFlak(p, dt);
      p.pos = n.pos;
      p.vel = n.vel;
      p.life = n.life;
      p.mesh.position.set(n.pos.x, n.pos.y, n.pos.z);
      if (flakHitsDragon(p.pos, dragonPos, hitRadius)) {
        damage += FLAK.damage;
        removeProj(i);
        continue;
      }
      if (flakExpired(p)) removeProj(i);
    }

    for (let i = flashes.length - 1; i >= 0; i--) {
      const f = flashes[i];
      f.life -= dt;
      const t = Math.max(0, f.life / f.ttl);
      f.mesh.scale.setScalar(1 + (1 - t) * 2.5);
      f.mat.opacity = t * 0.9;
      if (f.life <= 0) {
        scene.remove(f.mesh);
        f.mat.dispose();
        flashes.splice(i, 1);
      }
    }
    return damage;
  }

  function removeProj(i) {
    scene.remove(projectiles[i].mesh);
    projectiles.splice(i, 1);
  }

  function clear() {
    for (const p of projectiles) scene.remove(p.mesh);
    projectiles.length = 0;
    for (const f of flashes) {
      scene.remove(f.mesh);
      f.mat.dispose();
    }
    flashes.length = 0;
  }

  return { update, clear, count: () => projectiles.length };
}
