import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, useAnimate, useSpring, useTransform } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useBezelContext } from '@/contexts/BezelContext'
import { useUIStore } from '@/store/uiStore'
// import { PokemonTextBox } from '@/components/PokemonTextBox'  // kept for in-building use
import { AmbientEntity, CHARACTER_MANIFEST } from '@/components/ambient/AmbientEntity'
import { DistrictGuide } from '@/components/DistrictGuide'
import { NavMarker } from '@/components/NavMarker'
import type { CharacterDef } from '@/components/ambient/AmbientEntity'

// ─── Sky gradients (5-stop warm sunset) ─────────────────────────────────────

const NIGHT_SKY = 'linear-gradient(180deg, #0a0612 0%, #1a0a2e 20%, #2d1a0a 55%, #3d2008 75%, #1a0d04 100%)'
const DAY_SKY = 'linear-gradient(180deg, #1a3a5c 0%, #2d6a8a 15%, #87CEEB 45%, #FDB97D 75%, #F4A460 100%)'

// ─── Ground gradients ───────────────────────────────────────────────────────

const NIGHT_GROUND = 'linear-gradient(180deg, #2d1a04 0%, #0a0804 100%)'
const DAY_GROUND = 'linear-gradient(180deg, #C4A050 0%, #8B6914 100%)'

// ─── Palette tokens ─────────────────────────────────────────────────────────

const DAY = {
  building: '#5a3a10',
  buildingBorderTop: 'rgba(255,150,50,0.1)',
  windowBg: '#ffe082',
  windowGlow: 'none',
  tumbleweed: '#8B6914',
  toggleBg: '#1a1207',
  toggleText: '#F2C94C',
  footerText: 'rgba(26,18,7,0.45)',
  panelBorder: 'rgba(26,18,7,0.3)',
  estText: 'rgba(80,40,10,0.6)',
  roleText: 'rgba(100,60,20,0.55)',
}

const NIGHT = {
  building: '#1a0d04',
  buildingBorderTop: 'rgba(255,150,50,0.1)',
  windowBg: '#ff8c00',
  windowGlow: '0 0 8px rgba(255,140,0,0.53), 0 0 16px rgba(204,102,0,0.27)',
  tumbleweed: '#5a4a2a',
  toggleBg: '#f0efe9',
  toggleText: '#0a0e1a',
  footerText: 'rgba(240,239,233,0.35)',
  panelBorder: 'rgba(240,239,233,0.15)',
  estText: 'rgba(180,100,40,0.6)',
  roleText: 'rgba(200,140,60,0.55)',
}

// ─── Title card grid colors ─────────────────────────────────────────────────

const TITLE_GRID_NIGHT = ['#3d2a08', '#2a0a1a', '#0a1a08', '#0a0a2a']
const TITLE_GRID_DAY = ['#c4821a', '#8b3a1a', '#4a6b1a', '#1a4a6b']

const SCANLINE_TEXTURE =
  'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)'

// ─── Stars ──────────────────────────────────────────────────────────────────

const STARS = Array.from({ length: 18 }, () => ({
  x: Math.random() * 100,
  y: Math.random() * 50,
  size: 1 + Math.random() * 1.5,
  delay: Math.random() * 3,
  duration: 2 + Math.random() * 2,
}))

// ─── Districts ───────────────────────────────────────────────────────────────
// Two groups flanking a 27% centre gap ("The Stage").
// Widths reduced ~10% vs original. Heights remain sh-relative.
//
// District A (left):  saloon + sheriff
// District B (right): bank + general + telegraph

const DISTRICT_A = [
  { id: 'saloon',   w: 16, hPct: 0.22, windows: 4, hasSign: true,  hasPeak: true  },
  { id: 'sheriff',  w: 14, hPct: 0.19, windows: 3, hasSign: true,  hasPeak: false },
]

const DISTRICT_B = [
  { id: 'bank',      w: 14, hPct: 0.20, windows: 3, hasSign: true,  hasPeak: false },
  { id: 'general',   w: 12, hPct: 0.14, windows: 2, hasSign: false, hasPeak: false },
  { id: 'telegraph', w: 12, hPct: 0.15, windows: 2, hasSign: false, hasPeak: false },
]


// ─── Transition ─────────────────────────────────────────────────────────────

const CROSS = 1.5 // 1.5s day/night transition

