import * as THREE from 'three';

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

// Minimal smoke scene — proves the Three.js/Vite toolchain end to end.
// Real modules (flight, input, camera, dragon, world, combat, HUD) land in
// subsequent commits and replace this bootstrap.
try {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1235);
  scene.fog = new THREE.FogExp2(0x2a1f4a, 0.0032);

  const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 3000);
  camera.position.set(-9, 43, 0);
  camera.lookAt(0, 40, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  document.body.appendChild(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0x8a7fd9, 0x2a1f1a, 0.9));

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();
} catch (e) {
  showError((e.message || e) + (e.stack ? '\n\n' + e.stack : ''));
}
