# ARCH_LOGIC.md — Architectural Truths & One-Shot Logic Patterns

> Load this file when tag `[ARCHITECTURE]` is triggered.
> Purpose: prevent re-deriving solved math, prevent re-litigating settled patterns,
> and pre-empt whole categories of iterative bugs.

---

## ✅ MAJOR SUCCESS: Saloon Interior Deep Lean Zoom (2026-04-02)

Solved the "zoom to seated POV" after 20+ failed attempts with DOM measurements.

**The Problem:** `getBoundingClientRect()` fails with transformed/scaled SVG layers. Layer offsets
(`left: -30%`, `width: 160%`) corrupt screen-space calculations. Height multipliers don't translate
from SVG coords to viewport coords.

**The Solution:** SVG-coordinate anchor approach.

```
// Source of Truth: Barkeep SVG group at translate(500, 170)
// Hat top in SVG coords: 170 + 8 = 178px

// Constants:
const SEATED_SCALE = 6.8
const SEATED_Y_OFFSET = -480  // fixed px, not percentage
const ZOOM_DURATION = 1.0

// Transform-origin anchored to hat top:
transformOrigin: 'center 178px'  // hat stays anchored at top of viewport

// Animation: scale + translateY decoupled
{ scale: SEATED_SCALE, y: SEATED_Y_OFFSET }
```

**Key insight:** Don't calculate midpoint positions with multipliers. Use the element's inherent
boundaries (top/center/bottom) and let scale + translateY do the work.

**3-Layer Parallax (correct):**

```
bgY: sh * 0.03   (moves down slightly — background falls behind)
npcY: sh * 0.01   (barely moves — anchor point)
barY: sh * 0.4    (moves down fast — exits bottom of viewport)
```

**Foreground lamp:** Must be in BACKGROUND layer, not bar layer. If in bar layer, it blocks
barkeep when layer moves down.

---

## ✅ MAJOR SUCCESS: Cinema-Slide (Nadir Tilt) (2026-04-02)

Replaced failing 3D hinge rotation with simple Y-axis slide. Scale is now a GLOBAL CONSTANT.

**The Problem:** 3D rotateX kept rotating in wrong direction despite multiple attempts to fix. Transform-origin
inheritance from parent `stageScope` corrupted the rotation pivot.

**The Solution:** Vertical slide instead of rotation.

```
// SCALE IS LOCKED — never changes during cinema-slide
const SEATED_SCALE = 6.8  // Global constant

// Cinema-Slide Animation:
const SLIDE_DURATION = 1.2 // seconds

// Wall slides UP off-screen
animateRoom({ y: '-100%' })

// Table starts at y: '100%' (below viewport), slides up to y: '0%' (visible)
animateSurface({ y: '0%' })
```

**Scale State Machine:**
| State | Scale | Notes |
|-------|-------|-------|
| Wide view | 1.0 | Initial state |
| Barkeep zoom | 6.8 | User clicks barkeep |
| Tilted | 6.8 | Unchanged — locked! |
| Look up | 6.8 | Unchanged — locked! |
| Back to wide | 1.0 | Only on explicit "Back" |

**Key insight:** Once seated, scale never changes until user explicitly exits the bar.

---

## ✅ MAJOR SUCCESS: Foreground Layer Architecture (2026-04-02)

**DEPRECATED: Nested Scaling** — scales inside zoomed parents cause "Deep Crop" bugs.
Use ForegroundLayer instead.

**The Problem:** Foreground elements inside the zoomed stage inherit 6.8× scale, appearing too large.

**The Solution: ForegroundLayer**

```
// ForegroundLayer is OUTSIDE the stage — no scale math needed!
<StageScope>           ← Contains Barkeep, zoomed at 6.8×
  <RoomScope>          ← Slides up when looking down
</StageScope>

<ForegroundLayer>     ← OUTSIDE stage, at 1:1 scale
  <BarSurface />      ← Table/menu unaffected by zoom
</ForegroundLayer>
```

