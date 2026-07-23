import * as THREE from 'three';
import { getPalette, DEFAULT_COLOR } from '../core/palette.js';

// Builds the procedural, animation-light dragon: stretched-sphere body, cone
// head/horns/tail, and flat membrane wings. The wing geometry is reoriented so
// it hinges up/down on rotation.x — the fix for Known Issue #3 (the prototype
// animated rotation.z on a flat XY panel, which just spun it in place).
//
// Returns handles the render loop drives each frame (wing/jaw rotations) plus an
// applyColor() to swap the palette from the start-screen picker.
export function buildDragon(colorKey = DEFAULT_COLOR) {
  const group = new THREE.Group();
  const pal = getPalette(colorKey);

  const scaleMat = new THREE.MeshStandardMaterial({ color: pal.scale, roughness: 0.6, flatShading: true });
  const bellyMat = new THREE.MeshStandardMaterial({ color: pal.belly, roughness: 0.7, flatShading: true });
  const wingMat = new THREE.MeshStandardMaterial({ color: pal.wing, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });

  // body — stretched sphere (long axis along +X = forward)
  const body = new THREE.Mesh(new THREE.SphereGeometry(1.6, 12, 10), scaleMat);
  body.scale.set(2.4, 1, 1);
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 10), bellyMat);
  belly.scale.set(2.3, 1, 1);
  belly.position.y = -0.6;
  group.add(belly);

  // neck + head
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.3, 2.4, 6), scaleMat);
  neck.position.set(3, 0.6, 0);
  neck.rotation.z = -0.5;
  group.add(neck);

  const head = new THREE.Group();
  head.position.set(4.3, 1.5, 0);
  const skull = new THREE.Mesh(new THREE.ConeGeometry(0.9, 2.2, 6), scaleMat);
  skull.rotation.z = -Math.PI / 2;
  head.add(skull);
  const jaw = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.4, 5), bellyMat);
  jaw.rotation.z = -Math.PI / 2;
  jaw.position.set(0.3, -0.35, 0);
  head.add(jaw);
  for (const zOff of [-0.4, 0.4]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.15, 1, 4), bellyMat);
    horn.position.set(-0.3, 0.6, zOff);
    horn.rotation.z = Math.PI / 6;
    head.add(horn);
  }
  group.add(head);

  // wings — flat membrane authored in the XY plane, then reoriented so the span
  // runs along +Z (sideways) and the panel lies flat in XZ. Hinging on rotation.x
  // now raises/lowers the wingtip (a real flap). The right wing is mirrored via
  // scale.z = -1, so the loop feeds it the opposite-signed rotation (see
  // core/dragonAnim.wingRotations).
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(4.5, 1.2);
  wingShape.lineTo(5.5, -0.5);
  wingShape.lineTo(3.5, -1.8);
  wingShape.lineTo(1.5, -1.2);
  wingShape.lineTo(0, 0);
  const wingGeo = new THREE.ShapeGeometry(wingShape);
  wingGeo.rotateX(-Math.PI / 2); // lay flat in XZ (surface normal now +Y)
  wingGeo.rotateY(-Math.PI / 2); // span now runs along +Z

  const wingL = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.set(-0.3, 0.5, 0.6);
  wingL.castShadow = true;
  group.add(wingL);

  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingR.position.set(-0.3, 0.5, -0.6);
  wingR.scale.z = -1; // mirror
  wingR.castShadow = true;
  group.add(wingR);

  // tail
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.9, 5, 6), scaleMat);
  tail.rotation.z = Math.PI / 2;
  tail.position.set(-4.5, -0.2, 0);
  group.add(tail);

  function applyColor(key) {
    const p = getPalette(key);
    scaleMat.color.setHex(p.scale);
    bellyMat.color.setHex(p.belly);
    wingMat.color.setHex(p.wing);
  }

  return { group, wingL, wingR, jaw, applyColor };
}
