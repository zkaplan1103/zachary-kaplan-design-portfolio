import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ─── Robber PNG sprite imports ────────────────────────────────────────────────

import robber0 from '@/assets/images/town-sprites/robber/tile000.png'
import robber1 from '@/assets/images/town-sprites/robber/tile001.png'
import robber2 from '@/assets/images/town-sprites/robber/tile002.png'
import robber3 from '@/assets/images/town-sprites/robber/tile003.png'
import robber4 from '@/assets/images/town-sprites/robber/tile004.png'
import robber5 from '@/assets/images/town-sprites/robber/tile005.png'

const ROBBER_FRAMES = [robber0, robber1, robber2, robber3, robber4, robber5]
const ROBBER_FRAME_MS = 100  // 6 frames × 100ms = 0.6s walk cycle

// ─── Character manifest ──────────────────────────────────────────────────────
//
// Each entry describes one ambient entity type.
// `yPct`  — vertical position as fraction of sh (0 = top, 1 = bottom)
// `speed` — duration in seconds to cross the full screen width
// `scale` — SVG scale multiplier relative to nominal size
//

export type CharacterId = 'HORSE_WAGON' | 'COWBOY_WALK' | 'NIGHT_RIDER' | 'BANK_ROBBER'

export interface CharacterDef {
  id:         CharacterId
  yPct:       number    // 0–1 fraction of sh, measured at entity bottom
  speed:      number    // seconds to cross screen
  scale:      number
  nightOnly?: boolean   // if true, only spawns when isNight=true
  color:      string    // neon stroke / fill colour
  glowColor:  string    // drop-shadow colour
  width:      number    // nominal SVG viewBox width (px equivalent)
  height:     number    // nominal SVG viewBox height (px equivalent)
}

export const CHARACTER_MANIFEST: CharacterDef[] = [
  {
    id: 'HORSE_WAGON',
    yPct: 0.905,    // ground line — matches COWBOY_WALK
    speed: 14,
    scale: 1.0,
    color: '#c9a96e',
    glowColor: 'rgba(201,169,110,0.6)',
    width: 80,
    height: 32,
  },
  {
    id: 'COWBOY_WALK',
    yPct: 0.905,
    speed: 22,
    scale: 0.85,
    color: '#e0c080',
    glowColor: 'rgba(224,192,128,0.5)',
    width: 20,
    height: 36,
  },
  {
    id: 'NIGHT_RIDER',
    yPct: 0.905,
    speed: 10,
    scale: 1.1,
    nightOnly: true,
    color: '#ff6060',
    glowColor: 'rgba(255,96,96,0.7)',
    width: 40,
    height: 40,
  },
  {
    id: 'BANK_ROBBER',
    yPct: 0.905,
    speed: 32,
    scale: 0.9,
    nightOnly: true,
    color: '#80c0ff',
    glowColor: 'rgba(128,192,255,0.5)',
    width: 40,
    height: 60,
  },
]

// ─── SVG shapes ──────────────────────────────────────────────────────────────

function HorseWagonSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 32" width="80" height="32" fill="none" aria-hidden="true">
      {/* Wagon body */}
      <rect x="20" y="8" width="38" height="16" rx="2" stroke={color} strokeWidth="1.5" />
      {/* Wagon cover arc */}
      <path d="M20 8 Q39 1 58 8" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Axle */}
      <line x1="26" y1="24" x2="26" y2="28" stroke={color} strokeWidth="1.5" />
      <line x1="52" y1="24" x2="52" y2="28" stroke={color} strokeWidth="1.5" />
      {/* Wheels */}
      <circle cx="26" cy="28" r="4" stroke={color} strokeWidth="1.5" />
      <circle cx="52" cy="28" r="4" stroke={color} strokeWidth="1.5" />
      {/* Wheel spokes */}
      <line x1="26" y1="24" x2="26" y2="32" stroke={color} strokeWidth="1" />
      <line x1="22" y1="28" x2="30" y2="28" stroke={color} strokeWidth="1" />
      <line x1="52" y1="24" x2="52" y2="32" stroke={color} strokeWidth="1" />
      <line x1="48" y1="28" x2="56" y2="28" stroke={color} strokeWidth="1" />
      {/* Tongue/shaft */}
      <line x1="20" y1="22" x2="8" y2="20" stroke={color} strokeWidth="1.5" />
      {/* Horse body */}
      <ellipse cx="6" cy="19" rx="6" ry="4" stroke={color} strokeWidth="1.5" />
      {/* Horse head */}
      <circle cx="1" cy="16" r="3" stroke={color} strokeWidth="1.5" />
      {/* Horse legs */}
      <line x1="4" y1="23" x2="3" y2="30" stroke={color} strokeWidth="1.5" />
      <line x1="7" y1="23" x2="8" y2="30" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function CowboyWalkSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 36" width="20" height="36" fill="none" aria-hidden="true">
      {/* Hat brim */}
      <line x1="2" y1="6" x2="18" y2="6" stroke={color} strokeWidth="1.5" />
      {/* Hat crown */}
      <rect x="5" y="1" width="10" height="5" rx="1" stroke={color} strokeWidth="1.5" />
      {/* Head */}
      <circle cx="10" cy="11" r="4" stroke={color} strokeWidth="1.5" />
      {/* Body */}
      <line x1="10" y1="15" x2="10" y2="26" stroke={color} strokeWidth="2" />
      {/* Arms */}
      <line x1="10" y1="18" x2="3" y2="22" stroke={color} strokeWidth="1.5" />
      <line x1="10" y1="18" x2="17" y2="21" stroke={color} strokeWidth="1.5" />
      {/* Legs — walking pose */}
      <line x1="10" y1="26" x2="5" y2="35" stroke={color} strokeWidth="1.5" />
      <line x1="10" y1="26" x2="14" y2="33" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

