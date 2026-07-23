import * as THREE from 'three';
import { getPalette, DEFAULT_COLOR } from '../core/palette.js';

// Procedural, animation-light dragon. Everything is static geometry except the
// wings (flap on rotation.x) and jaw (opens on rotation.z) — no skeleton, no rig.
// Shaped to read as a lean, winged dragon in silhouette: a tapered serpentine
// body, a curved neck, a snouted horned head, a dorsal spine ridge, big bat
// wings with finger bones, a long tapering finned tail, and tucked hind legs.
//
// Returns { group, wingL, wingR, jaw, applyColor }.
export function buildDragon(colorKey = DEFAULT_COLOR) {
  const group = new THREE.Group();
  const pal = getPalette(colorKey);

  const scaleMat = new THREE.MeshStandardMaterial({ color: pal.scale, roughness: 0.55, flatShading: true });
  const bellyMat = new THREE.MeshStandardMaterial({ color: pal.belly, roughness: 0.7, flatShading: true });
  const wingMat = new THREE.MeshStandardMaterial({ color: pal.wing, roughness: 0.8, side: THREE.DoubleSide, flatShading: true });
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffe08a, emissive: 0xff7a1a, emissiveIntensity: 1.4, flatShading: true });

  // ---------- body: tapering segments, widest at the chest, thinning to the tail ----------
  // (a lean, elongated form — not a round blob)
  const bodySegs = [
    { x: 1.5, r: 1.05, s: [1.0, 0.9, 1.05] },
    { x: 0.5, r: 1.28, s: [1.0, 0.95, 1.08] }, // chest (widest)
    { x: -0.6, r: 1.12, s: [1.1, 0.85, 0.98] },
    { x: -1.7, r: 0.85, s: [1.2, 0.8, 0.88] },
    { x: -2.7, r: 0.58, s: [1.25, 0.78, 0.8] }, // tail root
  ];
  for (const seg of bodySegs) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(seg.r, 10, 8), scaleMat);
    m.scale.set(...seg.s);
    m.position.set(seg.x, 0, 0);
    m.castShadow = true;
    group.add(m);
  }
  // pale belly underside
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1.05, 10, 8), bellyMat);
  belly.scale.set(2.2, 0.5, 0.92);
  belly.position.set(0.1, -0.62, 0);
  group.add(belly);

  // ---------- neck: an upward S-curve tube carrying the head clear of the body ----------
  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.5, 0.5, 0),
    new THREE.Vector3(2.6, 1.1, 0),
    new THREE.Vector3(3.6, 1.75, 0),
    new THREE.Vector3(4.45, 2.05, 0),
  ]);
  const neck = new THREE.Mesh(new THREE.TubeGeometry(neckCurve, 14, 0.5, 6), scaleMat);
  neck.castShadow = true;
  group.add(neck);

  // ---------- head ----------
  const head = new THREE.Group();
  head.position.set(4.5, 2.1, 0);

  const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.58, 10, 8), scaleMat);
  cranium.scale.set(1.15, 1.0, 1.05);
  cranium.position.set(0.05, 0.08, 0);
  head.add(cranium);

  const snout = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.7, 6), scaleMat);
  snout.rotation.z = -Math.PI / 2; // taper points forward (+X)
  snout.position.set(1.05, 0.02, 0);
  head.add(snout);

  for (const zs of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), eyeMat);
    eye.position.set(0.5, 0.26, 0.32 * zs);
    head.add(eye);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.6, 5), bellyMat);
    horn.position.set(-0.25, 0.5, 0.3 * zs);
    horn.rotation.z = 0.8; // sweep back
    horn.rotation.x = -0.35 * zs; // splay outward
    head.add(horn);
  }

  // lower jaw — hinged Group; the loop opens it on rotation.z
  const jaw = new THREE.Group();
  jaw.position.set(0.2, -0.2, 0);
  const jawMesh = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.5, 5), bellyMat);
  jawMesh.rotation.z = -Math.PI / 2;
  jawMesh.position.set(0.82, -0.02, 0);
  jaw.add(jawMesh);
  head.add(jaw);

  group.add(head);

  // ---------- dorsal spine ridge (neck -> back -> tail), tallest over the chest ----------
  function addSpike(x, y, z, size, lean = 0.4) {
    const s = new THREE.Mesh(new THREE.ConeGeometry(size * 0.32, size, 4), wingMat);
    s.position.set(x, y, z);
    s.rotation.z = lean; // lean toward the tail
    group.add(s);
  }
  addSpike(2.5, 1.35, 0, 0.55);
  addSpike(1.4, 1.2, 0, 0.85);
  addSpike(0.4, 1.35, 0, 1.0);
  addSpike(-0.6, 1.15, 0, 0.9);
  addSpike(-1.6, 0.9, 0, 0.7);
  addSpike(-2.6, 0.62, 0, 0.5);

  // ---------- tail: long tapering cone (continues the body) + spikes + a fin ----------
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.6, 5.2, 6), scaleMat);
  tail.rotation.z = Math.PI / 2; // point backward (-X)
  tail.position.set(-5.1, -0.05, 0);
  tail.castShadow = true;
  group.add(tail);

  addSpike(-3.5, 0.42, 0, 0.42);
  addSpike(-4.5, 0.28, 0, 0.34);
  addSpike(-5.5, 0.16, 0, 0.27);

  const finShape = new THREE.Shape();
  finShape.moveTo(0, 0.9);
  finShape.lineTo(0.6, -0.1);
  finShape.lineTo(0.1, -1.5);
  finShape.lineTo(-0.5, -0.1);
  finShape.lineTo(0, 0.9);
  const tailFin = new THREE.Mesh(new THREE.ShapeGeometry(finShape), wingMat);
  tailFin.position.set(-7.6, -0.15, 0);
  group.add(tailFin);

  // ---------- wings: big bat-style membrane + finger bones, flapping as a group ----------
  function boneBetween(a, b, r, mat) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 0.5, len, 5), mat);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    m.position.copy(a).addScaledVector(dir, 0.5);
    return m;
  }
  const wingPts = [
    [6.2, 1.75],
    [7.8, 0.15],
    [4.6, -2.3],
  ];
  function makeWing() {
    const wing = new THREE.Group();
    // membrane authored in XY (span +X, chord Y), reoriented to lie flat in XZ and
    // span +Z; hinging the group on rotation.x flaps it up/down. Shape (x,y) maps
    // to world (y, 0, x) after the reorientation.
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(wingPts[0][0], wingPts[0][1]);
    shape.lineTo(wingPts[1][0], wingPts[1][1]);
    shape.lineTo(wingPts[2][0], wingPts[2][1]);
    shape.lineTo(1.75, -1.5);
    shape.lineTo(0, 0);
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(-Math.PI / 2);
    geo.rotateY(-Math.PI / 2);
    const membrane = new THREE.Mesh(geo, wingMat);
    membrane.castShadow = true;
    wing.add(membrane);
    const root = new THREE.Vector3(0, 0, 0);
    for (const [sx, sy] of wingPts) {
      wing.add(boneBetween(root, new THREE.Vector3(sy, 0.02, sx), 0.11, scaleMat));
    }
    return wing;
  }
  const wingL = makeWing();
  wingL.position.set(-0.2, 0.75, 0.9);
  group.add(wingL);

  const wingR = makeWing();
  wingR.position.set(-0.2, 0.75, -0.9);
  wingR.scale.z = -1; // mirror (loop feeds it the opposite-signed flap)
  group.add(wingR);

  // ---------- tucked hind legs ----------
  for (const zs of [-1, 1]) {
    const thigh = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), scaleMat);
    thigh.scale.set(1.2, 0.9, 0.8);
    thigh.position.set(-0.9, -0.65, 0.95 * zs);
    group.add(thigh);

    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.14, 1.0, 5), scaleMat);
    shin.position.set(-1.45, -1.0, 1.0 * zs);
    shin.rotation.z = 0.7;
    group.add(shin);

    const foot = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.5, 4), bellyMat);
    foot.rotation.z = -Math.PI / 2; // claws forward
    foot.position.set(-1.95, -1.28, 1.0 * zs);
    group.add(foot);
  }

  function applyColor(key) {
    const p = getPalette(key);
    scaleMat.color.setHex(p.scale);
    bellyMat.color.setHex(p.belly);
    wingMat.color.setHex(p.wing);
  }

  return { group, wingL, wingR, jaw, applyColor };
}
