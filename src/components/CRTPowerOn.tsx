import { motion } from 'framer-motion'
import { useState } from 'react'

export default function CRTPowerOn() {
  const [done, setDone] = useState(false)
  if (done) return null
  return (
    <motion.div
      initial={{ scaleX: 0, scaleY: 0, opacity: 0, filter: 'brightness(0) hue-rotate(0deg)' }}
      animate={{
        // Phase 1 (0→80ms):  dot snaps into existence from nothing
        // Phase 2 (80→230ms): dot expands horizontally to full-width line
        // Phase 3 (230→530ms): line expands vertically, brightness overshoots
        // Phase 4 (530→680ms): brightness settles, phosphor tint normalises
        scaleX: [0,    0.04,  1,     1,     1   ],
        scaleY: [0,    0.04,  0.015, 1,     1   ],
        opacity: [0,   1,     1,     1,     1   ],
        filter: [
          'brightness(0) hue-rotate(0deg)',
          'brightness(5) hue-rotate(0deg)',
          'brightness(3) hue-rotate(15deg)',
          'brightness(1.8) hue-rotate(5deg)',
          'brightness(1) hue-rotate(0deg)',
        ],
      }}
      transition={{
        duration: 0.68,
        times: [0, 0.12, 0.34, 0.78, 1.0],
        ease: 'easeOut' as const,
      }}
      style={{
        transformOrigin: 'center center',
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: '#0d0d0d',
        pointerEvents: 'none',
      }}
      onAnimationComplete={() => setDone(true)}
    />
  )
}
