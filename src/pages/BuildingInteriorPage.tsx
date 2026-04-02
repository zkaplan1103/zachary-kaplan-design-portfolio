import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  motion,
  useAnimate,
  useSpring,
  useMotionValue,
  animate,
  AnimatePresence,
} from 'framer-motion'
import { useBezelContext } from '@/contexts/BezelContext'
import { useUIStore } from '@/store/uiStore'
import { BUILDING_DIALOGUES } from '@/components/PokemonTextBox'
import { SaloonInterior } from '@/components/interiors/SaloonInterior'
import { SheriffInterior } from '@/components/interiors/SheriffInterior'
import { BankInterior } from '@/components/interiors/BankInterior'
import type { InteriorProps } from '@/components/interiors/interiorTypes'

// ─── Interior map ─────────────────────────────────────────────────────────────
const INTERIOR_MAP: Record<string, React.ComponentType<InteriorProps>> = {
  saloon: SaloonInterior,
  sheriff: SheriffInterior,
  bank: BankInterior,
}

// ─── Spring config ────────────────────────────────────────────────────────────
const SPRING_CONFIG = { stiffness: 50, damping: 20 }

// ─── Fade timings ─────────────────────────────────────────────────────────────
const FADE_IN_DURATION = 0.4
const FADE_OUT_DURATION = 0.25

// ─── Deep Lean zoom-to-seat ─────────────────────────────────────────────────
// SVG-coordinate anchor approach: no DOM measurements.
//
// Source of Truth: Barkeep SVG group at translate(500, 170).
// Head center in SVG coords: y = 170 (group y) + 15 (head cy) = 185.
// Hat top in SVG coords: y = 170 + 8 (hat brim) = 178.
//
// transform-origin: center 178px — anchored on HAT TOP (not center of head).
// This keeps hat near top of viewport when scaled.
// Scale: 6.8× zooms downward from hat.
// TranslateY: -480px pulls torso/apron into center of frame (10-15% increase).
const SEATED_SCALE = 6.8
const SEATED_Y_OFFSET = -480 // fixed px — pulls torso/apron into center
const ZOOM_DURATION = 1.0

// ─── 3D Hinge coordinate system ─────────────────────────────────────────────
//
// Perspective: 1200px on stageScope (parent of hinge container).
// Both panels always in DOM. Surface starts at rotateX(90) — edge-on, invisible.
//
// Wall panel:    transform-origin: center bottom (bottom edge = hinge line)
//   rotateX(-90) → top swings AWAY from user. Barkeep recedes, surface appears.
//
// Surface panel: transform-origin: center top   (top edge = hinge line)
//   rotateX(90→0) → bar surface rotates up into view from below.
//
// CRITICAL SEQUENCING: Hinge and zoom are NEVER simultaneous.
//   Simultaneous zoom-out reveals the ceiling lights → reads as "looking up."
//   The hinge always runs at 6.8× so only the barkeep area is visible.
//
// Look Down (Continue) — 3 sequential phases:
//   1. Hinge at 6.8× (1.6s): Wall -90, Surface 0. Ceiling off-screen.
//   2. Hide room (instant): opacity:0 on room panel. Prevents ghost artifacts.
//   3. Zoom out (0.8s): 6.8→1.0. Reveals full bar surface. Book slides in.
//
// Look Up — 3 sequential phases:
//   1. Zoom in (0.8s): 1.0→6.8. Crops to barkeep area, hides ceiling.
//   2. Show room (instant): opacity:1 on room panel before reverse hinge.
//   3. Reverse hinge at 6.8× (1.6s): Wall 0, Surface 90.
//   Result: 6.8× on barkeep. No ceiling visible at any point.
//
const PERSPECTIVE = 1200

// ─── Centralized transition settings ────────────────────────────────────────
const TRANSITION_SETTINGS = {
  hingeDuration: 1.6, // 1600ms — "heavy head"
  hingeEase: [0.45, 0, 0.55, 1] as const, // Slow-In, Slow-Out
  zoomRevealDur: 0.8, // 800ms zoom out/in (after/before hinge)
  menuSlideDur: 0.8, // 800ms book slide-in CSS transition
  zoomOutEase: [0.4, 0, 0.2, 1] as const, // Back button: zoomed→wide
} as const