**Standard for tabletop interactions:** Any item placed on the bar (menu, drinks, coins)
must use ForegroundLayer architecture. No scale calculations needed.

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

| Layer                                       | z   |
| ------------------------------------------- | --- |
| Sky                                         | 10  |
| Stars                                       | 11  |
| Celestial body                              | 12  |
| Ground                                      | 15  |
| Ambient characters                          | 20  |
| Buildings (default)                         | 30  |
| Tumbleweeds                                 | 32  |
| Title card                                  | 35  |
| UI (toggle, CTA)                            | 42  |
| PokemonTextBox                              | 60  |
| Foreground easter eggs                      | 51  |
| Zooming building (+ its district container) | 100 |
| Cinematic fade overlay                      | 200 |

Never insert a new layer without updating this table.
**Rule**: Never animate `zIndex` via Framer Motion `animate` prop — it tweens fractionally and makes elements vanish. Always set via `style` for instant snap.

### 1.3 Parallax Rate Assignments

| Element                         | translateX formula | Rate    |
| ------------------------------- | ------------------ | ------- |
| Sky                             | `mouseNorm * -15`  | slowest |
| Buildings (district containers) | `mouseNorm * -30`  | mid     |
| Ground                          | `mouseNorm * -45`  | fast    |
| Easter egg (mini-horse)         | same as ground     | fast    |

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

---

## Part 5 — Cinematic Transition System

### GLOBAL_TRANSITION_SPEED = 1200ms total

| Phase                                 | Duration                 | Notes                                  |
| ------------------------------------- | ------------------------ | -------------------------------------- |
| Building zoom to 50% screen height    | 500ms                    | ease [0.4,0,0.6,1], per-building scale |
| Fade trigger                          | at 300ms (60% into zoom) | building still inside frame            |
| Fade to black                         | 200ms                    | easeIn, overlaps final 40% of zoom     |
| Route swap (invisible — screen black) | ~0ms                     | React Router client nav                |
| Interior reveal (fade from black)     | 400ms                    | easeOut                                |
| Content entrance delay                | 150ms after reveal       | opacity+y on text/buttons              |
| Total                                 | ~1200ms                  |                                        |

### Per-Building Zoom Scale Formula

```
scale = clamp(0.50 / bldg.hPct, 1.5, 3.5)
```

Targets exactly 50% screen height at peak. Clamped so short buildings don't fly off screen
and tall buildings still produce a visible approach. Never use a hardcoded global scale.

### Zoom Architecture: World-Camera (NOT per-building scale)

The cinematic zoom scales the **world container** (`ref={worldScope}`), not individual buildings.

- `transformOrigin: '0 0'` on the world container — makes translate math trivial
- Per-click math: `S = clamp(0.50/hPct, 1.8, 3.0)`, `tx = sw/2 - cx*S`, `ty = sh/2 - cy*S`
- `cy = sh*0.90 - bHeight/2` (building vertical center from screen top)
- UI elements (toggle, textbox, fade overlay) live **outside** the world container — they never zoom
- Buildings keep static `zIndex: 30`, `overflow: hidden` on district containers — no elevation hacks needed
- Never scale individual buildings for the zoom — the whole world moves together

### Z-Index Escape for Clicked Building

District containers must NOT carry the z:30 value as a stacking context when a building zooms.
Instead: remove `zIndex` from the flex container and set `zIndex: isClicked ? 60 : 30` per building.
Also switch district container `overflow: hidden → visible` during `isZooming` to prevent clip.
The root `<div overflow:hidden>` at the CRTScreen level handles the final viewport clip.

### Mid-Way Fade Rationale

Fading at ~1.8× (half-screen fill) rather than 3.0+ feels more cinematic:

- User sees the building grow and "approach" before black — intention is communicated
- Route swap behind the black curtain is imperceptible
- Interior reveal from pure black feels like a hard-cut, not a glitch
