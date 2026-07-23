# AGENTS.md — working on Emberwing

This file orients an AI agent (or human) picking up Emberwing cold. Read it before
making changes. For player-facing info see [README.md](README.md); for game-design
direction see [DESIGN.md](DESIGN.md); for the task queue see [BACKLOG.md](BACKLOG.md).

## The one constraint that shapes everything

**Emberwing is animation-light by design.** AI-generated character animation —
rigged fighting/locomotion especially — tends to look bad. The whole game is
built to sidestep it:

- **Flight**, not ground locomotion (no walk/run cycles, no IK).
- **Breath attacks** (particle cones), not melee (no fight combos, no hit reactions).
- **Procedural motion** — sine-driven wing flap, banking turns — not skeletal rigs.

When you add a feature, keep this pillar. **If an idea needs convincing rigged
animation to feel good, design a different mechanic that hits the same goal.**
(Example: want "grab and carry" prey? Do it with a particle/telekinesis beam or a
snap-to-carry attachment, not an animated grapple.) Adding a rig is the one change
that would break the project's premise.

## Run / test / build

Requires Node 20.19+.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # Vitest unit suite (must stay green)
npm run lint     # ESLint (must stay clean)
npm run build    # production build to dist/
```

CI runs lint + test + build on every push/PR; keep all three green. Pushing to
`main` also deploys to GitHub Pages.

## Architecture: pure core vs. thin adapters

Two layers, on purpose:

- **`src/core/*` — pure logic. No `THREE`, no DOM.** Every function takes plain
  data and returns plain data. This is where flight, camera, input, combat,
  world, palette, and animation math live, and it is **fully unit-tested**.
- **`src/render/*`, `src/input/bindings.js`, `src/main.js` — thin adapters.** They
  translate core results onto Three.js objects and the DOM. Kept deliberately thin
  and *not* unit-tested (rendering/WebGL isn't worth mocking).

**When you add logic, put it in `core/` with a test, then call it from the render
layer.** If you find yourself writing math inside `render/` or `main.js`, that's a
smell — extract it to `core/` so it can be tested.

### The immutability rule (don't regress the original bug)

`src/core/vec3.js` vectors are **immutable** — every op returns a new `{x,y,z}` and
never mutates its inputs. This is not stylistic: the prototype's worst bug was
`state.velocity.lerp(forward.multiplyScalar(speed), …)`, which scaled the shared
`forward` vector in place, so the camera (which reused `forward`) flew away as
speed rose. Immutable vectors make that impossible. **Do not introduce in-place
vector mutation into `core/`.** `test/flight.test.js` and `test/camera.test.js`
guard this — keep those tests.

### Data flow (one frame)

```
combineInput(keys, touch, pointer)      // core/input  -> {pitch,roll,boost,flap,breathing}
  -> stepFlight(state, input, dt, ground) // core/flight -> new immutable state (+ unit heading)
  -> render: dragon position/orientation, wingRotations, jawOpen
  -> camera: desiredCameraPosition/LookTarget (constant follow distance)
  -> combat: stepBreath, fire.spawn/update -> sentinel HP -> kills/respawn
  -> hud.update(snapshot)
```

## Headless smoke-testing the loop

`main.js` exposes a dev-only hook (stripped from production builds by
`import.meta.env.DEV`). In the dev server console or via automation:

```js
__emberwing.start();               // dismiss the start screen
__emberwing.press('Space', true);  // hold a key (KeyW/KeyS/KeyA/KeyD/Space/ShiftLeft)
__emberwing.tick(0.05, 60);        // advance 60 fixed 50ms steps, returns a snapshot
__emberwing.snapshot();            // { pos, speed, yaw, wingL/R, cam, health, breath, xp, stage, ... }
__emberwing.addXp(20);             // grow the dragon (test growth stages)
__emberwing.burstHere();           // drop emberstone at the dragon (test collection)
__emberwing.damage(200);           // drain vitality -> death/run-over
__emberwing.restart();             // reset the run
__emberwing.portraitDataUrl('3q'); // offscreen PNG of the dragon ('3q'|'side'|'front'|'top')
```

`tick()` is decoupled from `requestAnimationFrame`, so you can verify flight,
wings, camera, and combat even when a preview pane isn't compositing frames.

**Seeing the render headlessly.** When the preview pane won't composite (so
screenshots fail), `portraitDataUrl()` renders the dragon offscreen with
`preserveDrawingBuffer` and returns a PNG data URL. To get it to disk, POST it to
a tiny localhost sink and read the file — this is how the dragon silhouette was
iterated. A ready-made sink script pattern lives in the scratchpad; run a small
Node HTTP server that base64-decodes the POST body to a `.png`.

## Conventions

- **ES modules**, `type: module`. Node 20.19+.
- **Tests** live in `test/`, named `*.test.js`, and import from `../src/...`.
- **Tunables** live in per-module config objects (`FLIGHT`, `CAMERA`, `COMBAT`,
  `WING`, palette). Balance/feel changes should be a one-line edit there.
- **Commits**: small and focused, imperative subject, explain the *why*. Don't
  bundle unrelated changes. Keep CI green per commit where practical.
- **Line endings** are normalized to LF via `.gitattributes` (Windows dev + Linux CI).

## History / gotchas worth knowing

- **`THREE.CapsuleGeometry` didn't exist in the prototype's r128 CDN build** and
  silently blanked the page on mobile. We're on current Three.js via npm now, but
  the lesson stands: always keep the on-screen error path in `index.html`/`main.js`
  (a phone has no console — a blank canvas is the worst failure mode).
- **Camera runaway bug** — see the immutability rule above.
- **Wing flap axis** — wings are flat membranes reoriented so they hinge on
  `rotation.x`; the right wing is mirrored (`scale.z = -1`) so it takes the
  opposite-signed rotation (`core/dragonAnim.wingRotations` returns `{left, right:-left}`).
- **Mobile is first-class, not bolted on** — viewport meta, `touch-action: none`,
  the `@media (hover: none) and (pointer: coarse)` gate, and `touchstart/move/end`
  with `preventDefault` all matter. Test changes against a mobile viewport.

## Where to start

Grab the top unstarted item in [BACKLOG.md](BACKLOG.md). Each item is scoped to be
completable without the full project history. Read [DESIGN.md](DESIGN.md) first if
the item touches the game loop or progression.
