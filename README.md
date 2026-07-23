# 🐉 Emberwing

A 3D dragon-flight game built with Three.js. You are a young dragon over a
shattered realm: glide the thermals, breathe fire on the crystal sentinels
below, and grow stronger with every kill.

**▶ Play the latest build:** https://mikejamescalvert.github.io/Emberwing/

Emberwing is deliberately **animation-light**. AI-generated character animation —
especially rigged combat — tends to look bad, so the whole design sidesteps it:
flight instead of ground locomotion, breath attacks (particle cones) instead of
melee, and procedural motion (sine-driven wing flaps, banking turns) instead of
skeletal rigs. This is a **standing design constraint**, not a limitation to fix.
See [DESIGN.md](DESIGN.md).

## Controls

| Action | Desktop | Mobile |
|--------|---------|--------|
| Pitch (dive / climb) | `W` / `S` | Joystick up / down |
| Roll & banking turn | `A` / `D` | Joystick left / right |
| Boost | `Shift` | **BOOST** button |
| Flap (climb + speed) | `Space` | **FLAP** button |
| Breathe fire | Hold mouse | Hold **BREATHE FIRE** button |

Pick your dragon's colour on the start screen, then click / tap to take flight.

## Quick start

Requires **Node 20.19+**.

```bash
npm install
npm run dev      # Vite dev server at http://localhost:5173
```

That's the whole setup — no other manual steps.

### Scripts

| Command | Does |
|---------|------|
| `npm run dev` | Start the Vite dev server (hot reload) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm test` | Run the Vitest unit suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run coverage` | Unit tests with a coverage report |
| `npm run lint` | ESLint |

## Architecture

The game logic is split into **pure, testable modules** (no Three.js, no DOM) and
a thin **render/DOM layer** that adapts them to Three.js and the browser.

```
src/
  core/        Pure logic — no THREE, no DOM. Fully unit-tested.
    mathUtils.js   clamp / lerp / damping
    vec3.js        immutable {x,y,z} vector ops (kills the aliasing-bug class)
    flight.js      flight/physics: attitude, speed, heading, integration
    camera.js      chase-camera offset/look math
    input.js       keyboard + touch -> one normalized control signal
    dragonAnim.js  wing-flap + jaw math (mirror-sign relationship)
    palette.js     the six dragon colours
    world.js       ridge-noise terrain height, seeded RNG, scatter
    combat.js      sentinel HP/damage, breath resource, particle motion
  render/      Three.js adapters (not unit-tested; kept thin).
    dragon.js  scene.js  particles.js  hud.js
  input/
    bindings.js  DOM event wiring -> plain state objects
  main.js      Composes everything into the game loop
  styles.css   HUD / start screen / touch controls
index.html     Entry (start screen, HUD, touch controls, error banner)
test/          Vitest specs mirroring src/core
legacy/        The original single-file prototype (archived reference)
```

Why this shape: the prototype's worst bug was a shared vector mutated in place,
which made the camera fly away as speed rose. Moving the math into pure functions
with immutable vectors makes that class of bug impossible and lets us lock the
behaviour with fast unit tests. See [AGENTS.md](AGENTS.md) for the full tour.

## Testing

`npm test` runs the Vitest suite (`test/**/*.test.js`). Coverage prioritises the
flight/physics math (including a regression test that the heading vector is never
scaled by speed), input mapping, combat/breath, and the wing mirror-sign math.
Rendering/WebGL is intentionally not unit-tested — as much logic as possible lives
outside the render loop so it *can* be tested.

## Deployment

Every push to `main` triggers two GitHub Actions workflows:

- **CI** (`.github/workflows/ci.yml`) — lint, unit tests, and a production build.
- **Deploy** (`.github/workflows/deploy.yml`) — builds and publishes `dist/` to
  GitHub Pages, so the link above always reflects `main`.

## Provenance

Emberwing began as a single-file Three.js proof of concept built collaboratively
with Claude in chat. That prototype is preserved under
[`legacy/`](legacy/README.md); this repo is the modular, tested rewrite of it.

## License

[MIT](LICENSE) © 2026 Mike Calvert
