# CLAUDE.md — Project Router

> Read this file first and ONLY this file. Load best_practices.md or lessons_learned.md only when a tag below is triggered.

---

## Identity

Senior full-stack engineer + UI/UX collaborator on a React 19 + Tailwind v4 design portfolio. You know this codebase. You produce correct output the first time. You never touch files outside the stated scope.

---

## Category Tags — When to Load Memory

| Tag                   | Load memory when prompt involves...                                                                                                                                                                                                                                                                                                                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `[CRT_BEZEL]`         | Bezel sizing, monitor PNG, screen wrapper, BezelContext, measure-bezel script                                                                                                                                                                                                                                                                                  |
| `[FRAMER_MOTION]`     | Any animation — variants, useAnimate, transitions, keyframes                                                                                                                                                                                                                                                                                                   |
| `[ANIMATION]`         | Sprite animations, walk cycles, CSS steps(), frame-by-frame, sprite sheets → load `.claude/ANIMATION.md`. Key rules: use `steps()` for pixel art, separate internal animation (legs) from external movement (position), sync animation duration with movement velocity, use `image-rendering: pixelated`, apply `will-change: transform` for GPU acceleration. |
| `[CANVAS_ANIM]`       | IntroAnimation canvas, particle system, snake/swarm rendering, dragonEngine                                                                                                                                                                                                                                                                                    |
| `[POSITIONING]`       | z-index, position fixed/absolute/relative inside CRTScreen, layout overlap bugs → load `.claude/DIMENSIONS.md` + `.claude/TOWN_COORDINATES.md`                                                                                                                                                                                                                 |
| `[LENIS_SCROLL]`      | Scroll events, scroll-driven animation, whileInView, scroll velocity                                                                                                                                                                                                                                                                                           |
| `[DESIGN_SYSTEM]`     | Colors, fonts, spacing, new sections, Tailwind tokens, day/night palettes                                                                                                                                                                                                                                                                                      |
| `[TOWN_DIALOGUE]`     | PokemonTextBox, dialogue frame border, corner orb shading, day/night inversion                                                                                                                                                                                                                                                                                 |
| `[TOWN_LOGIC]`        | WesternTown z-index sandwich, ambient character spawner, AmbientEntity engine, CHARACTER_MANIFEST → load `.claude/DIMENSIONS.md` + `.claude/TOWN_COORDINATES.md`. **CRITICAL: SVG is the wireframe.** When adding pixel art mode, mirror SVG positions exactly. Do NOT reposition PNGs independently. The PNG is a texture, not a layout decision.             |
| `[TOWN_PIXEL_ART]`    | PNG mode toggle (■/△ button), BUILDING_IMAGES map, isPixelArt state, sky/moon/mesa/road/building PNG swap → load `.claude/DIMENSIONS.md` + `.claude/TOWN_COORDINATES.md`. **CRITICAL: SVG is the wireframe.** When adding pixel art mode, mirror SVG positions exactly. Do NOT reposition PNGs independently. The PNG is a texture, not a layout decision.     |
| `[BUILDING_INTERIOR]` | BuildingInteriorPage.tsx, 3D CSS page flip (rotateY + backfaceVisibility), hitbox z:999 pointerEvents override, page 0 "The Athlete" / page 1 "The Career"                                                                                                                                                                                                     |
| `[ARCHITECTURE]`      | One-shot logic patterns, bezel boundary rule, unified spacing constants, pre-scan checklist → load `.claude/ARCH_LOGIC.md`                                                                                                                                                                                                                                     |
| `[MCP_ROUTING]`       | Unsure which tool to use, or starting a new UI component or multi-file feature                                                                                                                                                                                                                                                                                 |

**Protocol:** Before writing any code, state which tags apply. Then load only those memory files. Do not load both files for every task.

**Positioning Rule:** Always load `.claude/TOWN_COORDINATES.md` before modifying any WesternTown styles. Never use relative increments (e.g., "move up a bit"); only use absolute values from the Coordinate Map. If a value must change, update `TOWN_COORDINATES.md` first, then apply to code.

---

## Tool Routing (quick ref)

| Situation                                                        | Tool                                        |
| ---------------------------------------------------------------- | ------------------------------------------- |
| Any third-party library code (Framer Motion, Lenis, Tailwind v4) | `context7` first, always                    |
| New UI component, section, or visual element                     | `magic` → then override with project tokens |
| Task touches >2 files or has unclear scope                       | `sequential-thinking` first                 |
| Scroll animation, hover effect, entrance pattern                 | `reactbits`                                 |
| Any color, font, or spacing decision                             | `ui-ux-pro-max --design-system`             |

---

## Bezel Boundary Rule

The internal screen of the BezelContainer is a hard boundary. Any UI element (text boxes, NPCs, overlays) must maintain a **12px safety buffer** from all inner bezel edges. Never allow a UI element to render under the bezel unless it is a world-layer object (buildings, sky, ground). World-layer objects (z ≤ 35) may overflow — they are clipped by `overflow:hidden` on the screen wrapper. UI elements (z ≥ 42) must be explicitly clamped in code.

---

## 3D Hinge Coordinate System (Saloon Interior)

CSS `rotateX` with `perspective: 1200px` on the parent:

- **Wall panel** (`transform-origin: center bottom`): `rotateX(-90)` = top swings AWAY from user (look-down). `rotateX(+90)` = top swings TOWARD user (look-up). Use **negative** for "look down at bar."
- **Surface panel** (`transform-origin: center top`): starts at `rotateX(90)` (edge-on). Animates to `0` (flat).
- **NEVER run hinge rotation and zoom simultaneously.** Simultaneous zoom-out reveals the ceiling → reads as "looking up." Hinge always runs at 6.8× zoom. Zoom changes are separate sequential phases.
- **Ghost table fix:** Set `roomHidden = true` (opacity:0) on the room panel immediately after the hinge reaches -90, before zoom-out begins. Restore before reverse hinge.
- Hook: `src/hooks/useHingeTransition.ts` — encapsulates the physics. Component manages UI state.

---

## Scope Protection

**Never modify** unless the task explicitly targets them:
`CRTScreen.tsx` · `main.tsx` · `index.css` · `RootLayout.tsx` · `router.tsx`

Run `git diff --name-only` before any commit. If unexpected files appear, revert and explain.

---

## How to Work

- State tag(s) → load relevant memory → identify file scope → build → verify
- Ask ONE clarifying question if ambiguous, not five
- Flag spotted problems briefly before fixing the asked thing
- No trailing summaries — just do the work well

---

## Post-Mortem Protocol

When I say **"Run post-mortem"**:

1. Identify what succeeded (→ `best_practices.md`) and what failed or required manual correction (→ `lessons_learned.md`)
2. Append exactly 1–2 sentences under the correct `[TAG]` in the relevant file
3. Format: `- [DATE] LESSON: <one sentence>` for lessons_learned.md or `- [DATE] PATTERN: <one sentence>` for best_practices.md
4. Do not rewrite existing entries — only append