// ─── Component ──────────────────────────────────────────────────────────────

export function BuildingInteriorPage() {
  const { buildingId } = useParams<{ buildingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const b = useBezelContext()
  const sw = b.width
  const sh = b.height

  const isNight = useUIStore((s) => s.isNight)

  const [overlayScope, animateOverlay] = useAnimate()
  const [stageScope, animateStage] = useAnimate()
  const [roomScope, animateRoom] = useAnimate()
  const [surfaceScope, animateSurface] = useAnimate()

  const hasFadedIn = useRef(false)

  const stageRef = useRef<HTMLDivElement>(null)
  const [mouseNorm, setMouseNorm] = useState(0)
  const mouseSpring = useSpring(mouseNorm, SPRING_CONFIG)
  // 0 = wide view, 1 = fully zoomed to barkeep. Drives parallax in SaloonInterior.
  const zoomProgress = useMotionValue(0)

  const [isTransitioning, setIsTransitioning] = useState(false)

  // State machine: wide → zoomed → tilted
  const [isZoomed, setIsZoomed] = useState(false)
  const [isTilted, setIsTilted] = useState(false)
  const [showDialogue, setShowDialogue] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showMenuLabel, setShowMenuLabel] = useState(false)
  const [roomHidden, setRoomHidden] = useState(false) // ghost-table fix

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isZoomed || isTilted) return
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      const norm = ((e.clientX - rect.left) / rect.width - 0.5) * 2
      setMouseNorm(norm)
      mouseSpring.set(norm)
    },
    [mouseSpring, isZoomed, isTilted]
  )

  const dialogue = buildingId ? BUILDING_DIALOGUES[buildingId] : null
  const fromBuilding = (location.state as { fromBuilding?: string } | null)?.fromBuilding

  // ── Entry fade ──
  useEffect(() => {
    if (hasFadedIn.current) return
    hasFadedIn.current = true
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        await Promise.all([
          animateOverlay(
            overlayScope.current,
            { opacity: 0 },
            { duration: FADE_IN_DURATION, ease: 'easeOut' }
          ),
          animateStage(stageScope.current, { scale: 1 }, { duration: 0.6, ease: [0.2, 0, 0.4, 1] }),
        ])
      })
    )
  }, [animateOverlay, overlayScope, animateStage, stageScope])

  // ── Barkeep click → Deep Lean zoom ──
  // zoomProgress 0→1 runs in parallel — drives per-layer parallax in SaloonInterior.
  const handleBarkeepClick = useCallback(async () => {
    if (isZoomed || isTransitioning) return
    setIsTransitioning(true)
    setIsZoomed(true)
    mouseSpring.jump(mouseSpring.get())

    await Promise.all([
      animateStage(
        stageScope.current,
        { scale: SEATED_SCALE, y: SEATED_Y_OFFSET },
        { duration: ZOOM_DURATION, ease: 'easeOut' }
      ),
      animate(zoomProgress, 1, { duration: ZOOM_DURATION, ease: 'easeOut' }),
    ])
    setShowDialogue(true)
    setIsTransitioning(false)
  }, [isZoomed, isTransitioning, mouseSpring, animateStage, stageScope, sh, zoomProgress])

  // ── Continue → "Heavy Head" Hinge (Look Down) ──
  const handleContinue = useCallback(async () => {
    if (isTilted || isTransitioning) return
    setIsTransitioning(true)
    setShowDialogue(false)
    setIsTilted(true)

    // Phase 1: Hinge at 6.8× — ceiling stays off-screen.
    // Wall: 0 → -90 (top swings away from user). Surface: 90 → 0 (rises into view).
    await Promise.all([
      animateRoom(
        roomScope.current,
        { rotateX: -90 },
        { duration: TRANSITION_SETTINGS.hingeDuration, ease: TRANSITION_SETTINGS.hingeEase }
      ),
      animateSurface(
        surfaceScope.current,
        { rotateX: 0 },
        { duration: TRANSITION_SETTINGS.hingeDuration, ease: TRANSITION_SETTINGS.hingeEase }
      ),
    ])

    // Phase 2: Hide room panel to prevent ghost artifacts during zoom-out.
    setRoomHidden(true)

    // Phase 3: Zoom out to reveal full bar surface (10.0→1.0).
    await animateStage(
      stageScope.current,
      { scale: 1, y: 0 },
      { duration: TRANSITION_SETTINGS.zoomRevealDur, ease: TRANSITION_SETTINGS.hingeEase }
    )

    // Phase 4: Book slides in only AFTER hinge + zoom complete.
    setShowMenu(true)
    setTimeout(() => setShowMenuLabel(true), 300)
    setIsTransitioning(false)
  }, [
    isTilted,
    isTransitioning,
    animateRoom,
    roomScope,
    animateSurface,
    surfaceScope,
    animateStage,
    stageScope,
  ])

  // ── Exit: Look Up / Back / Exit ──
  const handleExit = useCallback(async () => {
    if (isTransitioning) return

    // ── Tilted → Barkeep (Look Up) ──
    if (isTilted) {
      setIsTransitioning(true)
      setShowMenuLabel(false)
      setShowMenu(false)

      // Phase 1: Zoom in to barkeep depth (1.0→6.8). Ceiling exits visible area.
      await animateStage(
        stageScope.current,
        { scale: SEATED_SCALE, y: SEATED_Y_OFFSET },
        { duration: TRANSITION_SETTINGS.zoomRevealDur, ease: TRANSITION_SETTINGS.hingeEase }
      )

      // Phase 2: Restore room panel before reverse hinge.
      setRoomHidden(false)

      // Phase 3: Reverse hinge at 6.8× — ceiling stays off-screen.
      // Wall: -90 → 0 (returns to vertical). Surface: 0 → 90 (drops away).
      await Promise.all([
        animateRoom(
          roomScope.current,
          { rotateX: 0 },
          { duration: TRANSITION_SETTINGS.hingeDuration, ease: TRANSITION_SETTINGS.hingeEase }
        ),
        animateSurface(
          surfaceScope.current,
          { rotateX: 90 },
          { duration: TRANSITION_SETTINGS.hingeDuration, ease: TRANSITION_SETTINGS.hingeEase }
        ),
      ])

      // Wall vertical. Scale is 6.8× — barkeep conversation depth. STOP.
      setIsTilted(false)
      setShowDialogue(true)
      setIsTransitioning(false)
      return
    }

    // ── Zoomed → Wide: explicit "Back" from seated view ──
    if (isZoomed) {
      setIsTransitioning(true)
      setShowDialogue(false)
      await Promise.all([
        animateStage(
          stageScope.current,
          { scale: 1, y: 0, rotateX: 0 },
          { duration: 0.85, ease: TRANSITION_SETTINGS.zoomOutEase }
        ),
        animate(zoomProgress, 0, { duration: 0.85, ease: TRANSITION_SETTINGS.zoomOutEase }),
      ])
      setIsZoomed(false)
      setIsTransitioning(false)
      return
    }

    // ── Wide → Town ──
    await animateOverlay(
      overlayScope.current,
      { opacity: 1 },
      { duration: FADE_OUT_DURATION, ease: 'easeIn' }
    )
    navigate('/', { state: { fromBuilding: buildingId ?? fromBuilding } })
  }, [
    isTransitioning,
    isTilted,
    isZoomed,
    animateRoom,
    roomScope,
    animateSurface,
    surfaceScope,
    animateStage,
    stageScope,
    sh,
    animateOverlay,
    overlayScope,
    navigate,
    buildingId,
    fromBuilding,
  ])

  const Interior = buildingId ? INTERIOR_MAP[buildingId] : null
  const interiorProps: Record<string, unknown> = {}
  if (buildingId === 'saloon' && !isZoomed) {
    interiorProps.onBarkeepClick = handleBarkeepClick
  }

  return (
    <div
      ref={stageRef}
      onMouseMove={onMouseMove}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 400,
        overflow: 'hidden',
        fontFamily: '"IBM Plex Mono", monospace',
        color: '#f0efe9',
      }}
    >
      {/* ── Zoom stage + perspective ── */}
      <motion.div
        ref={stageScope}
        initial={{ scale: 1.05 }}
        style={{
          position: 'absolute',
          inset: 0,
          // Anchored on hat top at y=178px (SVG coords: group y=170 + hat brim y=8).
          // Hat stays near top of viewport, scale zooms downward, translateY pulls torso up.
          transformOrigin: 'center 178px',
          perspective: PERSPECTIVE,
        }}
      >
        {/* ── 3D hinge container ── */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* ── Room (The Wall) — always mounted, hidden when tilted to prevent ghost ── */}
          <motion.div
            ref={roomScope}
            initial={{ rotateX: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'center bottom',
              backfaceVisibility: 'hidden',
              opacity: roomHidden ? 0 : 1,
            }}
          >
            {Interior ? (
              <Interior
                isNight={isNight}
                mouseSpring={mouseSpring}
                zoomProgress={zoomProgress}
                sw={sw}
                sh={sh}
                {...interiorProps}
              />
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: isNight ? '#1A1412' : '#A1887F',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background-color 1.5s',
                }}
              >
                <p style={{ fontSize: 13, color: 'rgba(240,239,233,0.5)', lineHeight: 1.7 }}>
                  [ Interior coming soon ]
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Surface (The Table) — always mounted, starts edge-on ── */}
          <motion.div
            ref={surfaceScope}
            initial={{ rotateX: 90 }}
            style={{
              position: 'absolute',
              inset: 0,
              transformOrigin: 'center top',
              backfaceVisibility: 'hidden',
            }}
          >
            <BarSurface isNight={isNight} showMenu={showMenu} />
          </motion.div>
        </div>
      </motion.div>

      {/* ── Building label (wide only) ── */}
      <AnimatePresence>
        {!isZoomed && (
          <motion.p
            key="building-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: FADE_IN_DURATION + 0.15 }}
            style={{
              position: 'absolute',
              top: sh * 0.05,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 10,
              letterSpacing: '0.25em',
              color: isNight ? 'rgba(201,169,110,0.7)' : 'rgba(90,58,16,0.7)',
              textTransform: 'uppercase',
              margin: 0,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            {dialogue?.name ?? `> ${buildingId?.toUpperCase()}`}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Barkeep dialogue ── */}
      <AnimatePresence>
        {showDialogue && (
          <motion.div
            key="barkeep-dialogue"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'absolute',
              bottom: sh * 0.1,
              left: '50%',
              transform: 'translateX(-50%)',
              width: Math.min(sw * 0.55, 480),
              backgroundColor: isNight ? '#000000' : '#ffffff',
              padding: '12px 20px',
              zIndex: 60,
              border: `1px solid ${isNight ? 'rgba(201,169,110,0.4)' : 'rgba(78,52,46,0.3)'}`,
            }}
          >
            <p
              style={{
                fontFamily: '"IBM Plex Mono", monospace',
                fontSize: 10,
                color: isNight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
                letterSpacing: '0.2em',
                margin: '0 0 6px 0',
                textTransform: 'uppercase',
              }}
            >
              {'> BARKEEP'}
            </p>
            <BarkeepTypewriter
              text="Welcome to the Lucky Spur. You look like you've traveled a long way. Care to see the menu?"
              isNight={isNight}
            />
            <ContinueButton isNight={isNight} onClick={handleContinue} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Specials label ── */}
      <AnimatePresence>
        {showMenuLabel && (
          <motion.p
            key="menu-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            style={{
              position: 'absolute',
              bottom: sh * 0.07,
              left: 0,
              right: 0,
              textAlign: 'center',
              fontSize: 10,
              letterSpacing: '0.2em',
              color: isNight ? 'rgba(201,169,110,0.6)' : 'rgba(90,58,16,0.55)',
              textTransform: 'uppercase',
              margin: 0,
              pointerEvents: 'none',
              zIndex: 65,
            }}
          >
            {'> Take your time. The good stuff is on every page.'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Nav button ── */}
      <AnimatePresence>
        {(!isZoomed || showDialogue || isTilted) && (
          <motion.button
            key="nav-button"
            initial={{ opacity: 0 }}
            animate={{ opacity: isTransitioning ? 0.4 : 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.4,
              delay: !isZoomed && !isTilted ? FADE_IN_DURATION + 0.35 : 0,
            }}
            onClick={handleExit}
            disabled={isTransitioning}
            style={{
              position: 'absolute',
              bottom: sh * 0.04,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 70,
              background: 'transparent',
              border: `1px solid ${isNight ? 'rgba(201,169,110,0.4)' : 'rgba(90,58,16,0.35)'}`,
              color: isNight ? '#c9a96e' : '#5a3a10',
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: 10,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              padding: '8px 20px',
              cursor: isTransitioning ? 'default' : 'pointer',
              transition: 'border-color 1.5s, color 1.5s',
            }}
          >
            {isTilted ? '↑ Look Up' : isZoomed ? '← Back' : '← Exit'}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Black overlay ── */}
      <motion.div
        ref={overlayScope}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 50,
          backgroundColor: '#000000',
          opacity: 1,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ─── Bar Surface ────────────────────────────────────────────────────────────
//
// viewBox="0 0 1000 600". The mahogany planks are always part of this surface.
// Only the BOOK/MENU slides in — the table itself is static.
//
// Book = 320 SVG units (32% of 1000-unit viewBox), centred.
// 340 SVG units of visible mahogany on each side — small book on a large bar.
//
// Book slides in from y:-150 ONLY after hinge + zoom-out are both complete.

function BarSurface({ isNight, showMenu }: { isNight: boolean; showMenu: boolean }) {
  // ── Wood palette ──
  const MAHOGANY = isNight ? '#1e0905' : '#5C3317'
  const PLANK_DARK = isNight ? '#180704' : '#52291A'
  const PLANK_LIGHT = isNight ? '#221007' : '#6B3D26'
  const GRAIN = isNight ? 'rgba(201,169,110,0.055)' : 'rgba(78,52,46,0.07)'
  const GRAIN_HEAVY = isNight ? 'rgba(201,169,110,0.09)' : 'rgba(78,52,46,0.11)'
  const PLANK_GAP = isNight ? '#0a0402' : '#2a1208'
  const WEAR = isNight ? 'rgba(201,169,110,0.03)' : 'rgba(78,52,46,0.05)'
  const LAMP_GLOW = isNight ? 'rgba(255,172,0,0.16)' : 'rgba(255,248,200,0.22)'
  const VIGNETTE = isNight ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.22)'
  const RING = isNight ? 'rgba(201,169,110,0.07)' : 'rgba(78,52,46,0.09)'

  // ── Book palette ──
  const bk = isNight
    ? {
        cover: '#1e0e04',
        page: 'rgba(201,169,110,0.15)', // slightly brighter page
        spine: '#c9a96e',
        title: '#c9a96e',
        body: 'rgba(201,169,110,0.75)', // high contrast body text
        accent: 'rgba(255,179,0,0.85)',
        titleBg: 'rgba(201,169,110,0.08)',
        shadow: 'rgba(0,0,0,0.35)',
        separator: 'rgba(201,169,110,0.18)',
      }
    : {
        cover: '#5D4037',
        page: 'rgba(255,249,224,0.85)', // brighter page background
        spine: '#4E342E',
        title: '#3E2723', // darker title for contrast
        body: 'rgba(62,39,35,0.80)', // high contrast body text
        accent: 'rgba(100,40,10,0.90)',
        titleBg: 'rgba(78,52,46,0.06)',
        shadow: 'rgba(0,0,0,0.12)',
        separator: 'rgba(78,52,46,0.15)',
      }

  const F = '"IBM Plex Mono", monospace'
  const PLANK_H = 98
  const planks = [0, 100, 200, 300, 400, 500]

  // Book in SVG viewBox units — 320 wide (32% of 1000), centred.
  // Leaves 340 SVG units of mahogany on each side — wood visible on all 4 sides.
  const BK_W = 320
  const BK_H = BK_W * 0.72 // ~230
  const BK_X = (1000 - BK_W) / 2 // 340
  const BK_Y = (600 - BK_H) / 2 // ~185

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: MAHOGANY,
        overflow: 'hidden',
      }}
    >
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: 'block', position: 'absolute', inset: 0 }}
        fill="none"
      >
        <defs>
          <radialGradient id="bs-lamp" cx="50%" cy="8%" r="70%" fx="50%" fy="8%">
            <stop offset="0%" stopColor={LAMP_GLOW} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <radialGradient id="bs-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="30%" stopColor="transparent" />
            <stop offset="100%" stopColor={VIGNETTE} />
          </radialGradient>
          <linearGradient id="bk-curl-l" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="100%" stopColor={bk.shadow} />
          </linearGradient>
          <linearGradient id="bk-curl-r" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={bk.shadow} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* ── 6 mahogany planks ── */}
        <g id="mahogany-planks">
          {planks.map((py, i) => {
            const fill = i % 2 === 0 ? PLANK_DARK : PLANK_LIGHT
            return (
              <g key={i}>
                <rect x="0" y={py} width="1000" height={PLANK_H} fill={fill} />
                {i < planks.length - 1 && (
                  <line
                    x1="0"
                    y1={py + PLANK_H}
                    x2="1000"
                    y2={py + PLANK_H}
                    stroke={PLANK_GAP}
                    strokeWidth="2"
                  />
                )}
                {[16, 34, 58, 80].map((offset, j) => {
                  const gy = py + offset
                  const gx1 = (i * 79 + j * 131) % 160
                  const gx2 = Math.min(gx1 + 220 + ((j * 97 + i * 53) % 500), 1000)
                  const heavy = (i + j) % 3 === 0
                  return (
                    <line
                      key={j}
                      x1={gx1}
                      y1={gy}
                      x2={gx2}
                      y2={gy}
                      stroke={heavy ? GRAIN_HEAVY : GRAIN}
                      strokeWidth={heavy ? 1.2 : 0.7}
                    />
                  )
                })}
              </g>
            )
          })}
        </g>

        <rect x="0" y="0" width="1000" height="600" fill="url(#bs-lamp)" />
        <rect x="0" y="0" width="1000" height="600" fill="url(#bs-vignette)" />

        {/* ── Glass ring stains ── */}
        <ellipse
          cx="160"
          cy="480"
          rx="32"
          ry="10"
          fill={WEAR}
          stroke={RING}
          strokeWidth="0.8"
          transform="rotate(-8 160 480)"
        />
        <ellipse
          cx="830"
          cy="130"
          rx="24"
          ry="8"
          fill={WEAR}
          stroke={RING}
          strokeWidth="0.7"
          transform="rotate(5 830 130)"
        />
        <circle cx="140" cy="140" r="18" fill="none" stroke={RING} strokeWidth="1" />
        <circle cx="860" cy="460" r="14" fill="none" stroke={RING} strokeWidth="0.8" />

        {/* ── Menu anchor ── */}
        <g id="menu-anchor" transform="translate(500, 300)" />

        {/* ══════════════════════════════════════════════════════════════════
            BOOK — rendered in SVG viewBox units so it's immune to CSS scale.
            Slides in from y:-150 when showMenu flips true (1.0s into hinge).
            ══════════════════════════════════════════════════════════════════ */}
        <g
          transform={`translate(${BK_X}, ${showMenu ? BK_Y : BK_Y - 150})`}
          opacity={showMenu ? 1 : 0}
          style={{
            transition: `transform ${TRANSITION_SETTINGS.menuSlideDur}s cubic-bezier(0.45, 0, 0.55, 1), opacity ${TRANSITION_SETTINGS.menuSlideDur * 0.6}s ease`,
          }}
        >
          {/* Scale the 460×332 book viewBox to fit in BK_W×BK_H */}
          <g transform={`scale(${BK_W / 460}, ${BK_H / 332})`}>
            {/* Drop shadow */}
            <rect
              x="8"
              y="12"
              width="444"
              height="316"
              rx="6"
              fill={isNight ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,0,0.15)'}
              style={{ filter: 'blur(8px)' }}
            />

            {/* Cover */}
            <rect
              x="4"
              y="4"
              width="452"
              height="324"
              rx="4"
              fill={bk.cover}
              stroke={bk.spine}
              strokeWidth="1.5"
            />

            {/* Pages */}
            <rect x="12" y="12" width="214" height="308" rx="2" fill={bk.page} />
            <rect x="234" y="12" width="214" height="308" rx="2" fill={bk.page} />

            {/* Spine + curl shadows */}
            <line
              x1="230"
              y1="8"
              x2="230"
              y2="324"
              stroke={bk.spine}
              strokeWidth="1.5"
              strokeOpacity="0.4"
            />
            <rect x="212" y="12" width="18" height="308" fill="url(#bk-curl-l)" />
            <rect x="230" y="12" width="18" height="308" fill="url(#bk-curl-r)" />

            {/* ── LEFT PAGE — THE ATHLETE ── */}
            <rect x="24" y="20" width="190" height="26" rx="1" fill={bk.titleBg} />
            <text
              x="119"
              y="38"
              textAnchor="middle"
              fill={bk.title}
              fontFamily={F}
              fontSize="9"
              letterSpacing="0.18em"
              fontWeight="600"
            >
              THE ATHLETE
            </text>

            <text x="24" y="60" fill={bk.body} fontFamily={F} fontSize="6" letterSpacing="0.08em">
              Div. III Men's Water Polo
            </text>
            <text x="24" y="72" fill={bk.body} fontFamily={F} fontSize="6" letterSpacing="0.08em">
              4-Time Academic All-American
            </text>
            <line x1="24" y1="80" x2="210" y2="80" stroke={bk.separator} strokeWidth="0.6" />

            <text
              x="24"
              y="96"
              fill={bk.title}
              fontFamily={F}
              fontSize="6.5"
              letterSpacing="0.06em"
              opacity="0.8"
            >
              CAREER STATS
            </text>

            {(
              [
                [110, '4-Year Starter, Goalkeeper'],
                [124, '4x Academic All-American'],
                [138, 'Conference Champion'],
                [152, 'Captain, Senior Year'],
              ] as [number, string][]
            ).map(([y, line]) => (
              <text
                key={y}
                x="28"
                y={y}
                fill={bk.body}
                fontFamily={F}
                fontSize="5.8"
                letterSpacing="0.04em"
              >
                {line}
              </text>
            ))}

            <line x1="24" y1="164" x2="140" y2="164" stroke={bk.separator} strokeWidth="0.6" />

            <text
              x="24"
              y="180"
              fill={bk.title}
              fontFamily={F}
              fontSize="6.5"
              letterSpacing="0.06em"
              opacity="0.8"
            >
              TRAITS FORGED
            </text>

            {(
              [
                [194, 'Discipline under pressure'],
                [208, 'Team-first mentality'],
                [222, 'Relentless work ethic'],
                [236, 'Leadership by example'],
              ] as [number, string][]
            ).map(([y, line]) => (
              <text
                key={y}
                x="28"
                y={y}
                fill={bk.body}
                fontFamily={F}
                fontSize="5.8"
                letterSpacing="0.04em"
              >
                {line}
              </text>
            ))}

            <line x1="24" y1="248" x2="140" y2="248" stroke={bk.separator} strokeWidth="0.6" />

            <text
              x="24"
              y="266"
              fill={bk.accent}
              fontFamily={F}
              fontSize="5.5"
              letterSpacing="0.04em"
              fontStyle="italic"
            >
              "The pool taught me that
            </text>
            <text
              x="24"
              y="278"
              fill={bk.accent}
              fontFamily={F}
              fontSize="5.5"
              letterSpacing="0.04em"
              fontStyle="italic"
            >
              {' '}
              every pixel matters as much
            </text>
            <text
              x="24"
              y="290"
              fill={bk.accent}
              fontFamily={F}
              fontSize="5.5"
              letterSpacing="0.04em"
              fontStyle="italic"
            >
              {' '}
              as every second on the clock."
            </text>

            {/* ── RIGHT PAGE — THE CAREER ── */}
            <text
              x="246"
              y="30"
              fill={bk.title}
              fontFamily={F}
              fontSize="7.5"
              letterSpacing="0.14em"
              fontWeight="600"
            >
              THE CAREER
            </text>

            <text
              x="246"
              y="48"
              fill={bk.title}
              fontFamily={F}
              fontSize="6"
              letterSpacing="0.06em"
              opacity="0.8"
            >
              THE STARTUP
            </text>
            <text
              x="246"
              y="60"
              fill={bk.body}
              fontFamily={F}
              fontSize="5.5"
              letterSpacing="0.06em"
            >
              Terrapin Rewards · 1 of 2 Founders
            </text>
            <line x1="246" y1="68" x2="432" y2="68" stroke={bk.separator} strokeWidth="0.6" />

            {(
              [
                [82, 'Built the entire product from zero:'],
                [96, 'UI/UX design, front-end, branding.'],
                [114, 'Pitched to investors. Won funding.'],
                [128, 'Managed dev sprints solo while'],
                [142, 'co-founder handled operations.'],
                [160, 'Learned that wearing every hat'],
                [174, 'makes you a better designer —'],
                [188, 'you understand constraints deeply.'],
              ] as [number, string][]
            ).map(([y, line]) => (
              <text
                key={y}
                x="250"
                y={y}
                fill={bk.body}
                fontFamily={F}
                fontSize="5.8"
                letterSpacing="0.04em"
              >
                {line}
              </text>
            ))}

            <line x1="246" y1="202" x2="360" y2="202" stroke={bk.separator} strokeWidth="0.6" />

            <text
              x="246"
              y="218"
              fill={bk.title}
              fontFamily={F}
              fontSize="6"
              letterSpacing="0.06em"
              opacity="0.8"
            >
              THE PIVOT
            </text>
            <text
              x="246"
              y="230"
              fill={bk.body}
              fontFamily={F}
              fontSize="5.5"
              letterSpacing="0.06em"
            >
              UI/UX · Software Engineering
            </text>
            <line x1="246" y1="238" x2="432" y2="238" stroke={bk.separator} strokeWidth="0.6" />

            {(
              [
                [252, 'Design systems that scale.'],
                [266, 'Interfaces that feel alive.'],
                [280, 'Code that respects the craft.'],
                [298, 'Looking for a team that ships'],
                [312, 'beautiful, purposeful software.'],
              ] as [number, string][]
            ).map(([y, line]) => (
              <text
                key={y}
                x="250"
                y={y}
                fill={bk.body}
                fontFamily={F}
                fontSize="5.8"
                letterSpacing="0.04em"
              >
                {line}
              </text>
            ))}

            {/* Corner ornaments */}
            {(
              [
                [16, 16],
                [220, 16],
                [16, 316],
                [220, 316],
                [238, 16],
                [440, 16],
                [238, 316],
                [440, 316],
              ] as [number, number][]
            ).map(([ox, oy]) => (
              <circle
                key={`${ox}-${oy}`}
                cx={ox}
                cy={oy}
                r="2"
                fill="none"
                stroke={bk.spine}
                strokeWidth="0.5"
                strokeOpacity="0.25"
              />
            ))}
          </g>
        </g>
      </svg>
    </div>
  )
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function BarkeepTypewriter({ text, isNight }: { text: string; isNight: boolean }) {
  const [displayed, setDisplayed] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    let i = 0
    setDisplayed('')
    intervalRef.current = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }, 35)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [text])

  return (
    <p
      style={{
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 11,
        color: isNight ? '#ffffff' : '#000000',
        lineHeight: 1.6,
        margin: 0,
        minHeight: 36,
      }}
    >
      {displayed}
      <span style={{ opacity: 0.5 }}>▌</span>
    </p>
  )
}

// ─── Continue button ──────────────────────────────────────────────────────────
function ContinueButton({ isNight, onClick }: { isNight: boolean; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 3.2 }}
      onClick={onClick}
      style={{
        display: 'block',
        marginTop: 8,
        marginLeft: 'auto',
        background: 'transparent',
        border: `1px solid ${isNight ? 'rgba(201,169,110,0.35)' : 'rgba(78,52,46,0.25)'}`,
        color: isNight ? '#c9a96e' : '#5a3a10',
        fontFamily: '"IBM Plex Mono", monospace',
        fontSize: 9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding: '5px 14px',
        cursor: 'pointer',
        transition: 'border-color 0.3s, color 0.3s',
      }}
    >
      Continue →
    </motion.button>
  )
}
