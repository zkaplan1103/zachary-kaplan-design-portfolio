import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, useAnimate, useSpring, AnimatePresence } from 'framer-motion'
import { useBezelContext } from '@/contexts/BezelContext'
import { useUIStore } from '@/store/uiStore'
import { BUILDING_DIALOGUES } from '@/components/PokemonTextBox'
import { SaloonInterior }  from '@/components/interiors/SaloonInterior'
import { SheriffInterior } from '@/components/interiors/SheriffInterior'
import { BankInterior }    from '@/components/interiors/BankInterior'
import type { InteriorProps } from '@/components/interiors/interiorTypes'

// ─── Interior map ─────────────────────────────────────────────────────────────
const INTERIOR_MAP: Record<string, React.ComponentType<InteriorProps>> = {
  saloon:  SaloonInterior,
  sheriff: SheriffInterior,
  bank:    BankInterior,
}

// ─── Spring config ────────────────────────────────────────────────────────────
const SPRING_CONFIG = { stiffness: 50, damping: 20 }

// ─── Fade timings ─────────────────────────────────────────────────────────────
const FADE_IN_DURATION  = 0.4
const FADE_OUT_DURATION = 0.25

// ─── Zoom-to-seat config ─────────────────────────────────────────────────────
const ZOOM_SCALE    = 2.8
const ZOOM_DURATION = 0.8

// Barkeep is at (500, 190) in a 1000×400 viewBox.
// The 160% wide stage means the SVG centre is at 50% of the container.
// At scale 2.8, to frame the barkeep's torso centred in the bezel:
//   x offset = 0 (already centred — barkeep is at x=500 = centre of 1000)
//   y offset: barkeep torso is at ~47.5% of viewBox height (190/400).
//   We need to push it to ~40% of viewport → translate y by ~+15% of sh.
const ZOOM_Y_PCT = 0.18  // translate down by 18% of sh to frame torso

// ─── Tilt-to-menu config ────────────────────────────────────────────────────
// After zoom, tilt pushes scene UP so barkeep exits top of bezel and
// the bar counter surface fills the view. At scale 2.8, the counter is at
// ~50% of viewBox height (y=200/400). We shift y negative to centre it.
const TILT_Y_PCT      = -0.28  // translate UP by 28% of sh
const TILT_DURATION   = 0.9

// ─── Component ───────────────────────────────────────────────────────────────

