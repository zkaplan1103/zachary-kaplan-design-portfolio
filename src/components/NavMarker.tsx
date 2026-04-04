import { motion } from 'framer-motion'

// ─── Label map ────────────────────────────────────────────────────────────────
export const NAV_LABELS: Record<string, string> = {
  saloon: 'About',
  sheriff: 'Experience',
  bank: 'Projects',
  telegraph: 'Contact',
}

// ─── Staggered bob delays ─────────────────────────────────────────────────────
const BOB_DELAYS: Record<string, number> = {
  saloon: 0,
  sheriff: 0.7,
  bank: 1.4,
  telegraph: 1.05,
}

// ─── Props ────────────────────────────────────────────────────────────────────
// cx:          absolute pixel x — building centre in world coordinates
// roofY:       absolute pixel y — top of building in screen space (bottom - height)
// isHovered:   drives scale + glow
// isNight:     drives text colour
// buildingId:  drives label text + bob delay

export interface NavMarkerProps {
  buildingId: string
  cx: number // centre x of building in screen px (with parallax baked in)
  roofY: number // y of roofline in screen px
  isHovered: boolean
  isNight: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────
// Rendered in a shared absolute overlay that is OUTSIDE the overflow:hidden
// district containers. Position is set via left/top so the label is always
// exactly centred on the building regardless of which district it belongs to.

export function NavMarker({ buildingId, cx, roofY, isHovered, isNight }: NavMarkerProps) {
  const label = NAV_LABELS[buildingId]
  if (!label) return null

  const delay = BOB_DELAYS[buildingId] ?? 0
  const textColor = isNight ? '#FFFFFF' : '#000000'
  const hoverFilter = isNight
    ? 'drop-shadow(0 0 6px rgba(255,255,255,0.8))'
    : 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))'

  return (
    <motion.div
      // Bob loop — y relative to own position
      animate={{ y: [0, -8, 0] }}
      transition={{
        duration: 3,
        ease: 'easeInOut',
        repeat: Infinity,
        delay,
        repeatDelay: 0,
      }}
      style={{
        position: 'absolute',
        left: cx,
        top: roofY - 30, // 30px above roofline
        transform: 'translateX(-50%)',
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      <motion.span
        animate={{
          scale: isHovered ? 1.1 : 1,
          filter: isHovered ? hoverFilter : 'none',
          color: textColor,
        }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        style={{
          display: 'block',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: textColor,
          whiteSpace: 'nowrap',
          userSelect: 'none',
          transition: 'color 1.5s',
        }}
      >
        {label}
      </motion.span>
    </motion.div>
  )
}
