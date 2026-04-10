# TOWN_COORDINATES.md — Absolute Coordinate Map

> **Always load this file before modifying any WesternTown styles.**
> Never use relative increments (e.g., "move up a bit"); only use absolute values from this map.

---

## Core Principle: SVG is the Wireframe

The SVG layout IS the coordinate system. When adding pixel art mode, every PNG element must mirror the SVG element's position EXACTLY. The SVG renders with CSS gradients and shapes — PNGs are just texture swaps, not repositioning opportunities.

**The PNG is a texture swap. The layout comes from SVG.**

---

## Layout Anchor Points (from SVG source of truth)

| Element             | bottom                                                          | height                                                                                                                | Notes                                                                                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ground (road)       | `0`                                                             | SVG: `sh * 0.10` / PNG: `sh * 0.18`                                                                                   | PNG road is taller to show full dirt surface                                                                                                                                                                                          |
| Building base       | SVG/PNG: `sh * 0.13` ✅ LOCKED                                  | SVG: `sh * 0.28` (container) / PNG: `sh * 0.55` (container). Individual: `sh * hPct * 1.96` for PNG | **Scale=1.96. At this scale districts span 112.9% total — parallax reveals edges. A: left:10%, B: left:68% (absolute). Gap between A right (70.4%) and B left (68%) is ~2% overlap at center.** |
| Building horizontal | SVG: `left: 2%` (A) / `right: 2%` (B, computed). PNG: `left: 10%` (A) / `left: 68%` (B). **buildingInfo constants must match: DISTRICT_A_LEFT=0.10, DISTRICT_B_LEFT=0.68 in pixel art. NavMarker cx computed from these same anchors + per-building bw.** | —                                                                                                                     | **Centered: midpoint between districts at 50% screen center. Districts shifted to center stage gap. Spacing between buildings unchanged. Calculation: midpoint = DistrictA.right + stage_gap/2 = 50%, solving for anchor positions.** |
| Mesa base           | SVG: `sh * 0.10` / PNG: `sh * 0.18 - height * 0.196` ✅ FORMULA | SVG: `sh * 0.35` / PNG: `sh * 0.68` ✅ LOCKED                                                                         | PNG: background-repeat:repeat-x, backgroundSize:auto sh*0.68, backgroundPosition:left bottom. \*\*CRITICAL: bottom = sh*0.18 - height\*0.196. Increasing height MUST recalculate bottom or base drifts up.\*\*                        |
| Cowboys             | `yPct * sh - scaledH + yOffset`                                 | per character                                                                                                         | SVG: yOffset=0 / PNG: yOffset=`sh * -0.065` — feet land at sh\*0.84 from top (dark/light road boundary)                                                                                                                               |
| Tumbleweeds         | `sh * 0.105`                                                    | 16px / 12px                                                                                                           | Slightly above SVG road surface                                                                                                                                                                                                       |

### Building hPct values (per-building heights, `bHeight = sh * hPct`)

| Building  | hPct | District  |
| --------- | ---- | --------- |
| saloon    | 0.22 | A (left)  |
| sheriff   | 0.19 | A (left)  |
| bank      | 0.20 | B (right) |
| telegraph | 0.15 | B (right) |

### Ambient character yPct values

| Character   | yPct  | Notes                        |
| ----------- | ----- | ---------------------------- |
| HORSE_WAGON | 0.905 | Unified ground line          |
| COWBOY_WALK | 0.905 | Reference — visually correct |
| NIGHT_RIDER | 0.905 | Unified ground line          |
| BANK_ROBBER | 0.905 | Unified ground line          |

---

## Locked Layer Stack — ACTUAL CODE VALUES (bottom → top)

Both SVG and PNG modes share the same container positions. PNG img tags use objectFit to handle transparent padding.

