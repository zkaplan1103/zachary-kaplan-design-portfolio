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

// ─── Zoom-to-seat ─────────────────────────────────────────────────────────────
const ZOOM_SCALE    = 2.8
const ZOOM_DURATION = 0.8
const ZOOM_Y_PCT    = 0.18

// ─── 3D Hinge geometry ───────────────────────────────────────────────────────
//
// Perspective: 1200px on parent — prevents "fading" look on rotateX.
//
// The "L-shape fold":
//   Interior exits:  rotateX(0) → rotateX(-90deg), origin = bottom
//   Surface enters:  rotateX(90deg) → rotateX(0),  origin = top
//
// Both animate simultaneously for 400ms — they share a hinge axis at
// the centre-bottom / centre-top boundary, creating a seamless 90° fold.
const PERSPECTIVE       = 1200   // px — on the hingeWrapper div
const LEAN_SCALE        = 4.5    // punch-in scale before fold
const LEAN_DURATION     = 0.3    // seconds
const LEAN_Y_EXTRA      = 0.08
const HINGE_DURATION    = 0.4    // seconds — simultaneous fold
const HINGE_EASE        = [0.4, 0, 0.2, 1] as const
// Surface spring — high damping so it THUDS, no bounce
const SURFACE_STIFFNESS = 320
const SURFACE_DAMPING   = 48

// ─── Component ───────────────────────────────────────────────────────────────

