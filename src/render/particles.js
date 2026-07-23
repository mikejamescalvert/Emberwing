import * as THREE from 'three';
import { COMBAT, isHit } from '../core/combat.js';

// Fire-breath particle system. The motion/decay/hit numbers come from the
// (tested) core/combat module; this layer only owns the Three.js meshes.
export function createFireSystem(scene) {
  const particles = [];
  const jawWorld = new THREE.Vector3();
  const forward = new THREE.Vector3();

  /** Spawn one ember at the jaw, flung along the dragon's facing. */
  function spawn(jaw, dragonQuat, dragonVel) {
    const geo = new THREE.SphereGeometry(0.35 + Math.random() * 0.3, 5, 5);
    const mat = new THREE.MeshBasicMaterial({
      color: Math.random() > 0.5 ? 0xff7b1a : 0xffcf5a,
      transparent: true,
      opacity: 0.9,
    });
    const p = new THREE.Mesh(geo, mat);

    jaw.getWorldPosition(jawWorld);
    p.position.copy(jawWorld);

    forward.set(1, 0, 0).applyQuaternion(dragonQuat);
    const spread = new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
      (Math.random() - 0.5) * 0.3,
    );
    // (forward + spread) * 1.4 + dragonVel * 0.3  — matches core/combat.spawnParticleVelocity
    const vel = forward.clone().add(spread).multiplyScalar(1.4).addScaledVector(dragonVel, 0.3);
    p.userData = { vel, life: COMBAT.particleLife };

    scene.add(p);
    particles.push(p);
  }

  /**
   * Advance all embers, fade them, and test them against live sentinels.
   * Calls onKill(sentinel) for each kill and returns the kill count this frame.
   */
  function update(dt, sentinels, onKill) {
    let kills = 0;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.position.addScaledVector(p.userData.vel, dt * COMBAT.particleSpeed);
      p.userData.life -= dt * COMBAT.particleFade;
      p.scale.setScalar(Math.max(0.1, p.userData.life));
      p.material.opacity = Math.max(0, p.userData.life);

      if (p.userData.life <= 0) {
        remove(i);
        continue;
      }
      for (const s of sentinels) {
        if (!s.alive) continue;
        if (isHit(p.position, s.pos)) {
          s.hp -= COMBAT.breathDamage;
          if (s.hp <= 0) {
            s.alive = false;
            kills++;
            onKill(s);
          }
          remove(i);
          break;
        }
      }
    }
    return kills;
  }

  function remove(i) {
    const p = particles[i];
    scene.remove(p);
    p.geometry.dispose();
    p.material.dispose();
    particles.splice(i, 1);
  }

  return { spawn, update };
}
