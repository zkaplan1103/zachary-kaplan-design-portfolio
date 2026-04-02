import type { MotionValue } from 'framer-motion'

// Shared props for all interior SVG components.
//
// mouseSpring:  spring-damped pan value, range -1 → 1 (left → right).
//               During IDLE: all layers move at identical speed (locked block).
//               A single panX transform is derived from this — no parallax.
//
// zoomProgress: 0 → 1 MotionValue animated during the barkeep zoom.
//               Each layer derives its own x-offset using useTransform.
//               This is where parallax lives — not in mouse pan.
export interface InteriorProps {
  isNight: boolean
  mouseSpring: MotionValue<number>
  zoomProgress: MotionValue<number>
  sw: number
  sh: number
  onBarkeepClick?: () => void
}
