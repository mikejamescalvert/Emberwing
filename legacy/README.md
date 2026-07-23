# Legacy prototypes (archived reference)

This folder preserves the original single-file Three.js prototype that Emberwing
grew out of, recovered from the **"Dragon RPG Game"** Google Drive folder. It is
kept for provenance and as the reference for the tuned flight / particle / colour
constants that were ported into [`/src`](../src).

> **Do not build on these files.** The real, modular, tested game lives in
> [`/src`](../src). This is a historical snapshot only.

## What's here

- **`prototype.html`** — a faithful reproduction of the **newest** Drive iteration
  (v3), plus a provenance header comment. This is the canonical "before" artifact.

## The three Drive iterations

All three were named `index.html` in the Drive folder. Only v3 is reproduced here;
the differences of v1/v2 are documented below (they are strictly predecessors).

| Iteration | Size (bytes) | Created (2026-07-19) | Notable |
|-----------|-------------:|----------------------|---------|
| v1        | 17,249       | 20:23                | Keyboard-only; `CapsuleGeometry` body; yaw-only chase cam; no error banner |
| v2        | 22,692       | 20:26                | Adds touch joystick + boost/climb/fire buttons; still `CapsuleGeometry`; still yaw-only cam |
| v3 (this) | 24,871       | 21:29                | Swaps `CapsuleGeometry` → stretched `SphereGeometry`; adds on-screen error banner + WebGL guard + try/catch; pitch+yaw chase cam |

## Hard-won fixes & latent bugs (why the rewrite must not regress)

- **`CapsuleGeometry` does not exist in Three.js r128** (added r142+). v1/v2 used it
  and produced a fully blank page with no visible error on mobile. v3 fixed this by
  building the body from a stretched `SphereGeometry`. The `/src` port uses a current
  npm Three.js where capsules exist, but the lesson — *know your version's API
  surface, and always surface init errors on-screen* — carries over.
- **Vector-mutation camera bug (still latent in v3).** `updateFlight()` runs
  `state.velocity.lerp(forward.multiplyScalar(state.speed), dt*3)`, which mutates
  `forward` in place to length `speed`. The camera offset then reuses it:
  `forward.clone().multiplyScalar(-behindDist)` → the camera sits `speed × 9` units
  back instead of `9`, so it "flies miles away" and the distance scales with speed.
  **Fixed in `/src`** by cloning before the velocity lerp, and guarded by a unit test
  asserting the heading vector is never mutated by velocity integration.
- **Mobile is not automatic.** The viewport meta, `touch-action: none`, the
  `@media (hover: none) and (pointer: coarse)` gate, and first-class `touchstart/
  move/end` handling with `preventDefault` are all load-bearing.
- **Wing mirror sign.** `wingR.scale.z = -1` mirrors the wing, which also flips how
  `rotation` reads on that side — the two wings need opposite-signed rotation values
  to flap in visual sync. (In v1–v3 the flap is on `rotation.z` of a flat
  `ShapeGeometry`; the `/src` port reorients the geometry and hinges on the correct
  axis, with a unit test on the sign relationship.)

## The chat-only "v4"

The original handoff brief describes a **dragon-colour picker** (black/green/red/
blue/white/brown) on the start screen and a *fixed* camera, neither of which appears
in any saved Drive file. That iteration only ever existed in the chat session and was
never saved. The colour system and the camera fix are (re)implemented from scratch in
`/src`.

## Original Drive `README.md` (archived verbatim)

> # Emberwing — Dragon RPG Prototype
>
> A 3D dragon-protagonist RPG built with Claude, deliberately designed to avoid
> AI-generated-animation pitfalls: no rigged/skeletal fighting animation anywhere.
> Combat is a fire-breath particle system; the dragon's flight motion is procedural
> (sine-driven wing flap, banking-turn flight model) rather than keyframed.
>
> **Controls:** W/S pitch · A/D roll & bank-turn · Space flap (climb + speed) ·
> Shift boost · Hold mouse breathe fire.
>
> **Implemented:** third-person chase-cam flight over procedural ridged terrain;
> procedural low-poly dragon (sine-driven flap, no skeleton); fire-breath particle
> cone from the jaw; stationary crystal "sentinels" (30 HP, respawn after a delay);
> HUD (vitality, breath, speed, altitude, kills).
>
> **Not yet built (ideas):** growth/progression (bigger dragon, new breath elements);
> enemy variety beyond stationary crystals (flying knights, other dragons); persistent
> save state; sound design.
