// Pure procedural-animation math for the dragon — no THREE, no DOM.
// The dragon is animation-light by design: a sine-driven wing-flap cycle and a
// jaw that opens while breathing. No skeleton, no rig.

export const WING = {
  restAmp: 0.55, // gliding flap amplitude (radians)
  flapAmp: 1.1, // active flap amplitude
};

/**
 * Wing hinge rotations (radians about the flap axis) from the flap phase.
 *
 * The right wing mesh is mirrored (scale.z = -1), which flips how a rotation
 * reads on that side, so the two wings must take OPPOSITE-signed values to move
 * in visual sync. Returning { left: s, right: -s } encodes exactly that.
 * (Known Issue #3 in legacy/README.md.)
 */
export function wingRotations(flapPhase, flapping, cfg = WING) {
  const amp = flapping ? cfg.flapAmp : cfg.restAmp;
  const s = Math.sin(flapPhase) * amp;
  return { left: s, right: -s };
}

/** Jaw hinge (radians) — opens slightly while breathing fire. */
export function jawOpen(breathing) {
  return breathing ? -0.4 : 0;
}
