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

// ─── 3D Hinge coordinate system (Nadir Tilt) ─────────────────────────────────
//
// The "Nadir Tilt" — looking down at the bar surface:
// User brings chin to chest. Bar surface "rises" from below to fill screen.
//
// Wall panel:    transform-origin: center bottom
//   rotateX(0 → -90): top swings AWAY from user. Barkeep recedes.
//   This creates the "falling back" effect.
//
// Surface panel: transform-origin: center bottom (AT BOTTOM OF VIEWPORT)
//   rotateX(90 → 0): wood grain "rises" from bottom bezel to fill screen.
//   Like bringing your chin to your chest — the surface comes up to meet you.
//
// Menu: Only slides in AFTER hinge reaches 0 degrees.
//
// CRITICAL SEQUENCING: Hinge and zoom are NEVER simultaneous.
//
const PERSPECTIVE = 1000 // Heavy perspective for depth

// Hinge dynamics — single source of truth (COMMENTED OUT: using Cinema-Slide instead)
// const HINGE_DYNAMICS = {
//   wallAngle: -90,        // Wall falls back AWAY from user
//   tableStartAngle: 90,   // Table starts edge-on, standing up at bottom
//   tableEndAngle: 0,       // Table lays flat toward camera
// }
const HINGE_ROTATION_DURATION = 1.4 // seconds — heavy, atmospheric

// Cinema-Slide constants
const SLIDE_DURATION = 1.2 // seconds

// ─── Foreground Scaling Protocol ─────────────────────────────────────────────
// NOTE: ForegroundLayer is now OUTSIDE the stage — no scale math needed!
// The table/menu are in their own layer, unaffected by stage zoom.

