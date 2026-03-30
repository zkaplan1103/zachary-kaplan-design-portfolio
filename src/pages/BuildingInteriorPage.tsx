import { useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, useAnimate } from 'framer-motion'
import { BUILDING_DIALOGUES } from '@/components/PokemonTextBox'
import { SaloonInterior }  from '@/components/interiors/SaloonInterior'
import { SheriffInterior } from '@/components/interiors/SheriffInterior'
import { BankInterior }    from '@/components/interiors/BankInterior'

// ─── Interior skeleton map ────────────────────────────────────────────────────
const INTERIOR_MAP: Record<string, React.ComponentType> = {
  saloon:  SaloonInterior,
  sheriff: SheriffInterior,
  bank:    BankInterior,
}

// ─── Fade timings (mirrors WesternTown GLOBAL_TRANSITION_SPEED = 800ms) ──────
// Town: zoom 800ms, fade starts at 450ms (200ms duration) = black by ~650ms
// Interior: reveal from black 400ms, content entrance ~150ms after
const FADE_IN_DURATION  = 0.4   // s: reveal from black on mount
const FADE_OUT_DURATION = 0.25  // s: fade to black before navigate back

// ─── Component ───────────────────────────────────────────────────────────────

export function BuildingInteriorPage() {
  const { buildingId } = useParams<{ buildingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const [overlayScope, animateOverlay] = useAnimate()
  const hasFadedIn = useRef(false)

  const dialogue = buildingId ? BUILDING_DIALOGUES[buildingId] : null
  const fromBuilding = (location.state as { fromBuilding?: string } | null)?.fromBuilding

  // Fade in from black on mount
  useEffect(() => {
    if (hasFadedIn.current) return
    hasFadedIn.current = true

    // Double RAF to ensure the ref is populated after React commit
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
    // Fade to black, then navigate back to the town with pull-back prop
    await animateOverlay(
      overlayScope.current,
      { opacity: 1 },
      { duration: FADE_OUT_DURATION, ease: 'easeIn' }
    )
    navigate('/', { state: { fromBuilding: buildingId ?? fromBuilding } })
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: '#0a0612',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '"IBM Plex Mono", monospace',
        color: '#f0efe9',
      }}
    >
      {/* Building name & placeholder content */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: FADE_IN_DURATION + 0.15 }}
        style={{ textAlign: 'center', maxWidth: '60%' }}
      >
        <p
          style={{
            fontSize: 10,
            letterSpacing: '0.25em',
            color: 'rgba(201,169,110,0.6)',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          {dialogue?.name ?? `> ${buildingId?.toUpperCase()}`}
        </p>
        {(() => {
          const Interior = buildingId ? INTERIOR_MAP[buildingId] : null
          return Interior
            ? <Interior />
            : (
              <p style={{ fontSize: 13, color: 'rgba(240,239,233,0.5)', lineHeight: 1.7 }}>
                [ Interior coming soon ]
              </p>
            )
        })()}
      </motion.div>

      {/* Exit button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: FADE_IN_DURATION + 0.35 }}
        onClick={handleExit}
        style={{
          position:        'absolute',
          bottom:          '8%',
          left:            '50%',
          transform:       'translateX(-50%)',
          background:      'transparent',
          border:          '1px solid rgba(201,169,110,0.4)',
          color:           '#c9a96e',
          fontFamily:      '"IBM Plex Mono", monospace',
          fontSize:        10,
          letterSpacing:   '0.2em',
          textTransform:   'uppercase',
          padding:         '8px 20px',
          cursor:          'pointer',
        }}
      >
        ← Exit
      </motion.button>

      {/* Black overlay — starts opaque, fades out on mount, fades in on exit */}
      <motion.div
        ref={overlayScope}
        style={{
          position:        'absolute',
          inset:           0,
          zIndex:          50,
          backgroundColor: '#000000',
          opacity:         1,         // starts fully black
          pointerEvents:   'none',
        }}
      />
    </div>
  )
}
