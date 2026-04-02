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
