# Emberwing — Design Notes

An honest look at what the game is, what's fun, what isn't, and where it should go.
This is a living document. It is deliberately **scope-conservative**: a small, tight
loop that actually feels finished beats a big feature list that never does.

## Design pillar (non-negotiable)

**Animation-light.** Flight over locomotion, breath over melee, procedural motion
over skeletal rigs. Every feature below is chosen to respect this. If a proposed
mechanic would need convincing rigged animation to feel good, it's the wrong
mechanic — find another that hits the same fantasy. This pillar is *why* the game
exists; see [AGENTS.md](AGENTS.md).

## Status — what's built

The loop below was written against the *original* prototype (flight + inert
targets). Since then, **P1 (growth)** and **P2 (stakes)** have shipped:

- **Hunt → burn → grow:** sentinels drop emberstone; fly-through collection grows
  the dragon Hatchling → Elder, scaling it up and upgrading its breath.
- **Stakes:** red **wardstones** fire slow, dodgeable flak; hits drain vitality,
  which regenerates after a quiet spell; zero vitality ends the run.
- **A run:** death shows a scored summary (emberstone + kills + stage) with restart.
- **Controls:** pitch is **direct** (up = climb) on keyboard and touch.

The "what doesn't work yet" list below is kept for history; the stakes/progression
gaps it names are now addressed. Next design focus: P3/P4 (rival wyrmlings,
beacons, tuning).

## Controls — the deep dive (shipped)

Play feedback: *"if I press left it should go left"*, *"I don't understand the
flap wings"*, general motion confusion on mobile and web. All four root causes
were real, and all were inherited from the prototype:

1. **The turn was mirrored.** The flight model derived yaw from bank with a
   flipped sign (`yaw -= roll`), so right input steered the heading to −Z —
   which is screen-LEFT behind the dragon. Left/right were genuinely swapped,
   not merely floaty. *Fix:* `yaw += bank · turnRate` — right is right. Guarded
   by steering-direction regression tests (right ⇒ +Z, left ⇒ −Z).
2. **The body pose lied.** The model faces +X, where nose-up is `rotation.z` and
   bank is `rotation.x` — but the code used the +Z-facing mapping (pitch→x,
   roll→z). Verified with Three's own Euler math: steering visually reared the
   nose ~50° and climbing visually banked the body. Players read body language
   before HUDs, so this constantly contradicted the motion. *Fix:* Euler order
   `'YZX'` (yaw → pitch → bank, aircraft-style) with the axes mapped straight.
3. **Two-stage steering lag.** Input built roll over ~½ s, roll drove yaw, and
   the turn carried on after release while roll decayed. *Fix:* direct arcade
   steering — the stick sets the bank with a ~0.12 s ease and yaw rate follows
   the bank immediately (~97°/s at full stick); release levels out in ~⅓ s and
   the turn stops. Banking is now honest cosmetics: it shows the turn, it does
   not gate it.
4. **FLAP was a redundant verb.** It overlapped climb (the stick) and speed
   (BOOST) and cost a fourth touch target. *Cut.* The dragon now flaps
   vigorously on its own when climbing or boosting (animation follows intent),
   and the speed system gained an energy feel instead: **dive to gain speed,
   climb to bleed it** (`diveSpeedGain`). `Space` remains as a climb alias.

**The model in one line: point where you want to go.** Three verbs — steer,
boost, breathe. Mobile is one joystick + two buttons.

Tunables in `FLIGHT` (`src/core/flight.js`): `turnRate`, `steerLambda`,
`bankMax`, `pitchMaxInput`, `pitchLambda`, `diveSpeedGain`.

## Honest assessment of the current loop (original prototype)

**What already feels good:**
- **Flight in motion.** Banking turns, the flap/boost speed change, and diving
  have a pleasant weight. This is the core and it's worth protecting.
- **Fire breath.** The particle cone is juicy and readable; aiming it by flying is
  satisfying.
- **Atmosphere.** The dusk palette, fog, ridged terrain, and ruin pillars read as a
  real place on a small budget.
- **The dragon.** Procedural low-poly reads clearly and the wing flap now hinges
  correctly.

**What doesn't work yet — and why:**
- **No stakes.** Nothing can hurt you. Vitality is drawn but never drops, so there's
  no tension and no reason to fly well.
- **Targets don't matter.** Stationary crystal sentinels are inert. Burning one just
  ticks a counter and respawns another. There's no pull to seek them out and no
  consequence to ignoring them.
- **No progression.** "Grow stronger with every kill" is promised on the start
  screen but nothing actually grows. Kills are a number.
- **One verb, forever.** Breathe fire on a stationary thing. It's the same moment on
  loop within a minute.
