import * as THREE from 'three';
import { spawnBurst, stepMote, moteExpired, moteCollected } from '../core/emberstone.js';

// Glowing emberstone motes. Motion/pickup come from the (tested) core module;
// this layer owns the Three.js meshes. Fly the dragon through a mote to absorb it.
export function createEmberstoneField(scene, rng) {
  const motes = []; // { mesh, mat, pos, vel, life }
  const geo = new THREE.OctahedronGeometry(0.5, 0); // shared across motes

  function burst(origin) {
    for (const m of spawnBurst(origin, rng)) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.95 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(m.pos.x, m.pos.y, m.pos.z);
      scene.add(mesh);
      motes.push({ mesh, mat, pos: m.pos, vel: m.vel, life: m.life });
    }
  }

  /** Advance motes; absorb any within pickupRadius of the dragon. Returns count collected. */
  function update(dt, dragonPos, pickupRadius) {
    let collected = 0;
    for (let i = motes.length - 1; i >= 0; i--) {
      const m = motes[i];
      const n = stepMote(m, dt);
      m.pos = n.pos;
      m.vel = n.vel;
      m.life = n.life;
      m.mesh.position.set(n.pos.x, n.pos.y, n.pos.z);
      m.mesh.rotation.y += dt * 3;
      m.mat.opacity = Math.min(0.95, m.life); // fade out in the last ~1s

      if (moteCollected(m.pos, dragonPos, pickupRadius)) {
        collected++;
        remove(i);
        continue;
      }
      if (moteExpired(m)) remove(i);
    }
    return collected;
  }

  function remove(i) {
    const m = motes[i];
    scene.remove(m.mesh);
    m.mat.dispose();
    motes.splice(i, 1);
  }

  return { burst, update, count: () => motes.length };
}