// ─── Component ──────────────────────────────────────────────────────────────

// ─── Entry sequence timings ───────────────────────────────────────────────────
// t=0ms:   guide fade starts (200ms) + door swing starts (300ms) — PARALLEL
// t=350ms: fade to black (150ms) — door is visibly open, void colour is showing
// t=500ms: navigate to interior
// Town stays perfectly still throughout — no scale, no transform-origin.
const GUIDE_FADE_MS = 200   // ms: guide fades out
const DOOR_OPEN_MS  = 300   // ms: door swings open (rotateY -90)
const FADE_START_MS = 350   // ms: absolute time when fade begins
const FADE_DURATION = 0.15  // seconds: hard cut to black

export function WesternTown({ entryBuilding }: { entryBuilding?: string } = {}) {
  const navigate = useNavigate()

  // ── Bezel dimensions — must come before any derived value or effect ───────
  const b  = useBezelContext()
  const sw = b.width
  const sh = b.height

  const isNight    = useUIStore((s) => s.isNight)
  const toggleNight = useUIStore((s) => s.toggleNight)
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null)
  const [clickedBuilding, setClickedBuilding] = useState<string | null>(null)
  // mouseNorm: raw -1→1 value used synchronously for click math & guide walk
  const [mouseNorm, setMouseNorm] = useState(0)

  const [fadeScope,   animateFade]   = useAnimate()
  const [guideAScope, animateGuideA] = useAnimate()
  const [guideBScope, animateGuideB] = useAnimate()
  const containerRef = useRef<HTMLDivElement>(null)

  // Track each guide's current x so we can derive facing direction on next move
  const guideAX = useRef(0)  // updated whenever we animate Guide A
  const guideBX = useRef(0)  // updated whenever we animate Guide B

  // Facing direction state — 1 = right, -1 = left
  const [guideAFacing, setGuideAFacing] = useState<1 | -1>(1)
  const [guideBFacing, setGuideBFacing] = useState<1 | -1>(-1)

  // ── Spring-damped parallax camera ────────────────────────────────────────
  // mouseSpring smoothly trails mouseNorm — stiffness:50 damping:20 gives
  // a gentle "settle" after the mouse stops (overshoots slightly then rests).
  // MotionValues drive layer transforms directly — no React re-render per frame.
  const mouseSpring = useSpring(mouseNorm, { stiffness: 50, damping: 20 })

  // Per-layer x offsets in px (MotionValues — applied via style={{ x: mv }})
  // Zero-point = mouse at center (mouseNorm=0). Mouse right → layers shift left.
  // Layer speeds: sky 2%, celestial 4%, mesa 8%, buildings 15%, ground 25%
  const skyMV       = useTransform(mouseSpring, v => v * sw * -0.02)
  const celestialMV = useTransform(mouseSpring, v => v * sw * -0.04)
  const mesaMV      = useTransform(mouseSpring, v => v * sw * -0.08)
  const buildingsMV = useTransform(mouseSpring, v => v * sw * -0.15)
  const groundMV    = useTransform(mouseSpring, v => v * sw * -0.25)

  // Synchronous buildingsX for click math (uses raw mouseNorm, not the spring)
  // This keeps door focal point calculation correct at the instant of click.
  const buildingsX = mouseNorm * sw * -0.15

  // ── Derived values (need sw/sh — computed before any effect) ─────────────
  const palette = isNight ? NIGHT : DAY

  // Grid dimensions (2:1 aspect, capped at 80% screen width for mobile)
  const gridNatural = sh * 0.26 * 2.1
  const gridWidth   = Math.min(gridNatural, sw * 0.8)
  const gridHeight  = gridWidth / 2.1
  const gridCapped  = gridNatural > sw * 0.8

  // Lock parallax during zoom — freeze spring at 0 when zooming
  const isZooming = clickedBuilding !== null

  // Building center lookup — pixel widths relative to each district container
  const GAP_PX = sw * 0.006

  const buildingInfo = (() => {
    const map: Record<string, { cx: number; bw: number; hPct: number }> = {}

    // District A: container left = sw*0.02
    const aContainerPct = DISTRICT_A.reduce((s, b) => s + b.w, 0) + (DISTRICT_A.length - 1) * 0.8
    const aContainerW   = sw * aContainerPct / 100
    const aContainerL   = sw * 0.02
    let cursor = aContainerL
    for (const bldg of DISTRICT_A) {
      const bw = (bldg.w / 100) * aContainerW
      map[bldg.id] = { cx: cursor + bw / 2, bw, hPct: bldg.hPct }
      cursor += bw + GAP_PX
    }

    // District B: container right = sw*0.98
    const bContainerPct = DISTRICT_B.reduce((s, b) => s + b.w, 0) + (DISTRICT_B.length - 1) * 0.8
    const bContainerW   = sw * bContainerPct / 100
    const bContainerL   = sw * 0.98 - bContainerW
    cursor = bContainerL
    for (const bldg of DISTRICT_B) {
      const bw = (bldg.w / 100) * bContainerW
      map[bldg.id] = { cx: cursor + bw / 2, bw, hPct: bldg.hPct }
      cursor += bw + GAP_PX
    }

    return map
  })()

  // ── Freeze spring while transition plays so layers don't drift ──────────
  // jump() to current value — stops spring motion without resetting position.
  useEffect(() => {
    if (isZooming) mouseSpring.jump(mouseSpring.get())
  }, [isZooming, mouseSpring])

  // ── Ambient character spawner ────────────────────────────────────────────
  type ActiveChar = { instanceId: string; def: CharacterDef; direction: 'ltr' | 'rtl' }
  const [activeChars, setActiveChars] = useState<ActiveChar[]>([])
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const instanceCounter = useRef(0)

  const spawnNext = useCallback((night: boolean) => {
    setActiveChars((prev) => {
      if (prev.length >= 3) return prev

      const candidates = CHARACTER_MANIFEST.filter((d) => !d.nightOnly || night)
      if (candidates.length === 0) return prev

      const def = candidates[Math.floor(Math.random() * candidates.length)]
      const direction = Math.random() < 0.5 ? 'ltr' : 'rtl'
      const instanceId = `char-${++instanceCounter.current}`

      return [...prev, { instanceId, def, direction }]
    })
  }, [])

  const handleEntityComplete = useCallback((instanceId: string) => {
    setActiveChars((prev) => prev.filter((c) => c.instanceId !== instanceId))
  }, [])

  useEffect(() => {
    spawnTimerRef.current = setTimeout(() => {
      spawnNext(isNight)
      const schedule = () => {
        const delay = 3000 + Math.random() * 7000
        spawnTimerRef.current = setTimeout(() => {
          spawnNext(isNight)
          schedule()
        }, delay)
      }
      schedule()
    }, 500)

    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNight])

  // ── District guide walk ───────────────────────────────────────────────────
  // Home base: 20px to the left of each district's first building door centre.
  // Guide A idles next to Building 1 (saloon). Guide B next to Building 4 (bank).
  // On hover: walk to that building's door. On un-hover: walk home.
  // Facing direction is derived from current x vs target x — guide flips before moving.

  const WALK_DUR  = 1.5    // seconds — steady, weighted walk
  const WALK_EASE = 'easeInOut' as const

  // Anchor helpers — world-space x (no buildingsX — the parent layer handles pan)
  const guideAHome = (() => {
    const info = buildingInfo[DISTRICT_A[0].id]   // saloon
    if (!info) return sw * 0.02
    return info.cx - info.bw / 2 - 20  // left edge of saloon - 20px
  })()

  const guideBHome = (() => {
    const info = buildingInfo[DISTRICT_B[0].id]   // bank
    if (!info) return sw * 0.65
    return info.cx - info.bw / 2 - 20  // left edge of bank - 20px
  })()

  const moveGuide = useCallback((
    scope: React.RefObject<HTMLDivElement | null>,
    animate: (el: Element, keyframes: Record<string, unknown>, opts?: Record<string, unknown>) => void,
    targetX: number,
    currentXRef: React.MutableRefObject<number>,
    setFacing: (f: 1 | -1) => void,
  ) => {
    if (!scope.current) return
    const facing: 1 | -1 = targetX >= currentXRef.current ? 1 : -1
    setFacing(facing)
    currentXRef.current = targetX
    animate(scope.current, { x: targetX }, { duration: WALK_DUR, ease: WALK_EASE })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (isZooming) return
    const inA = hoveredBuilding ? DISTRICT_A.some((b) => b.id === hoveredBuilding) : false
    const inB = hoveredBuilding ? DISTRICT_B.some((b) => b.id === hoveredBuilding) : false

    // Guide A
    if (inA && hoveredBuilding) {
      const info = buildingInfo[hoveredBuilding]
      if (info) {
        const targetX = info.cx - 10   // world-space; parent layer handles pan
        moveGuide(guideAScope, animateGuideA, targetX, guideAX, setGuideAFacing)
      }
    } else {
      moveGuide(guideAScope, animateGuideA, guideAHome, guideAX, setGuideAFacing)
    }

    // Guide B
    if (inB && hoveredBuilding) {
      const info = buildingInfo[hoveredBuilding]
      if (info) {
        const targetX = info.cx - 10   // world-space; parent layer handles pan
        moveGuide(guideBScope, animateGuideB, targetX, guideBX, setGuideBFacing)
      }
    } else {
      moveGuide(guideBScope, animateGuideB, guideBHome, guideBX, setGuideBFacing)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoveredBuilding, isZooming, guideAHome, guideBHome])

  // ── Door reveal → fade → navigate ────────────────────────────────────────
  // Town stays still. Sequence:
  //   t=0ms:   guide fade (200ms) + door swing (300ms) run in parallel
  //   t=350ms: fade to black (150ms) — door open, void colour visible
  //   t=500ms: navigate
  const handleBuildingClick = useCallback(async (
    buildingId: string,
    inDistrictA: boolean,
  ) => {
    if (clickedBuilding) return
    setClickedBuilding(buildingId)
    setHoveredBuilding(null)

    // t=0: guide fades out (200ms), door swings via clickedBuilding state (300ms)
    const guideScope = inDistrictA ? guideAScope : guideBScope
    const animGuide  = inDistrictA ? animateGuideA : animateGuideB
    if (guideScope.current) {
      animGuide(guideScope.current, { opacity: 0 }, { duration: GUIDE_FADE_MS / 1000, ease: 'easeOut' })
    }

    // t=350ms: door is visibly open — cut to black
    await new Promise((r) => setTimeout(r, FADE_START_MS))
    await animateFade(
      fadeScope.current,
      { opacity: 1 },
      { duration: FADE_DURATION, ease: 'easeIn' }
    )

    navigate(`/building/${buildingId}`, { state: { fromBuilding: buildingId } })
  }, [clickedBuilding, guideAScope, guideBScope, animateGuideA, animateGuideB,
      animateFade, fadeScope, navigate])

  // ── Mouse parallax handler ───────────────────────────────────────────────
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const norm = ((e.clientX - rect.left) / rect.width - 0.5) * 2  // -1 to 1
    setMouseNorm(norm)      // sync value for click math
    mouseSpring.set(norm)   // spring target — animates toward this value
  }, [mouseSpring])

  return (
    <div
      ref={containerRef}
      onMouseMove={isZooming ? undefined : onMouseMove}
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════════════
          WORLD CONTAINER — everything that zooms with the camera.
          UI elements (toggle, textbox, fade overlay) sit OUTSIDE this wrapper.
      ══════════════════════════════════════════════════════════════════════ */}
      <div
        style={{
          position: 'absolute',
          inset:    0,
        }}
      >

      {/* ═══════ z:10 — SKY GRADIENT (parallax layer 1, -2% shift) ═══════ */}
      <motion.div
        animate={{ background: isNight ? NIGHT_SKY : DAY_SKY }}
        transition={{ duration: CROSS }}
        style={{
          position: 'absolute',
          top:      0,
          bottom:   0,
          left:     '-30%',
          width:    '160%',
          zIndex:   10,
          x:        skyMV,
        }}
      />

      {/* ═══════ z:11 — STARS (night only) ═══════ */}
      <AnimatePresence>
        {isNight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: CROSS }}
            style={{ position: 'absolute', top: 0, bottom: 0, left: '-30%', width: '160%', zIndex: 11, pointerEvents: 'none', x: skyMV }}
          >
            {STARS.map((star, i) => (
              <motion.div
                key={i}
                animate={{ opacity: [0.2, 0.9, 0.2] }}
                transition={{ duration: star.duration, delay: star.delay, repeat: Infinity, ease: 'easeInOut' as const }}
                style={{
                  position: 'absolute',
                  left: `${star.x}%`,
                  top: `${star.y}%`,
                  width: star.size,
                  height: star.size,
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══════ z:12 — CELESTIAL BODY ═══════ */}
      <motion.div
        animate={{
          background: isNight
            ? 'radial-gradient(circle, #e8e4d4 0%, #c8c0a8 40%, transparent 70%)'
            : 'radial-gradient(circle, #fff8e0 0%, #FFD700 35%, #FFA500 65%, transparent 85%)',
          boxShadow: isNight
            ? '0 0 40px 12px rgba(200,192,168,0.3), 0 0 80px 24px rgba(200,192,168,0.15)'
            : '0 0 50px 15px rgba(255,200,60,0.4), 0 0 100px 40px rgba(255,200,60,0.2)',
        }}
        transition={{ duration: CROSS }}
        style={{
          position: 'absolute',
          top: isNight ? '8%' : '6%',
          right: isNight ? '12%' : '10%',
          width: isNight ? Math.max(28, sw * 0.035) : Math.max(36, sw * 0.045),
          height: isNight ? Math.max(28, sw * 0.035) : Math.max(36, sw * 0.045),
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 12,
          x: celestialMV,
        }}
      />

      {/* ═══════ z:14 — MESA HORIZON (parallax layer 2.5, -8% shift) ═══════ */}
      {/* SVG fills 160% world-width. Horizon sits at bottom 30% of sky zone.  */}
      {/* Single flat-top mesa silhouette: two plateaus with a saddle between. */}
      <motion.div
        style={{
          position:      'absolute',
          bottom:        sh * 0.10,   // sits flush on top of ground
          left:          '-30%',
          width:         '160%',
          height:        sh * 0.35,   // tall enough to show full profile
          zIndex:        14,
          pointerEvents: 'none',
          x:             mesaMV,
        }}
      >
        <svg
          viewBox="0 0 160 100"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          style={{ display: 'block' }}
        >
          {/* Mesa path: left plateau, saddle, right wider plateau, then fill to bottom */}
          {/* Coordinates in viewBox units (160×100):                                   */}
          {/*   lower-left corner → climb left mesa → flat top → saddle dip →          */}
          {/*   right mesa wider & slightly lower → descend → lower-right corner        */}
          <path
            d={[
              'M 0 100',        // bottom-left
              'L 0 72',         // left edge rises
              'L 14 42',        // left mesa shoulder
              'L 28 40',        // left plateau top (flat)
              'L 38 52',        // saddle dip
              'L 50 48',        // saddle floor
              'L 62 52',        // saddle dip right side
              'L 76 36',        // right mesa left shoulder
              'L 106 35',       // right plateau top (wider, slightly lower)
              'L 124 48',       // right mesa right shoulder
              'L 138 58',       // tail ridge
              'L 160 62',       // right edge
              'L 160 100',      // bottom-right
              'Z',
            ].join(' ')}
            fill={isNight ? '#2D2430' : '#BCAAA4'}
            style={{ transition: `fill ${CROSS}s` }}
          />
        </svg>
      </motion.div>

      {/* ═══════ z:35 — 2×2 TITLE CARD ═══════ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' as const }}
        style={{
          position: 'absolute',
          top: sh * 0.06,
          left: 0,
          right: 0,
          zIndex: 35,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: gridWidth,
            height: gridHeight,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            border: '2px solid rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {(isNight ? TITLE_GRID_NIGHT : TITLE_GRID_DAY).map((color, i) => (
            <div
              key={i}
              style={{
                backgroundColor: color,
                backgroundImage: SCANLINE_TEXTURE,
                transition: `background-color ${CROSS}s`,
              }}
            />
          ))}

          {/* ZK DESIGNS overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <h1
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: gridCapped ? gridWidth * 0.20 : gridHeight * 0.55,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                textShadow: '2px 2px 0 rgba(0,0,0,0.9), 5px 5px 0 rgba(0,0,0,0.5)',
                lineHeight: 1,
                margin: 0,
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}
            >
              ZK
            </h1>
          </div>
        </div>

        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.2em',
            color: palette.estText,
            textAlign: 'center',
            margin: 0,
            textTransform: 'uppercase',
            transition: `color ${CROSS}s`,
            whiteSpace: 'nowrap',
          }}
        >
          est. 2024 &#10022; population: 1
        </p>

        <p
          style={{
            fontFamily: '"IBM Plex Mono", monospace',
            fontSize: 9,
            letterSpacing: '0.18em',
            color: palette.roleText,
            textAlign: 'center',
            margin: 0,
            textTransform: 'uppercase',
            transition: `color ${CROSS}s`,
            whiteSpace: 'nowrap',
          }}
        >
          frontend designer / developer
        </p>
      </motion.div>

      {/* ═══════ z:20 — AMBIENT CHARACTERS ═══════ */}
      {activeChars.map(({ instanceId, def, direction }) => (
        <AmbientEntity
          key={instanceId}
          instanceId={instanceId}
          def={def}
          sw={sw}
          sh={sh}
          direction={direction}
          onComplete={handleEntityComplete}
        />
      ))}

      {/* ═══════ z:30 — BUILDINGS — District A (left) + Stage gap + District B (right) ═══════ */}
      {[
        { district: DISTRICT_A, anchor: { left: '2%'  } },
        { district: DISTRICT_B, anchor: { right: '2%' } },
      ].map(({ district, anchor }) => (
        <motion.div
          key={JSON.stringify(anchor)}
          style={{
            position:   'absolute',
            bottom:     sh * 0.10,
            height:     sh * 0.28,
            width:      `${district.reduce((acc, b) => acc + b.w, 0) + (district.length - 1) * 0.8}%`,
            ...anchor,
            display:    'flex',
            alignItems: 'flex-end',
            gap:        `${sw * 0.006}px`,
            zIndex:     30,
            overflow:   'hidden',
            x:          buildingsMV,
          }}
        >
          {district.map((bldg) => {
            const bHeight   = sh * bldg.hPct
            const isHovered = hoveredBuilding === bldg.id
            const info      = buildingInfo[bldg.id]
            return (
              <motion.div
                key={bldg.id}
                onMouseEnter={() => !isZooming && setHoveredBuilding(bldg.id)}
                onMouseLeave={() => setHoveredBuilding(null)}
                onClick={() => {
                  if (isZooming) return
                  handleBuildingClick(
                    bldg.id,
                    DISTRICT_A.some((b) => b.id === bldg.id),
                  )
                }}
                animate={{
                  filter: isHovered
                    ? 'drop-shadow(0 0 15px rgba(255,255,255,0.4)) brightness(1.15)'
                    : 'brightness(1)',
                }}
                transition={{ duration: 0.3 }}
                style={{
                  width:           `${bldg.w}%`,
                  height:          bHeight,
                  backgroundColor: palette.building,
                  borderRadius:    '2px 2px 0 0',
                  borderTop:       `1px solid ${palette.buildingBorderTop}`,
                  position:        'relative',
                  flexShrink:      0,
                  zIndex:          30,
                  cursor:          isZooming ? 'default' : 'pointer',
                  transition:      `background-color ${CROSS}s`,
                }}
              >
                {/* Peaked roof */}
                {bldg.hasPeak && (
                  <div
                    style={{
                      position:        'absolute',
                      top:             -10,
                      left:            '15%',
                      right:           '15%',
                      height:          10,
                      backgroundColor: palette.building,
                      clipPath:        'polygon(0 100%, 50% 0, 100% 100%)',
                      transition:      `background-color ${CROSS}s`,
                    }}
                  />
                )}

                {/* Hanging sign */}
                {bldg.hasSign && (
                  <div
                    style={{
                      position:        'absolute',
                      top:             -4,
                      left:            '10%',
                      right:           '10%',
                      height:          6,
                      backgroundColor: isNight ? '#2a1a0a' : '#5a4020',
                      borderRadius:    1,
                      transition:      `background-color ${CROSS}s`,
                    }}
                  />
                )}

                {/* Windows */}
                {Array.from({ length: bldg.windows }).map((_, row) => (
                  <div key={row} style={{ display: 'flex', justifyContent: 'space-evenly', paddingTop: '12%' }}>
                    {[0, 1].map((col) => (
                      <div
                        key={col}
                        style={{
                          width:           '22%',
                          aspectRatio:     '1 / 1.3',
                          backgroundColor: palette.windowBg,
                          boxShadow:       palette.windowGlow,
                          borderRadius:    1,
                          transition:      `background-color ${CROSS}s, box-shadow ${CROSS}s`,
                        }}
                      />
                    ))}
                  </div>
                ))}

                {/* Door — reactive glow void + 3D-swing leaf */}
                {/* Void color is reactive: amber at night (warm light spilling out),  */}
                {/* pale yellow in day (sunlight flooding the interior).               */}
                {/* perspective on wrapper drives the 3D hinge effect.                */}
                <div
                  style={{
                    position:        'absolute',
                    bottom:          0,
                    left:            '50%',
                    transform:       'translateX(-50%)',
                    width:           '28%',
                    height:          '18%',
                    perspective:     '120px',
                    borderRadius:    '2px 2px 0 0',
                    backgroundColor: isNight ? '#FFB300' : '#FFF9E0',
                    transition:      `background-color ${CROSS}s`,
                    // Glow effect: amber portal at night, bright portal in day
                    boxShadow: isNight
                      ? '0 0 12px 4px rgba(255,179,0,0.6), 0 0 28px 8px rgba(255,140,0,0.3)'
                      : '0 0 10px 3px rgba(255,249,200,0.7)',
                  }}
                >
                  {/* Door leaf: rotates around left hinge */}
                  <motion.div
                    animate={{ rotateY: clickedBuilding === bldg.id ? -90 : 0 }}
                    transition={{ duration: DOOR_OPEN_MS / 1000, ease: [0.4, 0, 0.8, 1] }}
                    style={{
                      width:           '100%',
                      height:          '100%',
                      backgroundColor: isNight ? '#1a1207' : '#2a1a0a',
                      borderRadius:    '2px 2px 0 0',
                      transformOrigin: 'left center',
                      transformStyle:  'preserve-3d',
                      transition:      `background-color ${CROSS}s`,
                    }}
                  />
                </div>

                {/* Nav labels rendered in the shared z:100 overlay below */}
              </motion.div>
            )
          })}
        </motion.div>
      ))}

      {/* ═══════ z:15 — GROUND (parallax layer 4, -25% shift) ═══════ */}
      <motion.div
        animate={{ background: isNight ? NIGHT_GROUND : DAY_GROUND }}
        transition={{ duration: CROSS }}
        style={{
          position: 'absolute',
          bottom:   0,
          left:     '-30%',
          width:    '160%',
          height:   sh * 0.10,
          zIndex:   15,
          x:        groundMV,
        }}
      />

      {/* ═══════ z:32 — TUMBLEWEEDS ═══════ */}
      <motion.div
        animate={{ x: [sw * -0.08, sw * 1.08], rotate: [0, 720] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' as const, repeatDelay: 6 }}
        style={{
          position: 'absolute',
          bottom: sh * 0.105,
          width: 16,
          height: 16,
          borderRadius: '50%',
          border: `2px solid ${palette.tumbleweed}`,
          opacity: 0.4,
          pointerEvents: 'none',
          zIndex: 32,
        }}
      />
      <motion.div
        animate={{ x: [sw * 1.1, sw * -0.1], rotate: [0, -540] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'linear' as const, repeatDelay: 10, delay: 8 }}
        style={{
          position: 'absolute',
          bottom: sh * 0.10,
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: `1.5px solid ${palette.tumbleweed}`,
          opacity: 0.3,
          pointerEvents: 'none',
          zIndex: 32,
        }}
      />

      {/* ═══════ z:100 — NAV LABELS + DISTRICT GUIDES (building-layer overlay) ═══════ */}
      {/* This layer shares buildingsMV so labels and guides always track the buildings  */}
      {/* exactly. overflow:visible lets labels pop above the roofline without clipping. */}
      <motion.div
        style={{
          position:      'absolute',
          inset:         0,
          zIndex:        100,
          pointerEvents: 'none',
          overflow:      'visible',
          x:             buildingsMV,
        }}
      >
        {/* Nav labels — one per building, centred on building cx, 30px above roofline */}
        {[...DISTRICT_A, ...DISTRICT_B].map((bldg) => {
          const info = buildingInfo[bldg.id]
          if (!info) return null
          const roofY = sh * 0.90 - sh * bldg.hPct   // sh*0.90 = ground top; roofline = ground - building height
          return (
            <NavMarker
              key={bldg.id}
              buildingId={bldg.id}
              cx={info.cx}
              roofY={roofY}
              isHovered={hoveredBuilding === bldg.id}
              isNight={isNight}
            />
          )
        })}

        {/* District guides — rendered here so they pan with buildings automatically.   */}
        {/* Their x is driven by useAnimate (hover walk logic), which sets absolute px   */}
        {/* within this layer. This layer's own x (buildingsMV) handles the pan offset. */}
        <DistrictGuide guideScope={guideAScope} isNight={isNight} sh={sh} initialX={guideAHome} scaleX={guideAFacing} />
        <DistrictGuide guideScope={guideBScope} isNight={isNight} sh={sh} initialX={guideBHome} scaleX={guideBFacing} />
      </motion.div>

      </div>
      {/* END WORLD CONTAINER ════════════════════════════════════════════════ */}

      {/* ═══════ z:42 — UI LAYER (outside world container, no zoom) ═══════ */}

      {/* Day/Night toggle */}
      <motion.button
        onClick={toggleNight}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ backgroundColor: palette.toggleBg, color: palette.toggleText }}
        transition={{ duration: 0.2 }}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 42,
          width: 30,
          height: 30,
          borderRadius: '50%',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
        }}
        aria-label={isNight ? 'Switch to day mode' : 'Switch to night mode'}
      >
        {isNight ? '\u2600' : '\u263E'}
      </motion.button>

      {/* Bottom CTA text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{
          position: 'absolute',
          bottom: sh * 0.015,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: Math.max(7, sw * 0.007),
          color: palette.footerText,
          letterSpacing: '0.25em',
          textTransform: 'uppercase',
          margin: 0,
          zIndex: 42,
          pointerEvents: 'none',
        }}
      >
        click a building to enter
      </motion.p>

      {/* ═══════ z:51 — MINI-HORSE EASTER EGG ═══════ */}
      <motion.div
        style={{
          position:      'absolute',
          bottom:        sh * 0.10,
          left:          sw + 10,
          zIndex:        51,
          pointerEvents: 'none',
          x:             groundMV,
        }}
      >
        <svg viewBox="0 0 28 20" width="28" height="20" fill="none" aria-label="mini horse easter egg">
          <ellipse cx="15" cy="12" rx="8" ry="5" stroke="#00ff88" strokeWidth="1.5"/>
          <circle cx="7" cy="9" r="3" stroke="#00ff88" strokeWidth="1.5"/>
          <line x1="9" y1="10" x2="12" y2="12" stroke="#00ff88" strokeWidth="1.5"/>
          <line x1="7" y1="6" x2="6" y2="4" stroke="#00ff88" strokeWidth="1"/>
          <line x1="11" y1="17" x2="10" y2="20" stroke="#00ff88" strokeWidth="1.5"/>
          <line x1="14" y1="17" x2="14" y2="20" stroke="#00ff88" strokeWidth="1.5"/>
          <line x1="18" y1="17" x2="17" y2="20" stroke="#00ff88" strokeWidth="1.5"/>
          <line x1="21" y1="17" x2="22" y2="20" stroke="#00ff88" strokeWidth="1.5"/>
          <path d="M23 11 Q27 9 26 7" stroke="#00ff88" strokeWidth="1.5" fill="none"/>
        </svg>
      </motion.div>

      {/* ═══════ z:45 — POKÉMON TEXT BOX (reserved for in-building use) ═══════ */}
      {/* Kept for use inside interiors — uncomment when interior dialogue is needed.
      {!isZooming && (
        <PokemonTextBox
          buildingId={hoveredBuilding}
          sw={sw}
          sh={sh}
          isNight={isNight}
          anchorX={(() => {
            if (!hoveredBuilding) return 0
            const info = buildingInfo[hoveredBuilding]
            if (!info) return sw * 0.5
            const aContainerPct = DISTRICT_A.reduce((s, b) => s + b.w, 0) + (DISTRICT_A.length - 1) * 0.8
            const aContainerW   = sw * aContainerPct / 100
            const saloonBw      = (DISTRICT_A[0].w / 100) * aContainerW
            const GLOBAL_OFFSET = saloonBw / 2
            const target = info.cx + buildingsX + GLOBAL_OFFSET
            return Math.max(12, target)
          })()}
        />
      )}
      */}

      {/* ═══════ z:200 — CINEMATIC FADE OVERLAY ═══════ */}
      <motion.div
        ref={fadeScope}
        style={{
          position:        'absolute',
          inset:           0,
          zIndex:          200,
          backgroundColor: '#000000',
          opacity:         0,
          pointerEvents:   isZooming ? 'all' : 'none',
        }}
      />
    </div>
  )
}
