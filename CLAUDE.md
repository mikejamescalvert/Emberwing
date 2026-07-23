# CLAUDE.md

Guidance for Claude Code / Cowork sessions working in this repo. This is a short
pointer; the full contributor guide is **[AGENTS.md](AGENTS.md)** — read it.

## The one constraint that shapes everything

**Emberwing is animation-light by design.** No rigged/skeletal fighting or
locomotion animation, anywhere. Flight over ground movement, breath attacks over
melee, procedural motion (sine wing-flap, banking turns) over skeletal rigs. If a
feature would need convincing rigged animation to feel good, pick a different
mechanic. This is the project's premise, not a limitation to fix.

## Architecture in one line

Pure, unit-tested logic in `src/core/*` (no THREE, no DOM); thin Three.js/DOM
adapters in `src/render/*`, `src/input/bindings.js`, `src/main.js`. Add logic to
`core/` **with a test**, then call it from the render layer. `core/vec3.js` is
immutable on purpose — never reintroduce in-place vector mutation (it caused the
prototype's runaway-camera bug).

## Commands

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # keep green
npm run lint    # keep clean
npm run build
```

## Where to work

Pick the top unstarted item in **[BACKLOG.md](BACKLOG.md)**. For anything touching
the game loop or progression, read **[DESIGN.md](DESIGN.md)** first.
