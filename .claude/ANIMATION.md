# ANIMATION.md — Pixel Art & Sprite Animation Best Practices

> Load this file when tag `[ANIMATION]` is triggered.

---

## Core Principles

### 1. Use `steps()` for Pixel Art

Never use linear or ease transitions for sprite animations — they cause "sliding" or "blur" between frames.

```css
@keyframes walk {
  from {
    background-position: 0px;
  }
  to {
    background-position: -1920px;
  } /* 6 frames × 320px */
}

.cowboy-walk {
  animation: walk 0.6s steps(6) infinite;
}
```

**Rule:** `steps(n)` where n = number of frames in the animation. This creates instant frame-to-frame transitions, maintaining the hard-edged pixel art look.

---

### 2. Decouple Internal vs External Animation

**Internal animation:** The sprite's legs/frames moving (CSS `steps()`)
**External animation:** The character moving across screen (Framer Motion)

These must be independent. The sprite animation runs on its own loop while Framer Motion handles x-position.

```tsx
// ✅ Correct: Separate concerns
<motion.div animate={{ x: newX }}>  {/* Framer Motion handles position */}
  <div className="sprite-walk" />   {/* CSS steps() handles legs */}
</motion.div>

// ❌ Wrong: Don't tie animation to position
<motion.div animate={{ x: newX, backgroundPosition: ... }} />  {/* Mixed concerns */}
```

---

### 3. Directional Flipping

Use `scaleX(-1)` on an **inner wrapper** so the flip doesn't affect x-coordinate calculations.

```tsx
<motion.div style={{ x: currentX }}>  {/* Outer: handles screen position */}
  <motion.div
    animate={{ scaleX: facingLeft ? -1 : 1 }}  {/* Inner: handles direction flip */}
    style={{ transformOrigin: 'center bottom' }}
  >
    <div className="sprite-walk" />
  </motion.div>
</motion.div>
```

**Why `center bottom`:** The cowboy flips from their feet, not their center.

---

### 4. Sync Animation Duration with Movement Velocity

If the cowboy walks 200px in 2 seconds, the walk animation must complete one cycle in 2 seconds to prevent "skating" (feet sliding on ground).

```css
/* Framer Motion: walk 200px in 2s */
/* CSS: 6 frames in 2s = 0.333s per cycle */
.walk-animation {
  animation: walk 0.333s steps(6) infinite;
}
```

---

### 5. GPU Acceleration for Parallax

Apply `will-change` to prevent lag during parallax scrolling:

```css
.sprite-container {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}
```

---

### 6. Pixel-Perfect Rendering

Always use `image-rendering: pixelated` (or `crisp-edges` for Safari):

```css
.sprite {
  image-rendering: pixelated; /* Chrome/Firefox */
  image-rendering: -webkit-crisp-edges; /* Safari */
}
```

---

## Sprite Sheet Standards

### Frame Uniformity

Every frame must have identical bounding box dimensions. If frame 1 is 64×128 and frame 2 is 60×128, the character will jitter during animation.

### Horizontal Layout

Arranging frames horizontally (`[frame0][frame1][frame2]...`) simplifies the math:

```css
background-position-x = frameIndex * frameWidth * -1
```

### Power of Two (Optional)

For optimal GPU texture memory, use dimensions like 256, 512, 1024. Not required for modern browsers but good practice.

---

## Z-Index for Animated Characters

Maintain strict layering:

| Layer              | Z-Index | Elements               |
| ------------------ | ------- | ---------------------- |
| Cinematic fade     | 200     | —                      |
| Nav labels         | 100     | —                      |
| UI                 | 42      | Toggles, CTA           |
| Title card         | 35      | ZK grid                |
| **Animated chars** | **55**  | DistrictGuide, cowboys |
| Buildings          | 30      | —                      |
| Road               | 15      | —                      |

Animated characters must be above buildings (30) but below UI (42) and title card (35).

---

## Timer-Based isMoving — Required Conditions

When using a `setTimeout` to flip a character from walking → idle (breathing), ALL three of the following must hold or the idle animation never plays:

1. **Any values in the effect's dependency array that derive from layout (sw, sh, buildingInfo) must be `useMemo`** — not IIFEs. IIFEs recompute every render; if they're effect deps, mouse-move re-renders keep re-triggering the effect, clearing the timer before it fires.

2. **Position-tracking refs must be initialized to match the character's rendered position on mount.** If the character renders at `initialX` via Framer Motion's `initial` prop but the ref starts at `0`, the first effect call sees a position mismatch and triggers a phantom walk, setting `isMoving=true` on mount. Fix: at the top of the effect, sync the ref if it hasn't been set:
   ```js
   if (positionRef.current === 0) positionRef.current = homeX
   ```

3. **The `moveGuide` early-return guard** (`if (targetX === currentXRef.current) return`) relies on the ref being accurate. Without condition 2, this guard never fires on mount and the phantom walk bypasses it.

## Implementation Checklist

- [ ] Use `animation-timing-function: steps(n)` where n = frame count
- [ ] Decouple sprite animation from position animation
- [ ] Use inner wrapper for `scaleX(-1)` direction flip
- [ ] Sync animation-duration with movement velocity
- [ ] Apply `will-change: transform` for GPU acceleration
- [ ] Use `image-rendering: pixelated`
- [ ] Maintain z-index 55 for navigation characters
- [ ] Ground character at `bottom: sh * 0.10` (road level)
- [ ] `useMemo` all layout-derived values that appear in effect deps
- [ ] Initialize position-tracking refs to match `initialX` on first effect run
