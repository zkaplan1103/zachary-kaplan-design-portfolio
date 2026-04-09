import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ─── Sprite imports ───────────────────────────────────────────────────────────

import walk0 from '@/assets/images/town-sprites/ezgif-split-navcowboy/tile000.png'
import walk1 from '@/assets/images/town-sprites/ezgif-split-navcowboy/tile001.png'
import walk2 from '@/assets/images/town-sprites/ezgif-split-navcowboy/tile002.png'
import walk3 from '@/assets/images/town-sprites/ezgif-split-navcowboy/tile003.png'
import walk4 from '@/assets/images/town-sprites/ezgif-split-navcowboy/tile004.png'
import walk5 from '@/assets/images/town-sprites/ezgif-split-navcowboy/tile005.png'

import breath0 from '@/assets/images/town-sprites/ezgif-split-cowboybreath/ezgif-split/tile000.png'
import breath1 from '@/assets/images/town-sprites/ezgif-split-cowboybreath/ezgif-split/tile001.png'
import breath2 from '@/assets/images/town-sprites/ezgif-split-cowboybreath/ezgif-split/tile002.png'
import breath3 from '@/assets/images/town-sprites/ezgif-split-cowboybreath/ezgif-split/tile003.png'
import breath4 from '@/assets/images/town-sprites/ezgif-split-cowboybreath/ezgif-split/tile004.png'
import breath5 from '@/assets/images/town-sprites/ezgif-split-cowboybreath/ezgif-split/tile005.png'

const WALK_FRAMES   = [walk0,   walk1,   walk2,   walk3,   walk4,   walk5]
const BREATH_FRAMES = [breath0, breath1, breath2, breath3, breath4, breath5]
const FRAME_COUNT   = 6

// Walk: 1 cycle per WALK_DUR (1.5s) → 250ms/frame
// Breath: slower idle loop → 2s cycle → ~333ms/frame
const WALK_FRAME_MS   = 250
const BREATH_FRAME_MS = 333

// ─── Sprite dimensions ────────────────────────────────────────────────────────
// All frames (walk + breath): 344×512 portrait — rendered at 80×120 via objectFit:contain.
const W = 80
const H = 120

// ─── Props ────────────────────────────────────────────────────────────────────

interface DistrictGuideProps {
  guideScope: React.RefObject<HTMLDivElement | null>
  isNight:    boolean
  sh:         number
  initialX:   number   // home x on mount — prevents flash at left:0
  scaleX:     number   // 1 = faces right, -1 = faces left (controlled by parent)
  isMoving:   boolean  // true while Framer Motion walk animation is running
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DistrictGuide({ guideScope, sh, initialX, scaleX, isMoving }: DistrictGuideProps) {
  const [frameIdx, setFrameIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Cycle frames — switches between breath loop (idle) and walk loop (moving)
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setFrameIdx(0)
    const ms = isMoving ? WALK_FRAME_MS : BREATH_FRAME_MS
    intervalRef.current = setInterval(() => {
      setFrameIdx((i) => (i + 1) % FRAME_COUNT)
    }, ms)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isMoving])

  const src = isMoving ? WALK_FRAMES[frameIdx] : BREATH_FRAMES[frameIdx]

  return (
    <motion.div
      ref={guideScope as React.RefObject<HTMLDivElement>}
      initial={{ x: initialX, opacity: 1 }}
      style={{
        position:      'absolute',
        bottom:        sh * 0.10,
        left:          0,
        zIndex:        55,
        pointerEvents: 'none',
        willChange:    'transform',
      }}
    >
      {/* Inner wrapper: handles direction flip — scaleX(-1) for left-facing.
          transformOrigin: center bottom so the cowboy flips from their feet. */}
      <motion.div
        animate={{ scaleX }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        style={{ transformOrigin: 'center bottom', display: 'inline-block' }}
      >
        <img
          src={src}
          alt=""
          aria-hidden="true"
          draggable={false}
          width={W}
          height={H}
          style={{
            display:         'block',
            width:           W,
            height:          H,
            objectFit:       'contain',
            objectPosition:  'bottom center',
            imageRendering:  'pixelated',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
