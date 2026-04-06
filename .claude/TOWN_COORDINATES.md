# TOWN_COORDINATES.md — Absolute Coordinate Map

> **Always load this file before modifying any WesternTown styles.**
> Never use relative increments (e.g., "move up a bit"); only use absolute values from this map.

---

## Core Principle: SVG is the Wireframe

The SVG layout IS the coordinate system. When adding pixel art mode, every PNG element must mirror the SVG element's position EXACTLY. The SVG renders with CSS gradients and shapes — PNGs are just texture swaps, not repositioning opportunities.

**The PNG is a texture swap. The layout comes from SVG.**

---

## Layout Anchor Points (from SVG source of truth)

| Element | bottom | height | Notes |
|---|---|---|---|
| Ground (road) | `0` | SVG: `sh * 0.10` / PNG: `sh * 0.18` | PNG road is taller to show full dirt surface |
| Building base | SVG: `sh * 0.10` / PNG: `sh * 0.13` | `sh * 0.28` (container) / `sh * bldg.hPct` (individual) | PNG: overlaps road by sh*0.05, landing in dark shadow zone |
| Mesa base | SVG: `sh * 0.10` / PNG: `sh * 0.18` | `sh * 0.35` | Matches road top anchor |
| Cowboys | `yPct * sh - scaledH + yOffset` | per character | SVG: yOffset=0 / PNG: yOffset=`sh * -0.08` (moves up) |
| Tumbleweeds | `sh * 0.105` | 16px / 12px | Slightly above SVG road surface |

### Building hPct values (per-building heights, `bHeight = sh * hPct`)

| Building | hPct | District |
|---|---|---|
| saloon | 0.22 | A (left) |
| sheriff | 0.19 | A (left) |
| bank | 0.20 | B (right) |
| telegraph | 0.15 | B (right) |

### Ambient character yPct values

| Character | yPct | Notes |
|---|---|---|
| HORSE_WAGON | 0.895 | Sits just above ground line |
| COWBOY_WALK | 0.905 | |
| NIGHT_RIDER | 0.880 | Slightly higher (horse gallop) |
| BANK_ROBBER | 0.908 | |

---

## Locked Layer Stack — ACTUAL CODE VALUES (bottom → top)

Both SVG and PNG modes share the same container positions. PNG img tags use objectFit to handle transparent padding.

| Layer | bottom | height | width / left | z-index | SVG/PNG | objectFit | objectPosition |
|---|---|---|---|---|---|---|---|
| Sky | `top:0, bottom:0` | 100% | `160%, left:-30%` | **10** | SVG: gradient / PNG: `<img>` | cover | center top |
| Stars | `top:0, bottom:0` | — | `160%, left:-30%` | **11** | SVG dots | — | — |
| Moon / Sun | `top: 8%/6%` | `sw*0.035 / sw*0.045` | auto, right:12%/10% | **12** | SVG glow / PNG: `<img>` | contain | — |
| **Mesa** | SVG: `sh * 0.10` / PNG: `sh * 0.18` | **`sh * 0.35`** | **`160%, left:-30%`** | **14** | SVG path / PNG: `<img>` | fill | — |
| **Title card** | — | — | — | **35** | — | — | — |
| **Buildings container** | SVG: `sh * 0.10` / PNG: `sh * 0.13` | **`sh * 0.28`** | per district % | **30** | SVG divs / PNG: `<img>` | cover | bottom |
| Ambient characters | yPct + yOffset (SVG:0 / PNG:`sh*-0.08`) | per char | — | **20** | SVG shapes | — | — |
| Tumbleweeds | `sh * 0.105` / `sh * 0.10` | 16px / 12px | — | **32** | — | — | — |
| **Road** | **`0`** | SVG: `sh * 0.10` / PNG: `sh * 0.18` | **`160%, left:-30%`** | **15** | SVG gradient / PNG: `<img height:200%>` | — | — |
| Nav labels overlay | inset:0 | — | — | **100** | — | — | — |
| UI (toggles, CTA) | — | — | — | **42** | — | — | — |
| District guide | `sh * 0.1` | — | — | **51** | — | — | — |
| Cinematic fade | inset:0 | — | — | **200** | — | — | — |

> **Road PNG special case**: img has `height: '200%'` inside the `sh * 0.10` container (overflow:hidden). road.png has 50% transparent bottom — doubling img height + `objectPosition: top` fills the container with only the visual road content.

---

## Z-Index Sandwich (actual code order, low → high)

```
z:200  Cinematic fade overlay
z:100  Nav labels / district overlay  ← tracks buildingsMV
z:51   District guide
z:42   UI (toggles, CTA, links)
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

| Layer | MotionValue | sw coefficient | % of screen shift |
|---|---|---|---|
| Sky | `skyMV` | `sw * -0.02` | 2% |
| Moon / Stars | `celestialMV` | `sw * -0.04` | 4% |
| Mesa | `mesaMV` | `sw * -0.08` | 8% |
| Buildings | `buildingsMV` | `sw * -0.15` | 15% |
| Road | `groundMV` | `sw * -0.25` | 25% |

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
