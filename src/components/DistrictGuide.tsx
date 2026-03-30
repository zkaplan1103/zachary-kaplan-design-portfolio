import { motion } from 'framer-motion'

// ─── Props ────────────────────────────────────────────────────────────────────

interface DistrictGuideProps {
  guideScope: React.RefObject<HTMLDivElement | null>
  isNight: boolean
  sh: number
  facingRight: boolean  // true = Guide A (District A, faces right toward stage)
  initialX: number      // home x position — prevents flash at left:0 on mount
}

// ─── SVG cowboy pixel-art silhouette ──────────────────────────────────────────
// 20×30 viewBox cowboy: hat, head, body, arms, legs, spurs.
// Color: warm gold in night, dark brown in day.

function CowboySvg({ color, facingRight }: { color: string; facingRight: boolean }) {
  return (
    <svg
      viewBox="0 0 20 30"
      width="20"
      height="30"
      fill="none"
      stroke={color}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: facingRight ? 'scaleX(1)' : 'scaleX(-1)', display: 'block' }}
      aria-hidden="true"
    >
      {/* Hat brim */}
      <line x1="3" y1="7" x2="17" y2="7" />
      {/* Hat crown */}
      <path d="M5 7 L5 2 Q10 0 15 2 L15 7" />
      {/* Head */}
      <ellipse cx="10" cy="10" rx="3.5" ry="3" />
      {/* Body */}
      <line x1="10" y1="13" x2="10" y2="21" />
      {/* Arms */}
      <line x1="10" y1="15" x2="4"  y2="18" />
      <line x1="10" y1="15" x2="16" y2="18" />
      {/* Legs */}
      <line x1="10" y1="21" x2="6"  y2="29" />
      <line x1="10" y1="21" x2="14" y2="29" />
      {/* Boot spurs */}
      <line x1="4"  y1="28" x2="7"  y2="29" />
      <line x1="13" y1="28" x2="16" y2="29" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DistrictGuide({ guideScope, isNight, sh, facingRight, initialX }: DistrictGuideProps) {
  const color = isNight ? '#c9a96e' : '#5a3a10'

  return (
    <motion.div
      ref={guideScope as React.RefObject<HTMLDivElement>}
      initial={{ x: initialX, opacity: 1 }}
      style={{
        position:        'absolute',
        bottom:          sh * 0.10,   // ground plane
        left:            0,           // x driven by animateGuideA/B via motion value
        zIndex:          55,
        pointerEvents:   'none',
        transformOrigin: 'bottom center',
      }}
    >
      <CowboySvg color={color} facingRight={facingRight} />
    </motion.div>
  )
}