// ─── Centralized transition settings ────────────────────────────────────────
const TRANSITION_SETTINGS = {
  hingeDuration: HINGE_ROTATION_DURATION,
  hingeEase: [0.4, 0, 0.2, 1] as const, // Smooth, heavy transition
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
  const [foregroundScope, animateForeground] = useAnimate()
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
  const [activePage, setActivePage] = useState(0) // 0 = THE ATHLETE, 1 = THE CAREER
  // const [roomHidden, setRoomHidden] = useState(false) // ghost-table fix (unused with Cinema-Slide)

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

  // ── Continue → "Cinema-Slide" (Look Down) ──
  // Wall slides up, ForegroundLayer slides in from bottom
  // SCALE STAYS AT 6.8× throughout — no zoom changes during cinema-slide
  const handleContinue = useCallback(async () => {
    if (isTilted || isTransitioning) return
    setIsTransitioning(true)
    setShowDialogue(false)
    setIsTilted(true)

    // Phase 1: Cinema-Slide at 6.8× (scale unchanged)
    // Room (Barkeep): slides up off-screen (y: 0 → -100%)
    // ForegroundLayer (Table): slides up from bottom (y: 100% → 0%)
    await Promise.all([
      animateRoom(
        roomScope.current,
        { y: '-100%' },
        { duration: SLIDE_DURATION, ease: TRANSITION_SETTINGS.hingeEase }
      ),
      animateForeground(
        foregroundScope.current,
        { y: '0%' },
        { duration: SLIDE_DURATION, ease: TRANSITION_SETTINGS.hingeEase }
      ),
    ])

    // Phase 2: Book slides in after table reaches position.
    setShowMenu(true)
    setTimeout(() => setShowMenuLabel(true), 300)
    setIsTransitioning(false)
  }, [isTilted, isTransitioning, animateForeground, foregroundScope, animateStage, stageScope])

  // ── Exit: Look Up / Back / Exit ──
  const handleExit = useCallback(async () => {
    if (isTransitioning) return

    // ── Tilted → Barkeep (Look Up) ──
    if (isTilted) {
      setIsTransitioning(true)
      setShowMenuLabel(false)
      setShowMenu(false)

      // Scale is ALREADY at 6.8× — just reverse the cinema-slide
      // Room slides back, ForegroundLayer slides back down
      await Promise.all([
        animateRoom(
          roomScope.current,
          { y: '0%' },
          { duration: SLIDE_DURATION, ease: TRANSITION_SETTINGS.hingeEase }
        ),
        animateForeground(
          foregroundScope.current,
          { y: '100%' },
          { duration: SLIDE_DURATION, ease: TRANSITION_SETTINGS.hingeEase }
        ),
      ])

      // Back at seated view. STOP.
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
            initial={{ y: '0%' }}
            style={{
              position: 'absolute',
              inset: 0,
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
        </div>
      </motion.div>

      {/* ── Foreground Layer — OUTSIDE stage, Flexbox centering ── */}
      {/* perspective: 1500px gives depth to 3D page flip */}
      <motion.div
        ref={foregroundScope}
        initial={{ y: '100%' }}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          pointerEvents: 'none',
          perspective: 1500,
          perspectiveOrigin: 'center center',
        }}
      >
        <BarSurface
          isNight={isNight}
          showMenu={showMenu}
          activePage={activePage}
          onPageChange={setActivePage}
        />
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
// 3D Page flip: perspective 1500px, pages rotate at the spine.

function BarSurface({
  isNight,
  showMenu,
  activePage = 0,
  onPageChange,
}: {
  isNight: boolean
  showMenu: boolean
  activePage?: number
  onPageChange?: (page: number) => void
}) {
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

  // ── Book palette (solid colors for visibility) ──
  const bk = {
    cover: '#5D4037',
    spine: '#c9a96e',
    title: '#8B4513', // Saddle brown - very visible
    body: '#2F1810', // Dark brown - high contrast on cream
    accent: '#B8860B', // Dark golden rod
    titleBg: 'rgba(139,69,19,0.15)',
    shadow: 'rgba(0,0,0,0.2)',
    separator: 'rgba(139,69,19,0.25)',
  }

  const F = '"IBM Plex Mono", monospace'

  // Book page content — extracted for HTML rendering
  const athleteContent = (
    <>
      <div
        style={{ background: bk.titleBg, padding: '4px 12px', marginBottom: 8, borderRadius: 2 }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: F,
            fontSize: 9,
            letterSpacing: '0.18em',
            color: bk.title,
            textAlign: 'center',
            fontWeight: 600,
          }}
        >
          THE ATHLETE
        </p>
      </div>
      <p
        style={{
          margin: '0 0 4px 0',
          fontFamily: F,
          fontSize: 6,
          letterSpacing: '0.08em',
          color: bk.body,
        }}
      >
        Div. III Men's Water Polo
      </p>
      <p
        style={{
          margin: '0 0 8px 0',
          fontFamily: F,
          fontSize: 6,
          letterSpacing: '0.08em',
          color: bk.body,
        }}
      >
        4-Time Academic All-American
      </p>
      <div style={{ borderTop: `1px solid ${bk.separator}`, margin: '8px 0' }} />
      <p
        style={{
          margin: '0 0 4px 0',
          fontFamily: F,
          fontSize: 6.5,
          letterSpacing: '0.06em',
          color: bk.title,
          opacity: 0.8,
        }}
      >
        CAREER STATS
      </p>
      {[
        '4-Year Starter, Goalkeeper',
        '4x Academic All-American',
        'Conference Champion',
        'Captain, Senior Year',
      ].map((stat, i) => (
        <p
          key={i}
          style={{
            margin: '2px 0 2px 8px',
            fontFamily: F,
            fontSize: 5.8,
            letterSpacing: '0.04em',
            color: bk.body,
          }}
        >
          {stat}
        </p>
      ))}
      <div style={{ borderTop: `1px solid ${bk.separator}`, margin: '8px 0' }} />
      <p
        style={{
          margin: '0 0 4px 0',
          fontFamily: F,
          fontSize: 6.5,
          letterSpacing: '0.06em',
          color: bk.title,
          opacity: 0.8,
        }}
      >
        TRAITS FORGED
      </p>
      {[
        'Discipline under pressure',
        'Team-first mentality',
        'Relentless work ethic',
        'Leadership by example',
      ].map((trait, i) => (
        <p
          key={i}
          style={{
            margin: '2px 0 2px 8px',
            fontFamily: F,
            fontSize: 5.8,
            letterSpacing: '0.04em',
            color: bk.body,
          }}
        >
          {trait}
        </p>
      ))}
      <div style={{ borderTop: `1px solid ${bk.separator}`, margin: '8px 0' }} />
      <p
        style={{
          margin: 0,
          fontFamily: F,
          fontSize: 5.5,
          letterSpacing: '0.04em',
          color: bk.accent,
          fontStyle: 'italic',
          lineHeight: 1.5,
        }}
      >
        "The pool taught me that every pixel matters as much as every second on the clock."
      </p>
    </>
  )

  const careerContent = (
    <>
      <p
        style={{
          margin: '0 0 8px 0',
          fontFamily: F,
          fontSize: 7.5,
          letterSpacing: '0.14em',
          color: bk.title,
          fontWeight: 600,
        }}
      >
        THE CAREER
      </p>
      <p
        style={{
          margin: '0 0 2px 0',
          fontFamily: F,
          fontSize: 6,
          letterSpacing: '0.06em',
          color: bk.title,
          opacity: 0.8,
        }}
      >
        THE STARTUP
      </p>
      <p
        style={{
          margin: '0 0 8px 0',
          fontFamily: F,
          fontSize: 5.5,
          letterSpacing: '0.06em',
          color: bk.body,
        }}
      >
        Terrapin Rewards · 1 of 2 Founders
      </p>
      <div style={{ borderTop: `1px solid ${bk.separator}`, margin: '0 0 8px 0' }} />
      {[
        'Built the entire product from zero:',
        'UI/UX design, front-end, branding.',
        'Pitched to investors. Won funding.',
        'Managed dev sprints solo while',
        'co-founder handled operations.',
        'Learned that wearing every hat',
        'makes you a better designer —',
        'you understand constraints deeply.',
      ].map((line, i) => (
        <p
          key={i}
          style={{
            margin: '1px 0 1px 8px',
            fontFamily: F,
            fontSize: 5.8,
            letterSpacing: '0.04em',
            color: bk.body,
          }}
        >
          {line}
        </p>
      ))}
      <div style={{ borderTop: `1px solid ${bk.separator}`, margin: '8px 0' }} />
      <p
        style={{
          margin: '0 0 2px 0',
          fontFamily: F,
          fontSize: 6,
          letterSpacing: '0.06em',
          color: bk.title,
          opacity: 0.8,
        }}
      >
        THE PIVOT
      </p>
      <p
        style={{
          margin: '0 0 8px 0',
          fontFamily: F,
          fontSize: 5.5,
          letterSpacing: '0.06em',
          color: bk.body,
        }}
      >
        UI/UX · Software Engineering
      </p>
      <div style={{ borderTop: `1px solid ${bk.separator}`, margin: '0 0 8px 0' }} />
      {[
        'Design systems that scale.',
        'Interfaces that feel alive.',
        'Code that respects the craft.',
        'Looking for a team that ships',
        'beautiful, purposeful software.',
      ].map((line, i) => (
        <p
          key={i}
          style={{
            margin: '1px 0 1px 8px',
            fontFamily: F,
            fontSize: 5.8,
            letterSpacing: '0.04em',
            color: bk.body,
          }}
        >
          {line}
        </p>
      ))}
    </>
  )

  const PLANK_H = 98
  const planks = [0, 100, 200, 300, 400, 500]

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
          {/* Page flip light catch — simulates light hitting page as it lifts */}
          <linearGradient id="page-shine-0" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isNight ? '#FFD700' : '#fff8dc'} />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor={isNight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'} />
          </linearGradient>
          <linearGradient id="page-shine-1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isNight ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.1)'} />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="100%" stopColor={isNight ? '#FFD700' : '#fff8dc'} />
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
      </svg>

      {/* ═══════════════════════════════════════════════════════════════════════
          3D BOOK — Fixed 500×350px Golden Ratio
          ═══════════════════════════════════════════════════════════════════════ */}

      {/* ══ 3D Book ══ */}
      {(() => {
        const GOLD = '#d4af37'
        const PAGE_BG = '#f5f0e0'
        return (
          <div
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 500,
              height: 350,
              perspective: 1500,
              opacity: showMenu ? 1 : 0,
              transition: `opacity ${TRANSITION_SETTINGS.menuSlideDur * 0.6}s ease`,
            }}
          >
            {/* BOOK SHELL */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: bk.cover,
                border: `2px solid ${bk.spine}`,
                borderRadius: 4,
                boxShadow: isNight ? '0 8px 32px rgba(0,0,0,0.6)' : '0 4px 16px rgba(0,0,0,0.15)',
                overflow: 'visible',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* LAYER 1: LEFT UNDERLAY (Inside Cover) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  background: '#e8e0d0',
                  zIndex: 1,
                  transform: 'translateZ(-5px)',
                }}
              />

              {/* LAYER 2: RIGHT UNDERLAY (Static Floor - THE CAREER) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '50%',
                  height: '100%',
                  background: PAGE_BG,
                  padding: 25,
                  boxSizing: 'border-box',
                  zIndex: 1,
                  transform: 'translateZ(-5px)',
                  display: 'block',
                  opacity: 1,
                  border: '2px solid blue',
                }}
              >
                {careerContent}
              </div>

              {/* LAYER 3: FLIPPER (Moving Page) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '50%',
                  height: '100%',
                  transformOrigin: 'left center',
                  transitionProperty: 'transform',
                  transitionDuration: '0.8s',
                  transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: 'rotateY(' + (activePage === 0 ? 0 : -180) + 'deg) translateZ(0px)',
                  transformStyle: 'preserve-3d',
                  zIndex: 10,
                  pointerEvents: 'none',
                }}
              >
                {/* FRONT - THE ATHLETE */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: PAGE_BG,
                    padding: 25,
                    boxSizing: 'border-box',
                    backfaceVisibility: 'hidden',
                    borderLeft: `2px solid ${GOLD}`,
                  }}
                >
                  {athleteContent}
                </div>

                {/* BACK - blank */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: PAGE_BG,
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                  }}
                />
              </div>

              {/* SPINE */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: 4,
                  height: '100%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, rgba(0,0,0,0.3), rgba(0,0,0,0.1))',
                  zIndex: 15,
                }}
              />

              {/* HITBOXES (z-index: 999 for click detection) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '50%',
                  height: '100%',
                  zIndex: 999,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  background: 'rgba(255, 0, 0, 0.2)',
                }}
                onClick={() => onPageChange?.(0)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  width: '50%',
                  height: '100%',
                  zIndex: 999,
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  background: 'rgba(0, 255, 0, 0.2)',
                }}
                onClick={() => onPageChange?.(1)}
              />
            </div>
          </div>
        )
      })()}
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
