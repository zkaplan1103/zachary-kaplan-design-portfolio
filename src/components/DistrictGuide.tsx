import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ─── Sprite dimensions ────────────────────────────────────────────────────────
// All frames: rendered at 60×90 via objectFit:contain.
const W = 60
const H = 90

// Walk: ~375ms/frame for 4-frame cycle (1.5s total matches WALK_DUR)
// Breath: slower idle → 500ms/frame for 4-frame cycle (2s total)
const WALK_FRAME_MS   = 375
const BREATH_FRAME_MS = 500

// ─── Props ────────────────────────────────────────────────────────────────────

interface DistrictGuideProps {
  guideScope:   React.RefObject<HTMLDivElement | null>
  isNight:      boolean
  sh:           number
  initialX:     number     // home x on mount — prevents flash at left:0
  scaleX:       number     // 1 = faces right, -1 = faces left (controlled by parent)
  isMoving:     boolean    // true while Framer Motion walk animation is running
  walkFrames:   string[]   // ordered walk cycle frames
  idleFrames:   string[]   // ordered idle/breath cycle frames
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DistrictGuide({
  guideScope, sh, initialX, scaleX, isMoving, walkFrames, idleFrames,
}: DistrictGuideProps) {
  const [frameIdx, setFrameIdx] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const frames     = isMoving ? walkFrames : idleFrames
  const frameCount = frames.length
  const frameMs    = isMoving ? WALK_FRAME_MS : BREATH_FRAME_MS

  // Cycle frames — switches between idle loop and walk loop
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setFrameIdx(0)
    intervalRef.current = setInterval(() => {
      setFrameIdx((i) => (i + 1) % frameCount)
    }, frameMs)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [isMoving, frameCount, frameMs])

  const src = frames[frameIdx] ?? frames[0]

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
          transformOrigin: center bottom so the character flips from their feet. */}
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
            display:        'block',
            width:          W,
            height:         H,
            objectFit:      'contain',
            objectPosition: 'bottom center',
            imageRendering: 'pixelated',
          }}
        />
      </motion.div>
    </motion.div>
  )
}
