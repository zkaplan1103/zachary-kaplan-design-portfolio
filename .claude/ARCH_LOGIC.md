# ARCH_LOGIC.md — Architectural Truths & One-Shot Logic Patterns
> Load this file when tag `[ARCHITECTURE]` is triggered.
> Purpose: prevent re-deriving solved math, prevent re-litigating settled patterns,
> and pre-empt whole categories of iterative bugs.

---

## ✅ MAJOR SUCCESS: Dialogue Anchor System (2026-03-29)
The building-relative textbox anchor was solved completely after identifying that building widths
are `% of their district container`, not `% of sw`. Once the correct container width was used and
`buildingsX` parallax offset was added, every building's textbox tracked with pixel-identical
spacing across all 5 buildings + all parallax states. Verified via Playwright across all buildings.

---

## Part 1 — One-Shot Logic Patterns

These formulas are locked. Never redefine per-building. Never add ternaries.

### 1.1 Global Dialogue Anchor
```
// Container widths must be computed first — building w% is relative to container, NOT sw.
const containerPct = district.reduce((s, b) => s + b.w, 0) + (district.length - 1) * 0.8
const containerW   = sw * containerPct / 100

// Per-building center at rest:
cx = containerLeftEdge + sum(prev bw + GAP_PX) + bw/2

// Final box left (parallax-aware, no right-wall clamp):
target = cx + buildingsX + GLOBAL_OFFSET
left   = Math.max(12, target)   // left-wall only; right clips via overflow:hidden
```
`GLOBAL_OFFSET = saloonBw / 2` — derived once from District A building 0. Never change.
The right edge clips naturally via `overflow: hidden` on the screen wrapper. Never add a Math.min
right-wall clamp — it breaks the "push past bezel" behavior for buildings 4 and 5.

### 1.2 Z-Index Sandwich (WesternTown)
| Layer | z |
|---|---|
| Sky | 10 |
| Stars | 11 |
| Celestial body | 12 |
| Ground | 15 |
| Ambient characters | 20 |
| Buildings | 30 |
| Tumbleweeds | 32 |
| Title card | 35 |
| UI (toggle, CTA) | 42 |
| PokemonTextBox | 45 |
| Foreground easter eggs | 51 |

Never insert a new layer without updating this table.

### 1.3 Parallax Rate Assignments
| Element | translateX formula | Rate |
|---|---|---|
| Sky | `mouseNorm * -15` | slowest |
| Buildings (district containers) | `mouseNorm * -30` | mid |
| Ground | `mouseNorm * -45` | fast |
| Easter egg (mini-horse) | same as ground | fast |

`buildingsX = mouseNorm * -30`. Any anchor that must track a building visually must add `buildingsX`.
Any element anchored to ground must use `groundX = mouseNorm * -45`.

### 1.4 District Container Width Formula
```
// Width of a district container (% of sw):
containerPct = sum(bldg.w for bldg in district) + (district.length - 1) * 0.8

// District A left edge:  sw * 0.02
// District B right edge: sw * 0.98  →  left edge = sw*0.98 - containerW
```
Building individual pixel widths: `bw = (bldg.w / 100) * containerW` — never `(bldg.w / 100) * sw`.

### 1.5 Easter Egg Hidden-Until-Parallax Pattern
```
// Place element off-screen right at rest, use groundX to slide it in:
left:      sw + margin
transform: translateX(${groundX}px)
```
At `mouseNorm = 1`, `groundX = -45`, so element appears at `sw + margin - 45`.
Choose `margin` so `sw + margin - 45 < sw` only when mouse is hard-right.
Minimum reveal margin: `margin = 10` → peeks in 35px at full right.

---

## Part 2 — Strict Coding Rules (Pre-Task Checklist)

Run this checklist mentally before writing the first line of code on any WesternTown task:

### The Boundary Rule
Every UI element (z ≥ 42) must satisfy:
- Left edge ≥ 12px (`Math.max(12, left)`)
- Right clipping via `overflow: hidden` on screen wrapper — do NOT add `Math.min` right clamp
- If element is a world-layer object (z ≤ 35), no clamping needed — overflow clips it

### The Scaling Rule
- All sizes: derive from `sw`, `sh`, or `%` of a known container
- Zero hardcoded pixel values except: corner offsets (SVG geometry), border widths (1-2px), fixed UI padding (8-16px)
- If a value appears twice in different components, extract it to a shared constant

### The State Rule
Before finalizing any visual output, verify it works across:
- `isNight = true` AND `isNight = false`
- `mouseNorm = -1` (full left parallax), `mouseNorm = 0` (rest), `mouseNorm = 1` (full right)
- `hoveredBuilding = null` AND `hoveredBuilding = <each building id>`

### The Container Rule (CRITICAL — learned the hard way)
Building `w` values are `% of their district container`, NOT `% of sw`.
Always compute `containerW` first. Never skip this step. This was the root cause of
3+ rounds of incorrect dialogue anchoring across all 5 buildings.

---

## Part 3 — Task-Grouping Protocol

### Pre-Scan (run before touching any file)
1. Does this touch positioning? → Check z-index sandwich. Check parallax rates.
2. Does this touch a building? → Check ALL buildings, not just the target one.
3. Does this touch a UI element? → Check both `isNight` states and both bezel edges.
4. Does this touch SVG? → Check clipPath IDs for collision across multiple instances.
5. Does this add an animation? → Check for transform conflict with FM imperative animate.

### Bundle Rule
If a fix for one building affects spacing/positioning → apply to ALL buildings by deriving
a formula, never by adding an if/else for individual IDs. A formula that works for building 1
must be mathematically derivable to work for buildings 2–5 with the same constants.

### Diagnostic Post-Task Checklist
After every task, answer these before declaring done:
- [ ] Does new code respect the 12px bezel safety buffer?
- [ ] Does it use `GLOBAL_OFFSET` for dialogue positioning (not a per-building value)?
- [ ] Does it add `buildingsX` if tracking a building's visual position?
- [ ] Does it use `containerW` (not `sw`) for building pixel widths?
- [ ] TypeScript: `npx tsc --noEmit` returns zero errors?
- [ ] Playwright: at least building 1 and building 5 visually verified?

---

## Part 4 — Core Architectural Truths (Town Project)

### Truth 1: Percentage units are always relative to their parent container — never assume `sw`.
The most expensive bug in this project (3+ iterations on dialogue positioning) was caused by
treating building `w%` values as percentages of the screen width. They are percentages of the
district container. Any time a child element uses `%` sizing, ask: "% of what?"

### Truth 2: Parallax-dependent UI must add the parallax offset at the call site, not inside the component.
`PokemonTextBox` is a pure display component. It does not know about parallax. The parent
(WesternTown) must pass a pre-computed, parallax-adjusted `left` value. This separation of concerns
prevented the component from becoming stateful and kept the positioning math in one place.

### Truth 3: `overflow: hidden` is a free clip — use it instead of Math.min right-wall clamps.
The CRTScreen wrapper has `overflow: hidden`. World-layer elements (buildings, sky) already exploit
this. UI elements for buildings 4/5 should do the same: let the box push rightward with the building
and get naturally clipped, rather than being force-clamped to `sw - boxWidth - N` which creates
a visual disconnect between the building position and the box position.