- **No goal.** No score worth chasing, no win, no end. Sessions just… stop.

The through-line: the *feel* is good, the *reasons to keep playing* are missing.

## Proposed loop: **hunt → burn → grow**

A tight, run-based loop that adds stakes and progression **without** adding any
animation:

1. **Hunt.** Crystal sentinels are worth seeking because burning one shatters it
   into **emberstone motes** — glowing pickups that scatter and drift.
2. **Collect.** Fly *through* emberstone to absorb it (no grab animation — a
   fly-through pickup, like a ring). Emberstone fills a **growth meter**.
3. **Grow.** At each threshold the dragon **grows** (scale up — pure transform, on
   pillar) and unlocks a **breath upgrade**: wider cone → longer range → more
   damage → (stretch) a second breath element. Growth is the reward and the
   difficulty ramp.

Layered on top, in priority order:

- **Stakes (MVP).** Some sentinels are **wardstones** that fire slow, dodgeable
  flak upward. Getting hit drains vitality; vitality regenerates slowly out of fire.
  Threat is entirely **dodge-based** — the skill is flying, which is exactly the
  skill the game already teaches. No enemy animation beyond a moving projectile and
  a muzzle flash (particles).
- **A goal (MVP).** A run ends on death or on reaching **Elder** (max growth). Score
  = emberstone collected + sentinels felled + stage reached. Show it, let players
  beat it. Target session length **5–10 minutes**.
- **Reactive enemies (stretch).** **Rival wyrmlings** reuse the *same* procedural
  dragon and the *same* `core/flight` model with a simple steering AI — an
  animation-light dogfight: breath vs. breath, dodging by flying. This is the
  highest-value stretch feature because it reuses everything and is pure procedural
  motion.
- **Exploration (stretch).** **Beacons** to ignite across the map that reveal more
  terrain and spawn richer sentinel clusters — a reason to travel, not circle.

### Difficulty pacing

- **Hatchling (start):** calm. No flak. Learn to fly and burn.
- **Fledgling:** wardstones appear; flak is sparse and slow.
- **Drake:** denser sentinels, faster flak, first rival wyrmling (stretch).
- **Elder (win):** the map is busy; survival + score is the test.

Pacing is driven by the growth stage, so difficulty and reward rise together.

## Mobile / desktop parity (designed, not bolted on)

Both platforms drive the **same** `core/input` control signal, so mechanics are
identical. Differences are only in the input surface and performance budget.

- **HUD:** identical layout both ways (vitality, breath, growth meter, speed,
  altitude, score). Bars/labels already scale to the viewport.
- **Controls:**
  - Desktop: `WASD` + `Shift`/`Space` + hold-mouse-to-breathe.
  - Mobile: left-thumb joystick, right-side **FLAP / BOOST / BREATHE FIRE** buttons.
  - **Resolved — pitch is direct (up = climb).** W / joystick-up climb; S /
    joystick-down dive, on both platforms. (The prototype used the inverted
    aircraft convention, which players found confusing.) An optional **Invert Y**
    toggle for sim-style players remains a nice-to-have (BACKLOG task 7).
- **Performance budget (target: 60 fps on a mid-range phone, ~2020 GPU):**
  - Keep geometry low-poly (already the case). Cap active fire particles.
  - `pixelRatio` clamped to 2 (done). Consider dropping to 1.5 on low-end.
  - Shadows are the biggest risk. Plan: a quality tier that lowers shadow-map size
    or disables shadows on coarse-pointer / low-DPR devices.
  - Bundle is ~144 KB gzip (Three.js). Fine to ship; trim later by importing only
    the Three modules used if it grows.
  - **Test on a real phone, not just desktop Chrome devtools.** The prototype's
    worst failures (blank page, unplayable controls) only showed on hardware.

## Scope & sequencing

Build the loop in this order; each step is shippable on its own:

1. **Growth loop MVP** — emberstone drops from burned sentinels → fly-through
   collect → growth meter → dragon scales up + breath widens. *(This alone makes
   the game have a point.)*
2. **Stakes** — wardstone flak + vitality damage/regen + a death→score screen.
3. **Win state + score** — Elder stage, run summary, "beat your best."
4. **Stretch:** rival wyrmlings (reuse flight AI), then beacons/exploration.

Resist adding a fifth idea before 1–3 feel good. A finished small loop is the goal.

## Open questions

- Invert-Y toggle vs. mobile-default climb-up (needs device testing).
- Does growth change the *camera* (pull back as the dragon grows) to keep it framed?
- Emberstone economy: how many motes per sentinel, how much per growth stage?
  (Tune for a 5–10 min run to Elder.)
- Should death reset growth fully (arcade) or partially (roguelite)? Start arcade.
