import type { MotionValue } from 'framer-motion'

// Shared props for all interior SVG components.
// mouseSpring: spring-damped value in range -1 → 1 (left → right).
// Each interior derives two MotionValues from this:
//   wallMV  = mouseSpring * sw * -0.10  (wall/floor/ceiling group, 10% speed)
//   furnMV  = mouseSpring * sw * -0.20  (furniture/NPC group, 20% speed)
// Both groups are 160% wide so edges never enter the viewport at any mouse position.
export interface InteriorProps {
  isNight:          boolean
  mouseSpring:      MotionValue<number>
  sw:               number
  sh:               number
  onBarkeepClick?:  () => void
}