export function BuildingInteriorPage() {
  const { buildingId } = useParams<{ buildingId: string }>()
  const navigate  = useNavigate()
  const location  = useLocation()

  const b  = useBezelContext()
  const sw = b.width
  const sh = b.height

  const isNight = useUIStore((s) => s.isNight)

  const [overlayScope,  animateOverlay]  = useAnimate()
  const [stageScope,    animateStage]    = useAnimate()   // room zoom + lean
  const [roomScope,     animateRoom]     = useAnimate()   // room rotateX exit
  const [surfaceScope,  animateSurface]  = useAnimate()   // surface rotateX entry
  const hasFadedIn = useRef(false)

  const stageRef    = useRef<HTMLDivElement>(null)
  const [mouseNorm, setMouseNorm] = useState(0)
  const mouseSpring = useSpring(mouseNorm, SPRING_CONFIG)

  // ── State machine: wide → zoomed → tilted ──
  const [isZoomed,      setIsZoomed]      = useState(false)
  const [isTilted,      setIsTilted]      = useState(false)
  const [lookUpDisabled, setLookUpDisabled] = useState(false)
  const [showDialogue,  setShowDialogue]  = useState(false)
  const [showSurface,   setShowSurface]   = useState(false)
  const [showMenu,      setShowMenu]      = useState(false)
  const [showMenuLabel, setShowMenuLabel] = useState(false)

  const hingeLock = useRef(false)

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (isZoomed || isTilted) return
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    const norm = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    setMouseNorm(norm)
    mouseSpring.set(norm)
  }, [mouseSpring, isZoomed, isTilted])

  const dialogue     = buildingId ? BUILDING_DIALOGUES[buildingId] : null
  const fromBuilding = (location.state as { fromBuilding?: string } | null)?.fromBuilding

  // ── Entry ──
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
    mouseSpring.jump(mouseSpring.get())

    await animateStage(
      stageScope.current,
      { scale: ZOOM_SCALE, y: sh * ZOOM_Y_PCT },
      { duration: ZOOM_DURATION, ease: 'easeOut' }
    )
    setShowDialogue(true)
  }, [isZoomed, mouseSpring, animateStage, stageScope, sh])

  // ── Continue → 3D Hinge ("Look Down") ──
  const handleContinue = useCallback(async () => {
    if (isTilted || hingeLock.current) return
    hingeLock.current = true
    setShowDialogue(false)
    setIsTilted(true)

    // Phase 1 — Lean in: punch to 4.5× while room pitches -15°
    await animateStage(
      stageScope.current,
      {
        scale:   LEAN_SCALE,
        y:       sh * (ZOOM_Y_PCT + LEAN_Y_EXTRA),
        rotateX: -15,
      },
      { duration: LEAN_DURATION, ease: [0.4, 0, 0.7, 1] }
    )

    // Mount surface (starts at rotateX:90 via initial prop, invisible)
    setShowSurface(true)

    // One rAF so React mounts the surface div before we fire the hinge
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))

    // Phase 2 — Simultaneous hinge fold:
    //   Room:    rotateX -15 → -90  (origin: bottom — wall falls forward)
    //   Surface: rotateX  90 →   0  (origin: top    — table swings up)
    await Promise.all([
      animateRoom(
        roomScope.current,
        { rotateX: -90 },
        { duration: HINGE_DURATION, ease: HINGE_EASE }
      ),
      animateSurface(
        surfaceScope.current,
        { rotateX: 0 },
        {
          type:      'spring',
          stiffness: SURFACE_STIFFNESS,
          damping:   SURFACE_DAMPING,
        }
      ),
    ])

    hingeLock.current = false
    // Menu appears when surface spring settles (via onAnimationComplete on surfaceScope)
  }, [
    isTilted, animateStage, stageScope,
    animateRoom, roomScope, animateSurface, surfaceScope, sh,
  ])

  // Called by surface spring's onAnimationComplete
  const handleSurfaceSettled = useCallback(() => {
    setShowMenu(true)
    setTimeout(() => setShowMenuLabel(true), 300)
  }, [])

  // ── "Look Up" — reverse hinge ──
  const handleExit = async () => {
    if (isTilted) {
      // Step 1: Disable button immediately to prevent double-fire
      if (lookUpDisabled || hingeLock.current) return
      setLookUpDisabled(true)
      hingeLock.current = true
      setShowMenuLabel(false)
      setShowMenu(false)

      // Step 2: Reverse hinge — surface rotates back to 90°, room back to -15° (simultaneous)
      await Promise.all([
        animateSurface(
          surfaceScope.current,
          { rotateX: 90 },
          { duration: HINGE_DURATION, ease: HINGE_EASE }
        ),
        animateRoom(
          roomScope.current,
          { rotateX: -15 },
          { duration: HINGE_DURATION, ease: HINGE_EASE }
        ),
      ])

      // Step 3: Unmount surface, ensure room is visible
      setShowSurface(false)

      // Step 4: Instant-restore room's zoom + lean state (duration:0, under blur)
      // Room is already at rotateX:-15 from the reverse above.
      // stageScope needs to be at LEAN_SCALE / lean-y so the zoom-out starts correctly.
      await animateStage(
        stageScope.current,
        {
          scale:   LEAN_SCALE,
          y:       sh * (ZOOM_Y_PCT + LEAN_Y_EXTRA),
          rotateX: -15,
        },
        { duration: 0 }
      )

      // Step 5: Smooth zoom-out back to ZOOM_SCALE (barkeep framed), rotateX back to 0
      await Promise.all([
        animateStage(
          stageScope.current,
          { scale: ZOOM_SCALE, y: sh * ZOOM_Y_PCT, rotateX: 0 },
          { duration: 0.5, ease: 'easeInOut' }
        ),
        animateRoom(
          roomScope.current,
          { rotateX: 0 },
          { duration: 0.5, ease: 'easeInOut' }
        ),
      ])

      // Step 6: Room fully restored — show dialogue, re-enable button
      setIsTilted(false)
      setShowDialogue(true)
      setLookUpDisabled(false)
      hingeLock.current = false
      return
    }

    // Zoomed → wide
    if (isZoomed) {
      setShowDialogue(false)
      await animateStage(
        stageScope.current,
        { scale: 1, y: 0, rotateX: 0 },
        { duration: 0.5, ease: 'easeInOut' }
      )
      setIsZoomed(false)
      return
    }

    // Wide → exit to town
    await animateOverlay(
      overlayScope.current,
      { opacity: 1 },
      { duration: FADE_OUT_DURATION, ease: 'easeIn' }
    )
    navigate('/', { state: { fromBuilding: buildingId ?? fromBuilding } })
  }

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
        position:   'absolute',
        inset:      0,
        zIndex:     400,
        overflow:   'hidden',
        fontFamily: '"IBM Plex Mono", monospace',
        color:      '#f0efe9',
      }}
    >
      {/* ── Zoom stage — scale + y translate for approach ── */}
      <motion.div
        ref={stageScope}
        initial={{ scale: 1.05 }}
        style={{
          position:        'absolute',
          inset:           0,
          transformOrigin: 'center 60%',
          // perspective here so rotateX on this element has depth
          perspective:     PERSPECTIVE,
        }}
      >
        {/* ── 3D hinge scene — both panels live here ── */}
        <div style={{
          position:      'absolute',
          inset:         0,
          // preserve-3d so child rotateX values are in the same 3D space
          transformStyle: 'preserve-3d',
        }}>

          {/* ── Room panel — exits rotateX(0) → rotateX(-90°), origin: bottom ── */}
          <motion.div
            ref={roomScope}
            initial={{ rotateX: 0 }}
            style={{
              position:           'absolute',
              inset:              0,
              transformOrigin:    'center bottom',
              transformStyle:     'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
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
              <div style={{
                position:        'absolute',
                inset:           0,
                backgroundColor: isNight ? '#1A1412' : '#A1887F',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                transition:      'background-color 1.5s',
              }}>
                <p style={{ fontSize: 13, color: 'rgba(240,239,233,0.5)', lineHeight: 1.7 }}>
                  [ Interior coming soon ]
                </p>
              </div>
            )}
          </motion.div>

          {/* ── Surface panel — enters rotateX(90°) → rotateX(0), origin: top ── */}
          {showSurface && (
            <motion.div
              ref={surfaceScope}
              initial={{ rotateX: 90 }}
              onAnimationComplete={handleSurfaceSettled}
              style={{
                position:           'absolute',
                inset:              0,
                transformOrigin:    'center top',
                transformStyle:     'preserve-3d',
                backfaceVisibility: 'hidden',
              }}
            >
              <BarSurface isNight={isNight} />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Building label (wide view only) ── */}
      <AnimatePresence>
        {!isZoomed && (
          <motion.p
            key="building-label"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, delay: FADE_IN_DURATION + 0.15 }}
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
            />
            <ContinueButton isNight={isNight} onClick={handleContinue} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Menu book — scale 0.8→1.0 after surface spring fully settles ── */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            key="menu-overlay"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.45, ease: [0.2, 0, 0.3, 1] }}
            style={{
              position:       'absolute',
              inset:          0,
              zIndex:         55,
              pointerEvents:  'none',
              display:        'flex',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <ZackMenu isNight={isNight} sw={sw} sh={sh} />
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
              position:      'absolute',
              bottom:        sh * 0.07,
              left:          0,
              right:         0,
              textAlign:     'center',
              fontSize:      10,
              letterSpacing: '0.2em',
              color:         isNight ? 'rgba(201,169,110,0.6)' : 'rgba(90,58,16,0.55)',
              textTransform: 'uppercase',
              margin:        0,
              pointerEvents: 'none',
              zIndex:        65,
            }}
          >
            {'> Take your time. The good stuff is on every page.'}
          </motion.p>
        )}
      </AnimatePresence>

      {/* ── Exit / Back / Look Up ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: FADE_IN_DURATION + 0.35 }}
        onClick={handleExit}
        disabled={lookUpDisabled}
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
          cursor:        lookUpDisabled ? 'default' : 'pointer',
          opacity:       lookUpDisabled ? 0.4 : 1,
          transition:    'border-color 1.5s, color 1.5s, opacity 0.2s',
        }}
      >
        {isTilted ? '↑ Look Up' : isZoomed ? '← Back' : '← Exit'}
      </motion.button>

      {/* ── Black overlay ── */}
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

