# Best Practices

## `[FRAMER_MOTION]` — Saloon Interior Zoom (2026-04-02)

**SUCCESS: SVG-coordinate anchor for zoom transforms**

When implementing zoom-to-seat animations in SVG-based scenes:

1. **Use SVG coordinates as source of truth, not DOM measurements**
   - `getBoundingClientRect()` fails with transformed/scaled SVG layers
   - Layer offsets (`left: -30%`, `width: 160%`) corrupt screen-space calculations
   - Height multipliers (`height * 0.75`, `height * 4`) don't translate from SVG to viewport

2. **Anchor transform-origin to a known SVG coordinate**
   - Barkeep SVG group at `translate(500, 170)`
   - Calculate anchor: `170 + 8 (hat brim) = 178px`
   - Use: `transformOrigin: 'center 178px'`
   - Hat stays anchored at top of viewport during scale

3. **Decouple scale from translateY**
   - Scale: `6.8×` — zooms from anchor point
   - TranslateY: `-480px` (fixed, not percentage) — pulls lower elements into frame
   - Don't try to calculate midpoint positions with multipliers

4. **Constants over magic numbers**

   ```js
   const SEATED_SCALE = 6.8
   const SEATED_Y_OFFSET = -480
   const ZOOM_DURATION = 1.0
   ```

5. **Layered parallax works correctly**
   - Background: slow vertical movement
   - NPC: anchor point, minimal movement
   - Foreground bar: fast downward movement to exit viewport

---

## `[FRAMER_MOTION]` — Cinema-Slide (Nadir Tilt) (2026-04-02)

**SUCCESS: Vertical slide instead of 3D hinge rotation**

After the 3D hinge kept rotating in wrong direction, replaced with simple Y-axis slide:

1. **Scale is GLOBAL CONSTANT — never changes during cinema-slide**
   - Once user reaches seated state (6.8×), scale STAYS at 6.8× throughout
   - No `animate: { scale }` calls inside cinema-slide functions
   - Look Down: scale = 6.8× (unchanged)
   - Look Up: scale = 6.8× (unchanged)

2. **The Cinema-Slide Animation**

   ```js
   // Wall slides UP off-screen
   animateRoom({ y: '-100%' })

   // Table slides UP from bottom of viewport
   animateSurface({ y: '0%' }) // starts at y: '100%'
   ```

3. **Initial State for Table**

   ```jsx
   <motion.div
     initial={{ y: '100%' }} // starts at bottom of viewport
     style={{ position: 'absolute', inset: 0 }}
   />
   ```

4. **Constants**

   ```js
   const SLIDE_DURATION = 1.2 // seconds
   ```

5. **Menu Timing**
   - Menu slides in ONLY AFTER surface reaches `y: '0%'`
   - Use `isTransitioning` state to gate menu visibility

6. **The Rotation Task: Physically Accurate**
   - You killed the rotation direction task — the implementation is now correct
   - Use Cinema-Slide for reliable, predictable behavior

---

## `[FRAMER_MOTION]` — Foreground Layer (2026-04-02)

**DEPRECATED: Nested Scaling** — scales inside zoomed parents cause "Deep Crop" bugs.
Use **ForegroundLayer** architecture instead.

### ForegroundLayer Architecture

Foreground elements (menu, bar surface) live in their own layer OUTSIDE the stage:

```
<StageScope>           ← Contains Barkeep, zoomed at 6.8×
  <RoomScope>          ← Slides up when looking down
</StageScope>

<ForegroundLayer>     ← OUTSIDE stage, at 1:1 scale
  <BarSurface />       ← Table/menu unaffected by zoom
</ForegroundLayer>
```

**Implementation:**

```jsx
{/* ── Stage — contains Barkeep ── */}
<motion.div ref={stageScope}>
  {/* zoom animations */}
</motion.div>

{/* ── Foreground Layer — OUTSIDE stage ── */}
<motion.div
  ref={foregroundScope}
  initial={{ y: '100%' }}
  style={{ pointerEvents: 'none' }} // Allow clicks to pass through
>
  <BarSurface ... />
</motion.div>
```

**Animation:**

```js
// Look Down: Room slides up, Foreground slides in from bottom
await Promise.all([animateRoom({ y: '-100%' }), animateForeground({ y: '0%' })])

// Look Up: Room slides back, Foreground slides back down
await Promise.all([animateRoom({ y: '0%' }), animateForeground({ y: '100%' })])
```

**Benefits:**

- No scale calculations needed (1:1 scale)
- Menu appears at natural size
- Clicks pass through to Barkeep
- Any future bar items (drinks, coins) go here

### DEPRECATED: Inverse Scale Math

```js
// DO NOT USE — too complex, causes bugs
const FOREGROUND_SCALE = 1 / SEATED_SCALE // deprecated
```

---

## `[TOWN_PIXEL_ART]` — PNG Mode Toggle (2026-04-05)