export function BuildingInteriorPage() {
  const { buildingId } = useParams<{ buildingId: string }>()
  const navigate  = useNavigate()
  const location  = useLocation()

  const b  = useBezelContext()
  const sw = b.width
  const sh = b.height

  const isNight = useUIStore((s) => s.isNight)

  const [overlayScope, animateOverlay] = useAnimate()
  const [stageScope,   animateStage]   = useAnimate()
  const hasFadedIn = useRef(false)

  // Single spring in -1 → 1 range
  const stageRef    = useRef<HTMLDivElement>(null)
  const [mouseNorm, setMouseNorm] = useState(0)
  const mouseSpring = useSpring(mouseNorm, SPRING_CONFIG)

  // Zoom / tilt state
  const [isZoomed, setIsZoomed]         = useState(false)
  const [isTilted, setIsTilted]         = useState(false)
  const [showDialogue, setShowDialogue] = useState(false)
  const [showMenu, setShowMenu]         = useState(false)
  const [showMenuLabel, setShowMenuLabel] = useState(false)

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isZoomed || isTilted) return  // freeze pan while zoomed or tilted
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const norm = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    setMouseNorm(norm)
    mouseSpring.set(norm)
  }, [mouseSpring, isZoomed, isTilted])

  const dialogue     = buildingId ? BUILDING_DIALOGUES[buildingId] : null
  const fromBuilding = (location.state as { fromBuilding?: string } | null)?.fromBuilding

  // Entry: fade overlay out + settle scale 1.05 → 1.0 over 600ms
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
          animateStage(
            stageScope.current,
            { scale: 1 },
            { duration: 0.6, ease: [0.2, 0, 0.4, 1] }
          ),
        ])
      })
    )
  }, [animateOverlay, overlayScope, animateStage, stageScope])

  // ── Barkeep click → zoom-to-seat ──
  const handleBarkeepClick = useCallback(async () => {
    if (isZoomed) return
    setIsZoomed(true)

    // Freeze the pan at current position
    mouseSpring.jump(mouseSpring.get())

    // Animate the stage container: scale up + translate to frame barkeep
    await animateStage(
      stageScope.current,
      {
        scale: ZOOM_SCALE,
        y: sh * ZOOM_Y_PCT,
      },
      { duration: ZOOM_DURATION, ease: 'easeOut' }
    )

    // Show dialogue after zoom completes
    setShowDialogue(true)
  }, [isZoomed, mouseSpring, animateStage, stageScope, sh])

  // ── Continue click → tilt to menu ──
  const handleContinue = useCallback(async () => {
    if (isTilted) return
    setShowDialogue(false)
    setIsTilted(true)

    // Tilt: maintain scale, shift y up to push barkeep off-screen and reveal bar surface
    await animateStage(
      stageScope.current,
      {
        scale: ZOOM_SCALE,
        y: sh * TILT_Y_PCT,
      },
      { duration: TILT_DURATION, ease: [0.25, 0.1, 0.25, 1] }
    )

    // After tilt completes, fade in the menu + label
    setShowMenu(true)
    // Small delay before the label so the menu appears first
    setTimeout(() => setShowMenuLabel(true), 400)
  }, [isTilted, animateStage, stageScope, sh])

  // ── Exit handler ──
  const handleExit = async () => {
    // If tilted, untilt back to zoomed state
    if (isTilted) {
      setShowMenuLabel(false)
      setShowMenu(false)
      await animateStage(
        stageScope.current,
        { scale: ZOOM_SCALE, y: sh * ZOOM_Y_PCT },
        { duration: 0.5, ease: 'easeInOut' }
      )
      setIsTilted(false)
      setShowDialogue(true)
      return
    }

    // If zoomed, zoom out to wide view
    if (isZoomed) {
      setShowDialogue(false)
      await animateStage(
        stageScope.current,
        { scale: 1, y: 0 },
        { duration: 0.5, ease: 'easeInOut' }
      )
      setIsZoomed(false)
      return
    }

    await animateOverlay(
      overlayScope.current,
      { opacity: 1 },
      { duration: FADE_OUT_DURATION, ease: 'easeIn' }
    )
    navigate('/', { state: { fromBuilding: buildingId ?? fromBuilding } })
  }

  const Interior = buildingId ? INTERIOR_MAP[buildingId] : null

  // Only pass onBarkeepClick to saloon
  const interiorProps: Record<string, unknown> = {}
  if (buildingId === 'saloon' && !isZoomed) {
    interiorProps.onBarkeepClick = handleBarkeepClick
  }

  return (
    <div
      ref={stageRef}
      onMouseMove={onMouseMove}
      style={{
        position:   'absolute',
        inset:      0,
        zIndex:     400,
        overflow:   'hidden',
        fontFamily: '"IBM Plex Mono", monospace',
        color:      '#f0efe9',
      }}
    >
      {/* Entry settle: 1.05 → 1.0 over 600ms */}
      <motion.div
        ref={stageScope}
        initial={{ scale: 1.05 }}
        style={{ position: 'absolute', inset: 0, transformOrigin: 'center center' }}
      >
        {Interior ? (
          <Interior
            isNight={isNight}
            mouseSpring={mouseSpring}
            sw={sw}
            sh={sh}
            {...interiorProps}
          />
        ) : (
          <div
            style={{
              position:        'absolute',
              inset:           0,
              backgroundColor: isNight ? '#1A1412' : '#A1887F',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              transition:      'background-color 1.5s',
            }}
          >
            <p style={{ fontSize: 13, color: 'rgba(240,239,233,0.5)', lineHeight: 1.7 }}>
              [ Interior coming soon ]
            </p>
          </div>
        )}
      </motion.div>

      {/* ── Building label ── */}
      <AnimatePresence>
        {!isZoomed && (
          <motion.p
            key="building-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: isZoomed ? 0 : FADE_IN_DURATION + 0.15 }}
            style={{
              position:      'absolute',
              top:           sh * 0.05,
              left:          0,
              right:         0,
              textAlign:     'center',
              fontSize:      10,
              letterSpacing: '0.25em',
              color:         isNight ? 'rgba(201,169,110,0.7)' : 'rgba(90,58,16,0.7)',
              textTransform: 'uppercase',
              margin:        0,
              pointerEvents: 'none',
              zIndex:        10,
            }}
          >
            {dialogue?.name ?? `> ${buildingId?.toUpperCase()}`}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Barkeep dialogue (shown after zoom, with Continue button) ── */}
      <AnimatePresence>
        {showDialogue && (
          <motion.div
            key="barkeep-dialogue"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            style={{
              position:        'absolute',
              bottom:          sh * 0.10,
              left:            '50%',
              transform:       'translateX(-50%)',
              width:           Math.min(sw * 0.55, 480),
              backgroundColor: isNight ? '#000000' : '#ffffff',
              padding:         '12px 20px',
              zIndex:          60,
              border:          `1px solid ${isNight ? 'rgba(201,169,110,0.4)' : 'rgba(78,52,46,0.3)'}`,
            }}
          >
            <p style={{
              fontFamily:    '"IBM Plex Mono", monospace',
              fontSize:      10,
              color:         isNight ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)',
              letterSpacing: '0.2em',
              margin:        '0 0 6px 0',
              textTransform: 'uppercase',
            }}>
              {'> BARKEEP'}
            </p>
            <BarkeepTypewriter
              text="Welcome to the Lucky Spur. You look like you've traveled a long way. Care to see the menu?"
              isNight={isNight}
              onComplete={() => {/* Continue button reveals after typing finishes */}}
            />
            <ContinueButton isNight={isNight} onClick={handleContinue} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Menu / specials label (shown after tilt) ── */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            key="bar-menu"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              position:  'absolute',
              top:       '50%',
              left:      '50%',
              transform: 'translate(-50%, -50%)',
              zIndex:    60,
              pointerEvents: 'none',
            }}
          >
            <BarMenuBook isNight={isNight} sw={sw} sh={sh} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showMenuLabel && (
          <motion.p
            key="menu-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.4 }}
            style={{
              position:      'absolute',
              bottom:        sh * 0.12,
              left:          0,
              right:         0,
              textAlign:     'center',
              fontSize:      10,
              letterSpacing: '0.2em',
              color:         isNight ? 'rgba(201,169,110,0.6)' : 'rgba(90,58,16,0.55)',
              textTransform: 'uppercase',
              margin:        0,
              pointerEvents: 'none',
              zIndex:        60,
            }}
          >
            {'> The specials are listed here. Take your time.'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Exit / Back button ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: FADE_IN_DURATION + 0.35 }}
        onClick={handleExit}
        style={{
          position:      'absolute',
          bottom:        sh * 0.04,
          left:          '50%',
          transform:     'translateX(-50%)',
          zIndex:        70,
          background:    'transparent',
          border:        `1px solid ${isNight ? 'rgba(201,169,110,0.4)' : 'rgba(90,58,16,0.35)'}`,
          color:         isNight ? '#c9a96e' : '#5a3a10',
          fontFamily:    '"IBM Plex Mono", monospace',
          fontSize:      10,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          padding:       '8px 20px',
          cursor:        'pointer',
          transition:    'border-color 1.5s, color 1.5s',
        }}
      >
        {isTilted ? '← Back' : isZoomed ? '← Back' : '← Exit'}
      </motion.button>

      {/* ── Black overlay — starts opaque, fades out on mount ── */}
      <motion.div
        ref={overlayScope}
        style={{
          position:        'absolute',
          inset:           0,
          zIndex:          50,
          backgroundColor: '#000000',
          opacity:         1,
          pointerEvents:   'none',
        }}
      />
    </div>
  )
}