// ─── Bar Surface — tabletop SVG viewBox 0 0 1000 600 ─────────────────────────
//
// Dark mahogany base. 6 horizontal planks with 1px gaps. 3 wear ellipses.
// A centred <g id="menu-anchor"> marks where ZackMenu renders over it.

function BarSurface({ isNight }: { isNight: boolean }) {
  const MAHOGANY     = isNight ? '#1e0905' : '#5C3317'
  const PLANK_DARK   = isNight ? '#180704' : '#52291A'
  const PLANK_LIGHT  = isNight ? '#221007' : '#6B3D26'
  const GRAIN        = isNight ? 'rgba(201,169,110,0.055)' : 'rgba(78,52,46,0.07)'
  const GRAIN_HEAVY  = isNight ? 'rgba(201,169,110,0.09)'  : 'rgba(78,52,46,0.11)'
  const PLANK_GAP    = isNight ? '#0a0402' : '#2a1208'
  const WEAR         = isNight ? 'rgba(201,169,110,0.03)'  : 'rgba(78,52,46,0.05)'
  const LAMP_GLOW    = isNight ? 'rgba(255,172,0,0.16)'    : 'rgba(255,248,200,0.22)'
  const VIGNETTE     = isNight ? 'rgba(0,0,0,0.55)'        : 'rgba(0,0,0,0.22)'
  const RING         = isNight ? 'rgba(201,169,110,0.07)'  : 'rgba(78,52,46,0.09)'

  // Plank heights — 6 planks filling 600px, with 1px gaps between
  const PLANK_H = 98   // (600 - 5 gaps) / 6 ≈ 99, use 98 to leave gap room
  const planks  = [0, 100, 200, 300, 400, 500]

  return (
    <div style={{
      position:        'absolute',
      inset:           0,
      backgroundColor: MAHOGANY,
      overflow:        'hidden',
    }}>
      <svg
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid slice"
        width="100%" height="100%"
        style={{ display: 'block', position: 'absolute', inset: 0 }}
        fill="none"
      >
        <defs>
          {/* Lamp cone — radial from top-centre */}
          <radialGradient id="bs-lamp" cx="50%" cy="8%" r="70%" fx="50%" fy="8%">
            <stop offset="0%"   stopColor={LAMP_GLOW} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* Edge vignette */}
          <radialGradient id="bs-vignette" cx="50%" cy="50%" r="60%">
            <stop offset="30%"  stopColor="transparent" />
            <stop offset="100%" stopColor={VIGNETTE} />
          </radialGradient>
        </defs>

        {/* ── 6 horizontal planks ── */}
        {planks.map((py, i) => {
          const fill = i % 2 === 0 ? PLANK_DARK : PLANK_LIGHT
          return (
            <g key={i}>
              {/* Plank body */}
              <rect x="0" y={py} width="1000" height={PLANK_H} fill={fill} />

              {/* 1px gap between planks */}
              {i < planks.length - 1 && (
                <line
                  x1="0" y1={py + PLANK_H}
                  x2="1000" y2={py + PLANK_H}
                  stroke={PLANK_GAP} strokeWidth="2"
                />
              )}

              {/* Grain lines — 4 per plank, varying x-start and width */}
              {[16, 34, 58, 80].map((offset, j) => {
                const gy    = py + offset
                const gx1   = ((i * 79 + j * 131) % 160)
                const gx2   = Math.min(gx1 + 220 + ((j * 97 + i * 53) % 500), 1000)
                const heavy = (i + j) % 3 === 0
                return (
                  <line key={j}
                    x1={gx1} y1={gy}
                    x2={gx2}   y2={gy}
                    stroke={heavy ? GRAIN_HEAVY : GRAIN}
                    strokeWidth={heavy ? 1.2 : 0.7}
                  />
                )
              })}
            </g>
          )
        })}

        {/* ── Lamp light cone ── */}
        <rect x="0" y="0" width="1000" height="600" fill="url(#bs-lamp)" />

        {/* ── Edge vignette ── */}
        <rect x="0" y="0" width="1000" height="600" fill="url(#bs-vignette)" />

        {/* ── Wear marks — 3 elongated ellipses (glass ring paths) ── */}
        <ellipse cx="680" cy="430" rx="38" ry="12"
          fill={WEAR} stroke={RING} strokeWidth="0.8"
          transform="rotate(-8 680 430)"
        />
        <ellipse cx="280" cy="180" rx="28" ry="9"
          fill={WEAR} stroke={RING} strokeWidth="0.7"
          transform="rotate(5 280 180)"
        />
        <ellipse cx="820" cy="140" rx="22" ry="7"
          fill={WEAR} stroke={RING} strokeWidth="0.6"
          transform="rotate(-3 820 140)"
        />

        {/* ── Glass ring stains (old dried rings) ── */}
        <circle cx="720" cy="390" r="22"
          fill="none" stroke={RING} strokeWidth="1"
        />
        <circle cx="255" cy="170" r="16"
          fill="none" stroke={RING} strokeWidth="0.8"
        />

        {/* ── Menu book drop shadow (pre-rendered under ZackMenu overlay) ── */}
        <rect x="310" y="195" width="380" height="240" rx="6"
          fill={isNight ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.22)'}
          style={{ filter: 'blur(20px)' }}
        />

        {/* ── Menu anchor — centre marker ── */}
        <g id="menu-anchor" transform="translate(500, 300)">
          {/* Invisible reference point — ZackMenu overlays this */}
        </g>
      </svg>
    </div>
  )
}