**SUCCESS: isPixelArt state + BUILDING_IMAGES map for full layer swap**

1. **Single boolean gates all layers** — `isPixelArt` state in WesternTown controls sky, moon/celestial, mesa, road, and all 5 buildings via conditional rendering
2. **BUILDING_IMAGES map** — keyed by building ID, value is `{ closed: string, open: string }` — swap on hover using same hover state that drives SVG open/closed variants
3. **PNG hover swap** — buildings show `closed` PNG by default, `open` PNG when hovered. Mirrors the existing SVG open/closed logic exactly; no new state needed
4. **All world-layer PNGs** (z ≤ 35) — sky.png, moon.png, mesa.png, road.png live in `src/assets/images/town/`. 12 PNGs total.
5. **Toggle button** sits next to day/night toggle at UI layer (z:42). Symbol: `■` for SVG mode, `△` for PNG mode.
6. **Parallax, NavMarker, ambient characters all preserved** — pixel art mode only swaps visual layer content, not layout or interaction logic

---

## `[TOWN_LOGIC]` `[ANIMATION]` — DistrictGuide isMoving / Breathing Animation (2026-04-09)

**PATTERN: Three things must all be true for timer-based isMoving to work correctly.**

1. **Memoize derived positions** — `buildingInfo`, `guideAHome`, `guideBHome` must all be `useMemo` (not IIFEs). IIFEs recompute every render; if they're in effect deps they re-trigger `moveGuide` on every mouse-move, permanently resetting the `isMoving=false` timer before it fires.

2. **Memoize `buildingInfo` on `[sw, sh, isPixelArt]`** — these are the only values that can change it. `sw`/`sh` come from `useBezel` which only updates on `resize`, so the memo is stable during normal interaction.

3. **Initialize position-tracking refs to match the rendered initial position** — `guideAX` and `guideBX` start at `0` but the guides render at `guideAHome` via `initial={{ x: initialX }}`. On the first effect call, `targetX !== 0` triggers a phantom walk to home, sets `isMoving=true` for 1.5s. Fix: at the top of the effect, sync refs to home values if they haven't been set yet:
   ```js
   if (guideAX.current === 0) guideAX.current = guideAHome
   if (guideBX.current === 0) guideBX.current = guideBHome
   ```
   After this, the first `moveGuide` call sees `targetX === currentXRef.current` → early return → `isMoving` never goes true → breathing plays from frame 1 on mount.

**Why:** Without all three, the breathing animation never plays — `isMoving` stays permanently `true` because either (a) re-renders keep resetting the timer, or (b) the phantom mount-walk sets `isMoving=true` before the user even touches the page.

---

## `[TOWN_LOGIC]` `[TOWN_PIXEL_ART]` — buildingInfo as Single Source of Truth (2026-04-06)

**PATTERN: All building-derived positions (NavMarkers AND DistrictGuide cowboys) read from `buildingInfo`. Fixing cx there fixes both simultaneously.**

1. **`buildingInfo` is the single coordinate source** for everything that must track a building — NavMarker labels (`cx`, `roofY`) and DistrictGuide home positions (`cx - bw/2 - 20`) both derive from it
2. **Building width formula** — `bldg.w * scale %` is a % of the *district container*, not of `sw`. Correct: `bw = (bldg.w * scale / 100) * containerW_px` where `containerW_px = rawSumW * scale / 100 * sw`
3. **roofY in pixel art** — container bottom is at `sh * 0.13` from screen bottom = `sh * 0.87` from top, buildings scale 1.96×. Formula: `roofY = sh * 0.87 - sh * bldg.hPct * 1.96`
4. **Consequence**: any time pixel art building anchor (`left: 10%` / `left: 68%`) or scale changes, update `buildingInfo` constants (`DISTRICT_A_LEFT`, `DISTRICT_B_LEFT`, `bldgScale`) — all downstream label and guide positions auto-correct

---

## `[BUILDING_INTERIOR]` — 3D CSS Book Flip (2026-04-05)

**SUCCESS: rotateY page flip with backfaceVisibility + z:999 hitboxes**

1. **CSS 3D flip, not Framer Motion** — use `style={{ transform: \`rotateY(${flipped ? 180 : 0}deg)\` }}` + `transition: 'transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)'`
2. **backfaceVisibility: 'hidden'** on each page face — prevents bleed-through during mid-flip
3. **Hitbox pattern for pointerEvents override** — parent has `pointerEvents: 'none'`; clickable zones use `style={{ position: 'absolute', zIndex: 999, pointerEvents: 'auto' }}`
4. **Page structure** — page 0 = front face (`rotateY(0deg)`), page 1 = back face (`rotateY(-180deg)` initial, counter-rotates on flip)
5. **`entryBuilding` prop removed** from both `HomePage.tsx` and `WesternTown.tsx` — building routing handled by React Router, not prop drilling
