# Emberwing — Backlog

Independently-completable tasks. Grab the top unstarted one. Each is scoped to be
done without the full project history. Read [AGENTS.md](AGENTS.md) (conventions)
and, for anything touching the loop, [DESIGN.md](DESIGN.md) first.

**Rule for every task:** logic goes in `src/core/*` with a Vitest test; the render
layer stays thin. Keep lint + tests green. Respect the animation-light pillar — no
rigged/skeletal animation.

---

## P1 — Growth loop MVP ✅ SHIPPED

_The hunt → burn → grow loop is implemented, tested, and deployed: emberstone
motes drop from burned sentinels, fly-through collection grants xp, growth stages
(Hatchling → Fledgling → Drake → Wyrm → Elder) scale the dragon up, upgrade the
breath, and pull the camera back, with a HUD growth meter. See `core/emberstone.js`,
`core/growth.js`, `render/emberstone.js`, and the wiring in `main.js`._

**Next up: P3 (win state + polish) and P4 (rival wyrmlings).**

### 1. Emberstone drops + fly-through collection ✅ Done
- **What:** When a sentinel is burned down, spawn a handful of glowing "emberstone"
  motes that drift outward and slowly fall. Flying the dragon through one absorbs it.
- **Where:** new `core/emberstone.js` (pure: spawn positions/velocities from a seed,
  motion/decay, fly-through hit test reusing `vec3.distance`); `render/` mesh layer;
  hook spawn into the kill path in `main.js`/`render/particles.js`.
- **Done when:** burning a sentinel visibly drops motes; flying through them removes
  them and increments a collected count; pure logic is unit-tested (spawn count,
  motion, pickup radius).

### 2. Growth meter + dragon growth ✅ Done
- **What:** Collected emberstone fills a growth meter; crossing a threshold advances
  a growth stage and scales the dragon up.
- **Where:** `core/growth.js` (pure: xp→stage thresholds, `stageForXp`, per-stage
  scale/stat table); apply `dragon.group.scale` in `main.js`; add a growth bar to
  the HUD (`index.html`, `styles.css`, `render/hud.js`).
- **Done when:** collecting enough advances a stage and the dragon grows; thresholds
  and stage lookup are unit-tested. Consider pulling the camera back per stage so the
  bigger dragon stays framed (see DESIGN open questions).

### 3. Breath upgrades per stage ✅ Done
- **What:** Each growth stage widens/lengthens/strengthens the breath (spread, range,
  damage) — read from the growth stage.
- **Where:** extend `core/combat.js` (make particle spread/life/damage a function of
  stage) + the growth stat table; wire in `render/particles.js`.
- **Done when:** higher stages visibly change the breath; the stat mapping is tested.

## P2 — Stakes ✅ SHIPPED

_Red wardstone sentinels fire slow, dodgeable flak; hits drain vitality, which
regenerates after a quiet spell; zero vitality ends the run with a scored summary
(emberstone + kills + stage) and a restart. Flak arms once you grow past hatchling.
See `core/flak.js`, `core/vitality.js`, `core/score.js`, `render/flak.js`. Also
fixed: pitch is now direct (up = climb)._

### 4. Wardstone flak + vitality damage ✅ Done
- **What:** A fraction of sentinels are "wardstones" that fire slow, dodgeable
  projectiles at the dragon. A hit drains vitality; vitality regenerates slowly when
  not recently hit.
- **Where:** `core/combat.js` (projectile motion, dragon hit test, vitality
  drain/regen — all pure + tested); `render/` for projectile meshes; HUD already has
  the vitality bar (wire it to real health).
- **Done when:** flak is visible and dodgeable by flying; getting hit lowers vitality;
  vitality regenerates; all numeric logic is unit-tested. **No enemy rig** — a moving
  projectile + a muzzle-flash particle only.

### 5. Death → run summary + score ✅ Done
- **What:** Vitality reaching zero ends the run and shows a summary (emberstone,
  sentinels felled, stage reached, score) with a restart.
- **Where:** `core/score.js` (pure score calc + tests); a summary overlay in
  `index.html`/`styles.css`; run-reset in `main.js`.
- **Done when:** dying shows the summary and restarts cleanly; score calc is tested.

## P3 — Win + polish

### 6. Elder win state
- **What:** Reaching max growth stage is a win — show a celebratory summary; keep the
  score.
- **Where:** `core/growth.js` (max stage), overlay reuse from task 5.

### 7. Invert-Y option (mobile feel)
- **What:** Add a settings toggle for joystick/keyboard pitch inversion; decide the
  mobile default with a real device. See DESIGN "Open decision — joystick Y."
- **Where:** `core/input.js` (parameterize the pitch sign — tested), a small settings
  UI on the start screen.

## P4 — Stretch (high value, still animation-light)

### 8. Rival wyrmlings (reuse the flight model)
- **What:** Enemy dragons using the *same* procedural dragon + `core/flight` with a
  simple steering AI; an animation-light dogfight (breath vs. breath, dodge by flying).
- **Where:** `core/ai.js` (pure steering: desired-heading from target — tested);
  reuse `render/dragon.js` and `core/flight.js`.

### 9. Beacons / exploration
- **What:** Ignitable beacons across the map that reveal terrain and spawn richer
  sentinel clusters — a reason to travel.

## Tech debt / infrastructure

- **A. Mobile performance tier.** Quality setting that lowers shadow-map size or
  disables shadows and drops pixelRatio on coarse-pointer / low-DPR devices. Verify
  60 fps on a real mid-range phone. (DESIGN: performance budget.)
- **B. Trim the Three.js bundle.** ~144 KB gzip today. If it grows, import only the
  Three modules used instead of `import * as THREE`.
- **C. Coverage in CI.** Add `npm run coverage` to CI and publish/threshold it.
- **D. Sound design.** Wind, breath whoosh, sentinel shatter, growth chime. (Was on
  the original "not yet built" list.)
- **E. Persistent best score.** `localStorage` high score shown on the start screen.
- **F. Second breath element (stretch of task 3).** e.g., frost cone with a different
  colour/effect, unlocked at a late stage.
- **G. Dragon silhouette — first pass ✅.** Reworked from a blob into a lean
  tapered body, curved neck, snouted horned head with glowing eyes, dorsal spine
  ridge, big bat wings with finger bones, and a finned tapering tail (see
  `render/dragon.js`). Remaining polish: a bigger/more-detailed head, scalloped
  wing membranes, per-stage proportion changes (not just uniform scale), and
  merging the ~40 static meshes to cut draw calls on low-end mobile.
