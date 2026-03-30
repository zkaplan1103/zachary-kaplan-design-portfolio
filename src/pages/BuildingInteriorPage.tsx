import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, useAnimate } from 'framer-motion'
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

// ─── Parallax pan multiplier ──────────────────────────────────────────────────
// Entire interior canvas pans as one rigid body.
// Mouse norm (-1→1) × sw × PAN_MULT = px shift.
// At 0.15 and sw~1200 the canvas shifts ~±90px — enough to reveal hidden edges.
const PAN_MULT = 0.15

// ─── Fade timings ─────────────────────────────────────────────────────────────
const FADE_IN_DURATION  = 0.4
const FADE_OUT_DURATION = 0.25

// ─── Component ───────────────────────────────────────────────────────────────

export function BuildingInteriorPage() {
  const { buildingId } = useParams<{ buildingId: string }>()
  const navigate  = useNavigate()
  const location  = useLocation()

  // Bezel dimensions — interior stage fills 130% of screen width
  const b  = useBezelContext()
  const sw = b.width
  const sh = b.height

  // Day/night from global store — synced with WesternTown
  const isNight = useUIStore((s) => s.isNight)

  // Fade overlay
  const [overlayScope, animateOverlay] = useAnimate()
  const hasFadedIn = useRef(false)

  // Mouse parallax
  const stageRef = useRef<HTMLDivElement>(null)
  const [mouseNorm, setMouseNorm] = useState(0)

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = stageRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouseNorm(((e.clientX - rect.left) / rect.width - 0.5) * 2)
  }, [])

  // Single pan — entire canvas shifts as rigid body
  const panX = mouseNorm * sw * -PAN_MULT

  const dialogue    = buildingId ? BUILDING_DIALOGUES[buildingId] : null
  const fromBuilding = (location.state as { fromBuilding?: string } | null)?.fromBuilding

  // Fade in from black on mount
  useEffect(() => {
    if (hasFadedIn.current) return
    hasFadedIn.current = true
    requestAnimationFrame(() =>
      requestAnimationFrame(async () => {
        await animateOverlay(
          overlayScope.current,
          { opacity: 0 },
          { duration: FADE_IN_DURATION, ease: 'easeOut' }
        )
      })
    )
  }, [animateOverlay, overlayScope])

  const handleExit = async () => {
    await animateOverlay(
      overlayScope.current,
      { opacity: 1 },
      { duration: FADE_OUT_DURATION, ease: 'easeIn' }
    )
    navigate('/', { state: { fromBuilding: buildingId ?? fromBuilding } })
  }

  const Interior = buildingId ? INTERIOR_MAP[buildingId] : null

  return (
    <div
      ref={stageRef}
      onMouseMove={onMouseMove}
      style={{
        position:   'absolute',
        inset:      0,
        zIndex:     400,   // above town (z:200 fade overlay) but under bezel
        overflow:   'hidden',
        fontFamily: '"IBM Plex Mono", monospace',
        color:      '#f0efe9',
      }}
    >
      {/* Interior fills bezel exactly — SVG inside handles the 130% overbleed */}
      {Interior ? (
        <Interior isNight={isNight} panX={panX} />
      ) : (
          <div
            style={{
              position:        'absolute',
              inset:           0,
              backgroundColor: isNight ? '#1a0e04' : '#c4a46a',
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

      {/* ── Building label — fades in after reveal ── */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: FADE_IN_DURATION + 0.15 }}
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

      {/* ── Exit button ── */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: FADE_IN_DURATION + 0.35 }}
        onClick={handleExit}
        style={{
          position:      'absolute',
          bottom:        sh * 0.06,
          left:          '50%',
          transform:     'translateX(-50%)',
          zIndex:        10,
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
        ← Exit
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