| Layer                   | bottom                                                                                            | height                                 | width / left                    | z-index | SVG/PNG                                      | objectFit | objectPosition                                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------- | ------------------------------- | ------- | -------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sky                     | `top:0, bottom:0`                                                                                 | 100%                                   | `160%, left:-30%`               | **10**  | SVG: gradient / PNG: `<img>`                 | cover     | center top                                                                                                                                                  |
| Stars                   | `top:0, bottom:0`                                                                                 | —                                      | `160%, left:-30%`               | **11**  | SVG dots                                     | —         | —                                                                                                                                                           |
| Moon / Sun              | PNG: `calc(8% - size*0.293)` night / `calc(6% - size*0.293)` day                                  | PNG: `sw*0.32` night / `sw*0.40` day   | right: `calc(12% - size*0.325)` | **12**  | SVG glow / PNG: `<img>` contain              | —         | **CRITICAL: top/right must subtract padding offsets (top:29.3%, right:32.5%) when resizing or moon drifts. Formula: top = desired% - containerSize\*0.293** |
| **Mesa**                | SVG: `sh * 0.10` / PNG: `sh * 0.047` (= sh*0.18 - sh*0.68\*0.196) ✅                              | SVG: `sh * 0.35` / PNG: `sh * 0.68` ✅ | **`160%, left:-30%`**           | **14**  | SVG path / PNG: `background-repeat:repeat-x` | —         | left bottom                                                                                                                                                 |
| **Title card**          | `top: sh * 0.06`                                                                                  | SVG: `sh*0.26` height / PNG: `sh*0.38` height. Width: `min(heightDriver*2.1, sw*0.8)` | centered `left:0 right:0`       | **35**  | SVG: 2×2 grid div / PNG: `<img>`              | contain (PNG) | **To resize PNG titlecard: change `gridHeightDriver` (SVG=0.26, PNG=0.38). `objectFit:contain` preserves aspect ratio. Never move `top` without checking bezel clearance.** |
| **Buildings container** | SVG/PNG: `sh * 0.13` ✅ LOCKED. PNG horizontal: `left: 5%` (A) / `right: 12.84%` (B) — centers gap at 50% sw | SVG: `sh * 0.28` / PNG: `sh * 0.55`    | per district % × 1.96           | **30**  | SVG divs / PNG: `<img>`                      | cover     | bottom                                                                                                                                                      |
| Ambient characters      | yPct + yOffset (SVG:0 / PNG:`sh*-0.065`)                                                          | per char                               | —                               | **20**  | SVG shapes. Wrapped in `motion.div style={{ x: buildingsMV, inset:0 }}` — pans at same rate as buildings (sw*-0.15). Without wrapper, characters stay fixed while world pans. | — | — |
| **DistrictGuide**       | `bottom: sh * 0.10` ✅ LOCKED                                                                     | 120px rendered                         | 80px rendered, x via useAnimate | **55**  | PNG: walk=ezgif-split-navcowboy/tile000–005 / breath=ezgif-split-cowboybreath/ezgif-split/tile000–005 | contain | bottom center. Walk: 6×250ms, Breath: 6×333ms. isMoving drives frame set. scaleX(-1) inner wrapper for left-facing. To resize: change W/H constants in DistrictGuide.tsx only. |
| Tumbleweeds             | `sh * 0.105` / `sh * 0.10`                                                                        | 16px / 12px                            | —                               | **32**  | —                                            | —         | —                                                                                                                                                           |
| **Road**                | **`0`**                                                                                           | SVG: `sh * 0.10` / PNG: `sh * 0.18`    | **`160%, left:-30%`**           | **15**  | SVG gradient / PNG: `<img height:200%>`      | —         | —                                                                                                                                                           |
| Nav labels overlay      | inset:0                                                                                           | —                                      | —                               | **100** | —                                            | —         | —                                                                                                                                                           |
| UI (toggles, CTA)       | —                                                                                                 | —                                      | —                               | **42**  | —                                            | —         | —                                                                                                                                                           |
| District guide          | `sh * 0.1`                                                                                        | —                                      | —                               | **51**  | —                                            | —         | —                                                                                                                                                           |
| Cinematic fade          | inset:0                                                                                           | —                                      | —                               | **200** | —                                            | —         | —                                                                                                                                                           |

> **Road PNG special case**: img has `height: '200%'` inside the `sh * 0.10` container (overflow:hidden). road.png has 50% transparent bottom — doubling img height + `objectPosition: top` fills the container with only the visual road content.

---

## Z-Index Sandwich (actual code order, low → high)

```
z:200  Cinematic fade overlay
z:100  Nav labels / district overlay  ← tracks buildingsMV
z:51   District guide
z:42   UI (toggles, CTA, links)
z:55   DistrictGuide cowboys          ← PNG sprites, above buildings+UI, below labels
z:35   Title card (ZK grid)
z:32   Tumbleweeds
z:30   Buildings container            ← SVG and PNG buildings
z:20   Ambient characters
z:15   Road                           ← ground surface, behind buildings
z:14   Mesa                           ← horizon, behind road
z:12   Moon / Sun
z:11   Stars
z:10   Sky                            ← backmost
```

---

## Parallax Rates (actual code values)

| Layer        | MotionValue   | sw coefficient | % of screen shift |
| ------------ | ------------- | -------------- | ----------------- |
| Sky          | `skyMV`       | `sw * -0.02`   | 2%                |
| Moon / Stars | `celestialMV` | `sw * -0.04`   | 4%                |
| Mesa         | `mesaMV`      | `sw * -0.08`   | 8%                |
| Buildings    | `buildingsMV` | `sw * -0.15`   | 15%               |
| Road         | `groundMV`    | `sw * -0.25`   | 25%               |

Spring: `stiffness: 50, damping: 20`. mouseNorm range: `-1 → 1`.
Max road shift at edge = `sw * 0.25`. Container at 160% width with `-30%` left covers `±30%` = `sw * 0.30` — sufficient buffer.

---

## Parallax Edge Buffer Math

```
Road max shift:    sw * 0.25 (mouse fully left or right)
Container width:   160% of sw = sw * 1.6
Left offset:       -30% of sw = -sw * 0.3
Visible range:     sw * 1.6 - sw * 0.3 - sw = sw * 0.3 of overhang each side
Required buffer:   sw * 0.25 (max shift) < sw * 0.30 (available) ✅
```

---

## Modification Protocol

1. **Read this file** before any positioning change
2. **Find the SVG element first** — its CSS values are the source of truth
3. **Mirror SVG positions exactly** for pixel art PNG containers
4. **If a value must change**, update this file FIRST, then apply to code
5. **After any change**, verify the z-sandwich order still holds

## Why Previous Pixel Art Fixes Failed

1. SVG buildings have **varied heights** (hPct per building). Pixel art mode must use the same `sh * hPct` heights.
2. SVG uses `sh * 0.1` (JS pixels). Earlier fixes used `vh` units — different systems caused drift.
3. road.png has 50% transparent bottom. Without `height: 200%` + `objectPosition: top`, the container appears empty.
4. mesa.png has 34% transparent top. `objectFit: fill` stretches it — use `cover` or `fill` only if the container matches content proportions.
5. **Aspect ratio distortion**: Scaling only height (`hPct * 1.5`) without scaling width stretches the 1:1 PNG assets vertically. Always scale uniformly: width multiplier × N, height multiplier × N, container width × N.
