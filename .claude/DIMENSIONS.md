# DIMENSIONS.md — Western Town Asset & Layout Coordinate Map

> Load this file when tags `[POSITIONING]`, `[TOWN_PIXEL_ART]`, or `[TOWN_LOGIC]` are triggered.
> Purpose: eliminate guesswork in vertical/horizontal alignment by providing measured pixel
> dimensions, transparent-padding ratios, and the locked values that produce the correct visual result.

---

## 1. Asset Catalog — Native Dimensions & Padding

All PNGs live in `src/assets/images/town/`.

| Asset | Native px | Content px | Pad Top % | Pad Bot % | Pad Left % | Pad Right % | Notes |
|---|---|---|---|---|---|---|---|
| sky.png | 1943×809 | 1943×711 | 0.0 | 12.1 | 0.0 | 0.0 | 12% transparent at bottom |
| moon.png | 1254×1254 | 351×423 | 29.3 | 37.0 | 39.6 | 32.5 | Small content centered in large canvas |
| mesa.png | 1457×720 | 1457×334 | 34.0 | 19.6 | 0.0 | 0.0 | 34% sky above peaks, 20% empty below base |
| road.png | 1773×886 | 1773×443 | 0.0 | 50.0 | 0.0 | 0.0 | **Top 50% is road; bottom 50% is transparent** |
| saloon-closed.png | 1024×1024 | 789×963 | 2.0 | 4.0 | 12.5 | 10.4 | Tallest building — nearly full canvas |
| saloon-open.png | 1024×1024 | 789×963 | 2.0 | 4.0 | 12.5 | 10.4 | Identical bounds to closed |
| sheriff-closed.png | 1024×1024 | 785×903 | 7.9 | 3.9 | 12.9 | 10.4 | |
| sheriff-open.png | 1254×1254 | 971×1113 | 7.1 | 4.1 | 12.0 | 10.6 | Larger canvas than other buildings |
| bank-closed.png | 1024×1024 | 784×881 | 10.0 | 4.0 | 13.0 | 10.4 | |
| bank-open.png | 1024×1024 | 785×881 | 10.0 | 4.0 | 12.9 | 10.4 | |
| contact-closed.png | 1024×1024 | 718×502 | 41.0 | 10.0 | 14.9 | 14.9 | Shortest building — 41% top padding |
| contact-open.png | 1024×1024 | 716×528 | 40.9 | 7.5 | 15.0 | 15.0 | |

### Key Takeaways

- **road.png** only has visual content in the **top 50%**. Fix: use `<img height="200%">` inside an `overflow:hidden` container + `objectFit: cover` + `objectPosition: top`. This fills the container with road texture only.
- **mesa.png** has 34% transparent sky above the peaks and 19.6% transparent ground below. Native ratio 2.024:1. Container is ~5:1 (160% sw wide) so `fill` stretches/flattens peaks. Use `objectFit: cover` + `objectPosition: bottom center` to preserve aspect ratio and anchor base. Container bottom offset = `height * 0.196` below road top to compensate for transparent base padding.
- **Building PNGs** have ~4% bottom padding on average. Current code uses `objectFit: cover` + `objectPosition: bottom` — clips any top transparent area.
- **sky.png** has 12% transparent bottom. Use `objectFit: cover` + `objectPosition: center top` to fill container without showing transparent strip.
- **contact/telegraph** is dramatically shorter content (41% top padding) — PNG scales to container via `objectFit: cover`.

---

## 2. The Horizon Anchor — Zero Point Definition

```
Horizon = road top edge = bottom: sh * 0.10 from screen bottom

Everything above this line: sky, stars, moon, mesa peaks
Everything below this line: road surface, building bases, cowboys
```

### Road Internal Anatomy

The road PNG (1773×886) has its visual content in the **top 50%** (rows 0–443):
- Rows 0–110 (~12.5%): Dark shadow/edge — building bases sit here
- Rows 110–330 (~25%): Lighter center dirt — cowboys walk here
- Rows 330–443 (~12.5%): Far edge shadow
- Rows 443–886 (50%): Transparent — clipped by overflow:hidden

### Road PNG Implementation

Container: `bottom: 0`, `height: sh * 0.10`, `overflow: hidden`
Image: `height: 200%`, `objectFit: cover`, `objectPosition: top`

The img is twice the container height — road.png's top 50% (the visual road) maps exactly to the container. The transparent bottom 50% of the PNG extends below the container and is clipped.

---

## 3. Z-Index Sandwich (actual code values)

