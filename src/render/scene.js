import * as THREE from 'three';
import { ridgeNoise, scatter } from '../core/world.js';
import { createSentinel } from '../core/combat.js';

/** Dusk lighting. Returns the sun so callers can tweak/track it if needed. */
export function addLighting(scene) {
  scene.add(new THREE.HemisphereLight(0x8a7fd9, 0x2a1f1a, 0.9));
  const sun = new THREE.DirectionalLight(0xffb877, 1.2);
  sun.position.set(200, 300, 100);
  sun.castShadow = true;
  sun.shadow.camera.left = -300;
  sun.shadow.camera.right = 300;
  sun.shadow.camera.top = 300;
  sun.shadow.camera.bottom = -300;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);
  return sun;
}

/** Displaced-plane terrain + scattered ruin pillars (placement via seeded rng). */
export function buildTerrain(scene, rng) {
  const size = 2000;
  const seg = 120;
  const geo = new THREE.PlaneGeometry(size, size, seg, seg);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, ridgeNoise(pos.getX(i), pos.getZ(i)));
  geo.computeVertexNormals();
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x33294a, roughness: 1, flatShading: true }));
  ground.receiveShadow = true;
  scene.add(ground);

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x4a3d5c, flatShading: true, roughness: 0.9 });
  for (const { x, z } of scatter(rng, 40, 1600)) {
    const h = ridgeNoise(x, z);
    const height = 15 + rng() * 40;
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(2 + rng() * 2, 3 + rng() * 2, height, 6), pillarMat);
    pillar.position.set(x, h + height / 2, z);
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  }
}

/**
 * Stationary crystal sentinels. Each returned object pairs the Three.js group
 * with the (pure) combat state the fire system reads/writes: { group, crystal,
 * pos, alive, hp, spinSeed }.
 */
export function buildSentinels(scene, rng, count) {
  const sentinels = [];
  for (const { x, z } of scatter(rng, count, 1400)) {
    const groundY = ridgeNoise(x, z);
    const group = new THREE.Group();

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 3, 3, 6),
      new THREE.MeshStandardMaterial({ color: 0x3d3550, flatShading: true }),
    );
    group.add(base);

    const crystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(2.2, 0),
      new THREE.MeshStandardMaterial({ color: 0x5ecbe0, emissive: 0x1a6a80, flatShading: true }),
    );
    crystal.position.y = 3.5;
    group.add(crystal);

    group.position.set(x, groundY + 1.5, z);
    scene.add(group);
    sentinels.push({ group, crystal, pos: group.position, ...createSentinel(), spinSeed: rng() * 10 });
  }
  return sentinels;
}