// ─── Typewriter sub-component ─────────────────────────────────────────────────
function BarkeepTypewriter({
  text,
  isNight,
  onComplete,
}: {
  text: string
  isNight: boolean
  onComplete?: () => void
}) {
  const [displayed, setDisplayed] = useState('')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const completedRef = useRef(false)

  useEffect(() => {
    let i = 0
    completedRef.current = false
    setDisplayed('')
    intervalRef.current = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length && intervalRef.current) {
        clearInterval(intervalRef.current)
        if (!completedRef.current) {
          completedRef.current = true
          onComplete?.()
        }
      }
    }, 35)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [text, onComplete])

  return (
    <p style={{
      fontFamily: '"IBM Plex Mono", monospace',
      fontSize:    11,
      color:       isNight ? '#ffffff' : '#000000',
      lineHeight:  1.6,
      margin:      0,
      minHeight:   36,
    }}>
      {displayed}
      <span style={{ opacity: 0.5 }}>▌</span>
    </p>
  )
}

// ─── Continue button — appears after typewriter finishes ─────────────────────
function ContinueButton({ isNight, onClick }: { isNight: boolean; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay: 3.2 }}
      onClick={onClick}
      style={{
        display:       'block',
        marginTop:     8,
        marginLeft:    'auto',
        background:    'transparent',
        border:        `1px solid ${isNight ? 'rgba(201,169,110,0.35)' : 'rgba(78,52,46,0.25)'}`,
        color:         isNight ? '#c9a96e' : '#5a3a10',
        fontFamily:    '"IBM Plex Mono", monospace',
        fontSize:      9,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        padding:       '5px 14px',
        cursor:        'pointer',
        transition:    'border-color 0.3s, color 0.3s',
      }}
    >
      Continue →
    </motion.button>
  )
}