function NightRiderSvg({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" width="40" height="40" fill="none" aria-hidden="true">
      {/* Horse silhouette — gallop pose */}
      <ellipse cx="22" cy="24" rx="12" ry="7" stroke={color} strokeWidth="1.5" />
      {/* Head */}
      <circle cx="12" cy="19" r="4" stroke={color} strokeWidth="1.5" />
      {/* Neck */}
      <line x1="15" y1="21" x2="18" y2="24" stroke={color} strokeWidth="1.5" />
      {/* Legs — extended gallop */}
      <line x1="17" y1="31" x2="13" y2="40" stroke={color} strokeWidth="1.5" />
      <line x1="21" y1="31" x2="24" y2="40" stroke={color} strokeWidth="1.5" />
      <line x1="25" y1="31" x2="21" y2="40" stroke={color} strokeWidth="1.5" />
      <line x1="29" y1="31" x2="33" y2="38" stroke={color} strokeWidth="1.5" />
      {/* Tail */}
      <path d="M34 22 Q40 18 38 14" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Rider body */}
      <circle cx="20" cy="16" r="3" stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="19" x2="20" y2="24" stroke={color} strokeWidth="1.5" />
      {/* Rider hat */}
      <line x1="16" y1="13" x2="24" y2="13" stroke={color} strokeWidth="1.5" />
      <rect x="17" y="9" width="6" height="4" rx="1" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

const SVG_MAP: Record<Exclude<CharacterId, 'BANK_ROBBER'>, (color: string) => React.ReactNode> = {
  HORSE_WAGON:  (c) => <HorseWagonSvg color={c} />,
  COWBOY_WALK:  (c) => <CowboyWalkSvg color={c} />,
  NIGHT_RIDER:  (c) => <NightRiderSvg color={c} />,
}

// ─── Robber PNG sprite ────────────────────────────────────────────────────────

function RobberSprite({ direction, scaledW, scaledH }: { direction: 'ltr' | 'rtl'; scaledW: number; scaledH: number }) {
  const [frameIdx, setFrameIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setFrameIdx((i) => (i + 1) % ROBBER_FRAMES.length)
    }, ROBBER_FRAME_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  return (
    <div style={{
      width:           scaledW,
      height:          scaledH,
      transform:       direction === 'rtl' ? 'scaleX(-1)' : undefined,
      transformOrigin: 'center center',
    }}>
      <img
        src={ROBBER_FRAMES[frameIdx]}
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          display:        'block',
          width:          scaledW,
          height:         scaledH,
          objectFit:      'contain',
          objectPosition: 'bottom center',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  )
}

// ─── Props ───────────────────────────────────────────────────────────────────

export interface AmbientEntityProps {
  instanceId: string
  def:        CharacterDef
  sw:         number    // bezel screen width px
  sh:         number    // bezel screen height px
  direction:  'ltr' | 'rtl'
  onComplete: (instanceId: string) => void
  yOffset?:   number   // px offset added to top position (negative = move up)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AmbientEntity({ instanceId, def, sw, sh, direction, onComplete, yOffset = 0 }: AmbientEntityProps) {
  const scaledW = def.width  * def.scale
  const scaledH = def.height * def.scale
  const yPx     = sh * def.yPct - scaledH + yOffset  // bottom of entity at yPct * sh

  // RTL: flip the SVG horizontally via scaleX(-1)
  const flipStyle: React.CSSProperties = direction === 'rtl'
    ? { transform: 'scaleX(-1)', display: 'block' }
    : { display: 'block' }

  // x: enter from -20% of sw, exit at 120% of sw — ensures full centre-gap visibility
  const xStart = direction === 'ltr' ? sw * -0.20 - scaledW : sw * 1.20
  const xEnd   = direction === 'ltr' ? sw * 1.20             : sw * -0.20 - scaledW

  const hasAnimated = useRef(false)

  useEffect(() => {
    return () => { hasAnimated.current = false }
  }, [])

  return (
    <motion.div
      initial={{ x: xStart }}
      animate={{ x: xEnd }}
      transition={{ duration: def.speed, ease: 'linear' }}
      onAnimationComplete={() => {
        if (!hasAnimated.current) {
          hasAnimated.current = true
          onComplete(instanceId)
        }
      }}
      style={{
        position:      'absolute',
        top:           yPx,
        left:          0,
        width:         scaledW,
        height:        scaledH,
        zIndex:        20,   // between ground (z:15) and buildings (z:30)
        pointerEvents: 'none',
        filter:        def.id === 'BANK_ROBBER' ? 'none' : `drop-shadow(0 0 4px ${def.glowColor}) drop-shadow(0 0 8px ${def.glowColor})`,
      }}
    >
      {def.id === 'BANK_ROBBER' ? (
        <RobberSprite direction={direction} scaledW={scaledW} scaledH={scaledH} />
      ) : (
        <div
          style={{
            ...flipStyle,
            width:  scaledW,
            height: scaledH,
            transformOrigin: 'center center',
          }}
        >
          <div style={{ transform: `scale(${def.scale})`, transformOrigin: 'top left' }}>
            {SVG_MAP[def.id as Exclude<CharacterId, 'BANK_ROBBER'>](def.color)}
          </div>
        </div>
      )}
    </motion.div>
  )
}