// ─── ZackMenu — 3-page spread hardcoded SVG ──────────────────────────────────
//
// Page 1 (left):  "Zack's Specials" — Water Polo / Academic All-American
// Page 2 (right top): "The Startup" — Terrapin Rewards
// Page 3 (right bottom): "The Vision" — UI/UX Software Engineering

function ZackMenu({ isNight, sw, sh }: { isNight: boolean; sw: number; sh: number }) {
  const bookW = Math.min(sw * 0.58, 440)
  const bookH = bookW * 0.72

  const c = isNight
    ? {
        cover:       '#1e0e04',
        page:        'rgba(201,169,110,0.10)',
        pageLine:    'rgba(201,169,110,0.18)',
        spine:       '#c9a96e',
        title:       '#c9a96e',
        body:        'rgba(201,169,110,0.55)',
        accent:      'rgba(255,179,0,0.75)',
        titleBg:     'rgba(201,169,110,0.06)',
        spineShadow: 'rgba(0,0,0,0.35)',
        separator:   'rgba(201,169,110,0.12)',
      }
    : {
        cover:       '#5D4037',
        page:        'rgba(255,249,224,0.78)',
        pageLine:    'rgba(78,52,46,0.14)',
        spine:       '#4E342E',
        title:       '#4E342E',
        body:        'rgba(78,52,46,0.6)',
        accent:      'rgba(120,60,20,0.85)',
        titleBg:     'rgba(78,52,46,0.04)',
        spineShadow: 'rgba(0,0,0,0.10)',
        separator:   'rgba(78,52,46,0.10)',
      }

  const F = '"IBM Plex Mono", monospace'

  return (
    <svg
      width={bookW} height={bookH}
      viewBox="0 0 460 332"
      fill="none"
      style={{ display: 'block', marginTop: -sh * 0.03 }}
    >
      {/* Drop shadow */}
      <rect x="8" y="12" width="444" height="316" rx="6"
        fill={isNight ? 'rgba(0,0,0,0.50)' : 'rgba(0,0,0,0.15)'}
        style={{ filter: 'blur(12px)' }}
      />

      {/* Book cover */}
      <rect x="4" y="4" width="452" height="324" rx="4"
        fill={c.cover} stroke={c.spine} strokeWidth="1.5"
      />

      {/* Left page */}
      <rect x="12" y="12" width="214" height="308" rx="2" fill={c.page} />
      {/* Right page */}
      <rect x="234" y="12" width="214" height="308" rx="2" fill={c.page} />

      {/* Spine */}
      <line x1="230" y1="8" x2="230" y2="324"
        stroke={c.spine} strokeWidth="1.5" strokeOpacity="0.4"
      />

      {/* Spine curl shadows */}
      <defs>
        <linearGradient id="zk-curl-l" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="transparent" />
          <stop offset="100%" stopColor={c.spineShadow} />
        </linearGradient>
        <linearGradient id="zk-curl-r" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor={c.spineShadow} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <rect x="212" y="12" width="18" height="308" fill="url(#zk-curl-l)" />
      <rect x="230" y="12" width="18" height="308" fill="url(#zk-curl-r)" />

      {/* ══ PAGE 1 — ZACK'S SPECIALS ══ */}
      <rect x="24" y="20" width="190" height="26" rx="1" fill={c.titleBg} />
      <text x="119" y="38" textAnchor="middle"
        fill={c.title} fontFamily={F} fontSize="9"
        letterSpacing="0.18em" fontWeight="600"
      >ZACK'S SPECIALS</text>

      <text x="24" y="60" fill={c.body} fontFamily={F}
        fontSize="6" letterSpacing="0.08em"
      >Water Polo · Academic All-American</text>
      <line x1="24" y1="68" x2="210" y2="68" stroke={c.separator} strokeWidth="0.6" />

      <text x="24" y="84" fill={c.title} fontFamily={F}
        fontSize="6.5" letterSpacing="0.06em" opacity="0.8"
      >CAREER STATS</text>

      {[
        [98,  '4-Year Starter, Goalkeeper'],
        [112, 'Academic All-American'],
        [126, 'Conference Champion'],
        [140, 'Captain, Senior Year'],
      ].map(([y, line]) => (
        <text key={y as number} x="28" y={y as number}
          fill={c.body} fontFamily={F} fontSize="5.8" letterSpacing="0.04em"
        >{line as string}</text>
      ))}

      <line x1="24" y1="152" x2="140" y2="152" stroke={c.separator} strokeWidth="0.6" />

      <text x="24" y="168" fill={c.title} fontFamily={F}
        fontSize="6.5" letterSpacing="0.06em" opacity="0.8"
      >TRAITS FORGED</text>

      {[
        [182, 'Discipline under pressure'],
        [196, 'Team-first mentality'],
        [210, 'Relentless work ethic'],
        [224, 'Leadership by example'],
      ].map(([y, line]) => (
        <text key={y as number} x="28" y={y as number}
          fill={c.body} fontFamily={F} fontSize="5.8" letterSpacing="0.04em"
        >{line as string}</text>
      ))}

      <line x1="24" y1="236" x2="140" y2="236" stroke={c.separator} strokeWidth="0.6" />

      <text x="24" y="254" fill={c.accent} fontFamily={F}
        fontSize="5.5" letterSpacing="0.04em" fontStyle="italic"
      >"The pool taught me that</text>
      <text x="24" y="266" fill={c.accent} fontFamily={F}
        fontSize="5.5" letterSpacing="0.04em" fontStyle="italic"
      > every pixel matters as much</text>
      <text x="24" y="278" fill={c.accent} fontFamily={F}
        fontSize="5.5" letterSpacing="0.04em" fontStyle="italic"
      > as every second on the clock."</text>

      {/* ══ PAGE 2 — THE STARTUP ══ */}
      <text x="246" y="30" fill={c.title} fontFamily={F}
        fontSize="7.5" letterSpacing="0.14em" fontWeight="600"
      >THE STARTUP</text>
      <text x="246" y="44" fill={c.body} fontFamily={F}
        fontSize="5.5" letterSpacing="0.06em"
      >Terrapin Rewards · 1 of 2 Employees</text>
      <line x1="246" y1="52" x2="432" y2="52" stroke={c.separator} strokeWidth="0.6" />

      {[
        [66,  'Built the entire product from zero:'],
        [80,  'UI/UX design, front-end, branding.'],
        [98,  'Pitched to investors. Won funding.'],
        [112, 'Managed dev sprints solo while'],
        [126, 'co-founder handled operations.'],
        [144, 'Learned that wearing every hat'],
        [158, 'makes you a better designer —'],
        [172, 'you understand constraints deeply.'],
      ].map(([y, line]) => (
        <text key={y as number} x="250" y={y as number}
          fill={c.body} fontFamily={F} fontSize="5.8" letterSpacing="0.04em"
        >{line as string}</text>
      ))}

      <line x1="246" y1="186" x2="360" y2="186" stroke={c.separator} strokeWidth="0.6" />

      {/* ══ PAGE 3 — THE VISION ══ */}
      <text x="246" y="204" fill={c.title} fontFamily={F}
        fontSize="7.5" letterSpacing="0.14em" fontWeight="600"
      >THE VISION</text>
      <text x="246" y="218" fill={c.body} fontFamily={F}
        fontSize="5.5" letterSpacing="0.06em"
      >UI/UX · Software Engineering</text>
      <line x1="246" y1="226" x2="432" y2="226" stroke={c.separator} strokeWidth="0.6" />

      {[
        [240, 'Design systems that scale.'],
        [254, 'Interfaces that feel alive.'],
        [268, 'Code that respects the craft.'],
        [286, 'Looking for a team that ships'],
        [300, 'beautiful, purposeful software.'],
      ].map(([y, line]) => (
        <text key={y as number} x="250" y={y as number}
          fill={c.body} fontFamily={F} fontSize="5.8" letterSpacing="0.04em"
        >{line as string}</text>
      ))}

      {/* Corner ornaments */}
      {[
        [16, 16], [220, 16], [16, 316], [220, 316],
        [238, 16], [440, 16], [238, 316], [440, 316],
      ].map(([ox, oy]) => (
        <circle key={`${ox}-${oy}`} cx={ox} cy={oy} r="2"
          fill="none" stroke={c.spine}
          strokeWidth="0.5" strokeOpacity="0.25"
        />
      ))}
    </svg>
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [text])

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

// ─── Continue button ──────────────────────────────────────────────────────────
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