| Layer | z-index | Purpose |
|---|---|---|
| Sky | 10 | Backmost — full-screen background |
| Stars | 11 | Night only |
| Moon / Sun | 12 | Celestial body |
| Mesa | 14 | Horizon silhouette |
| Road | 15 | Ground surface — BEHIND buildings |
| Ambient characters | 20 | Walk behind buildings |
| Buildings container | 30 | Houses render IN FRONT of road |
| Tumbleweeds | 32 | Blow across in front of buildings |
| Title card | 35 | ZK title overlay |
| UI (toggles, CTA) | 42 | Always above world layers |
| District guide | 51 | Above UI for drag handle |
| Nav labels overlay | 100 | Tracks buildingsMV, above all world |
| Cinematic fade | 200 | Full-screen overlay |

### Z-Index Rule

Buildings (z:30) > Road (z:15): buildings render IN FRONT of road — they sit on the dirt.
Ambient (z:20) < Buildings (z:30): characters walk behind building facades.
Mesa (z:14) < Road (z:15): road covers mesa base at horizon.

---

## 4. Layout Values (actual code — `sh` = bezel screen height px)

| Layer | bottom | height | width | left | objectFit | objectPosition |
|---|---|---|---|---|---|---|
| Sky | top:0, bottom:0 | 100% | 160% | -30% | cover | center top |
| Stars | top:0, bottom:0 | — | 160% | -30% | — | — |
| Moon (night) | top: 8% | `sw * 0.035` | `sw * 0.035` | right: 12% | contain | — |
| Sun (day) | top: 6% | `sw * 0.045` | `sw * 0.045` | right: 10% | contain | — |
| Mesa | `sh * 0.18 - height * 0.196` = `sh * 0.047` ✅ | `sh * 0.68` ✅ | 160% | -30% | background-repeat:repeat-x backgroundSize:auto sh*0.68 backgroundPosition:left bottom | **CRITICAL: bottom = sh*0.18 - height*0.196. If height changes, recalculate bottom or base drifts. Never change height without updating bottom.** |
| Buildings container | SVG: `sh * 0.10` / PNG: `sh * 0.13` ✅ | SVG: `sh * 0.28` / PNG: `sh * 0.42` | per district | 2% / right:2% | — | — |
| Building img | bottom:0 | SVG: `sh * hPct` / PNG: `sh * hPct * 1.5` | `bldg.w %` | — | cover | bottom |
| Road | `0` | `sh * 0.10` | 160% | -30% | — | — |
| Road img | — | 200% | 100% | — | cover | top |
| Cowboys | computed | per char | per char | — | — | — |
| Tumbleweeds | `sh * 0.105` / `sh * 0.10` | 16px / 12px | — | — | — | — |

### Building Container vs Individual Building Heights

```
Container height:  sh * 0.28  (clips building bases into road via overflow:hidden)
Building heights:  sh * hPct  (saloon 0.22, sheriff 0.19, bank 0.20, telegraph 0.15)

All buildings shorter than 0.28 — no clipping occurs.
Container overflow:hidden clips only the bottom gap between building base and road.
```

---

## 5. Parallax Rates (actual code coefficients)

| Layer | MotionValue | Coefficient | Max shift (mouse at ±1) |
|---|---|---|---|
| Sky | skyMV | `sw * -0.02` | `sw * 0.02` = 2% |
| Celestial | celestialMV | `sw * -0.04` | `sw * 0.04` = 4% |
| Mesa | mesaMV | `sw * -0.08` | `sw * 0.08` = 8% |
| Buildings | buildingsMV | `sw * -0.15` | `sw * 0.15` = 15% |
| Road | groundMV | `sw * -0.25` | `sw * 0.25` = 25% |

Edge buffer: all extended layers are 160% wide with -30% left offset → `sw * 0.30` overhang each side, covering the 25% max road shift with margin.

---

## 6. Diagnostic Checklist

Before declaring any positioning task complete:

- [ ] Does mesa base (`bottom: sh*0.10`, `height: sh*0.35`) sit flush at road top edge?
- [ ] Are building bases seated in the dark shadow zone of the road? (`bottom: sh*0.10` matches road top)
- [ ] Do cowboys appear on the lighter dirt? (yPct ~0.88–0.91 range)
- [ ] Is the road PNG visible (not empty)? (`img height:200%`, `objectPosition:top`, `overflow:hidden` on container)
- [ ] Is the sky PNG visible? (`objectFit:cover`, `objectPosition:center top`)
- [ ] Does panning left/right reveal black edges? (160% width + -30% left covers 25% max parallax shift)
- [ ] Are buildings in front of road? (buildings z:30 > road z:15 ✅)