// ─── Bar menu book — SVG rendered on the bar surface ─────────────────────────
function BarMenuBook({ isNight, sw, sh }: { isNight: boolean; sw: number; sh: number }) {
  const bookW = Math.min(sw * 0.38, 320)
  const bookH = bookW * 1.3
  const p = isNight
    ? {
        cover:    '#2a1608',
        page:     'rgba(201,169,110,0.12)',
        pageLine: 'rgba(201,169,110,0.25)',
        spine:    '#c9a96e',
        title:    '#c9a96e',
        titleBg:  'rgba(201,169,110,0.08)',
      }
    : {
        cover:    '#6D4C41',
        page:     'rgba(255,249,224,0.6)',
        pageLine: 'rgba(78,52,46,0.2)',
        spine:    '#4E342E',
        title:    '#4E342E',
        titleBg:  'rgba(78,52,46,0.06)',
      }

  return (
    <svg
      width={bookW}
      height={bookH}
      viewBox="0 0 240 312"
      fill="none"
      style={{ display: 'block' }}
    >
      {/* Book cover — open, slightly angled */}
      <rect x="4" y="4" width="232" height="304" rx="3"
        fill={p.cover} stroke={p.spine} strokeWidth="1.5"
      />

      {/* Spine line */}
      <line x1="120" y1="8" x2="120" y2="304" stroke={p.spine} strokeWidth="1" strokeOpacity="0.4" />

      {/* Left page */}
      <rect x="12" y="12" width="104" height="288" rx="2"
        fill={p.page}
      />

      {/* Right page */}
      <rect x="124" y="12" width="104" height="288" rx="2"
        fill={p.page}
      />

      {/* Title block — centred on left page */}
      <rect x="24" y="24" width="80" height="20" rx="1" fill={p.titleBg} />
      <text
        x="64" y="38"
        textAnchor="middle"
        fill={p.title}
        fontFamily='"IBM Plex Mono", monospace'
        fontSize="7"
        letterSpacing="0.15em"
      >
        THE LUCKY SPUR
      </text>

      {/* Left page menu lines — "Specials" */}
      <text
        x="24" y="62"
        fill={p.title}
        fontFamily='"IBM Plex Mono", monospace'
        fontSize="6"
        letterSpacing="0.1em"
        opacity="0.7"
      >
        SPECIALS
      </text>
      {[
        [72, 100], [84, 96], [96, 104], [108, 92],
        [124, 108], [136, 98], [148, 104], [160, 94],
        [176, 100], [188, 106], [200, 96],
      ].map(([y, x2]) => (
        <line key={y}
          x1="24" y1={y} x2={x2} y2={y}
          stroke={p.pageLine} strokeWidth="0.8"
        />
      ))}

      {/* Right page menu lines — "Portfolio" */}
      <text
        x="136" y="30"
        fill={p.title}
        fontFamily='"IBM Plex Mono", monospace'
        fontSize="6"
        letterSpacing="0.1em"
        opacity="0.7"
      >
        PORTFOLIO
      </text>
      {[
        [42, 212], [54, 218], [66, 208], [78, 214],
        [94, 210], [106, 216], [118, 206], [130, 212],
        [146, 218], [158, 208], [170, 214], [182, 210],
        [198, 216], [210, 206],
      ].map(([y, x2]) => (
        <line key={y}
          x1="136" y1={y} x2={x2} y2={y}
          stroke={p.pageLine} strokeWidth="0.8"
        />
      ))}

      {/* Decorative corner ornaments */}
      {[[16, 16], [108, 16], [16, 296], [108, 296]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2"
          fill="none" stroke={p.spine} strokeWidth="0.6" strokeOpacity="0.3"
        />
      ))}
      {[[128, 16], [220, 16], [128, 296], [220, 296]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2"
          fill="none" stroke={p.spine} strokeWidth="0.6" strokeOpacity="0.3"
        />
      ))}
    </svg>
  )
}
