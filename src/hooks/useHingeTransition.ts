import { useCallback, useState } from 'react'
import { useAnimate } from 'framer-motion'

// ─── 3D Hinge coordinate system ─────────────────────────────────────────────
//
// Wall panel:    transform-origin: center bottom
//   rotateX(-90) → top swings AWAY from user
//
// Surface panel: transform-origin: center top
//   rotateX(90→0) → bar rises into view from below
//
// Hinge always runs at the CURRENT zoom level. Zoom changes are separate
// sequential phases to prevent revealing off-screen areas (ceiling lights).

const HINGE_DURATION = 1.6                                 // 1600ms
const HINGE_EASE     = [0.45, 0, 0.55, 1] as const        // Slow-In, Slow-Out
const ZOOM_REVEAL    = 0.8                                 // 800ms zoom in/out

interface HingeResult {
  roomScope:    ReturnType<typeof useAnimate>[0]
  surfaceScope: ReturnType<typeof useAnimate>[0]
  stageScope:   ReturnType<typeof useAnimate>[0]
  roomHidden:   boolean
  isAnimating:  boolean
  /** Look Down: hinge wall away → hide room → zoom out → ready for menu */
  lookDown:     (zoomScale: number, zoomY: number) => Promise<void>
  /** Look Up: zoom in → show room → reverse hinge → wall vertical at zoom scale */
  lookUp:       (zoomScale: number, zoomY: number) => Promise<void>
}

export function useHingeTransition(): HingeResult {
  const [roomScope,    animateRoom]    = useAnimate()
  const [surfaceScope, animateSurface] = useAnimate()
  const [stageScope,   animateStage]   = useAnimate()

  const [roomHidden,  setRoomHidden]  = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const lookDown = useCallback(async (zoomScale: number, zoomY: number) => {
    if (isAnimating) return
    setIsAnimating(true)

    // Phase 1: Hinge at current zoom (6.8×). Ceiling stays off-screen.
    await Promise.all([
      animateRoom(roomScope.current, { rotateX: -90 },
        { duration: HINGE_DURATION, ease: HINGE_EASE }),
      animateSurface(surfaceScope.current, { rotateX: 0 },
        { duration: HINGE_DURATION, ease: HINGE_EASE }),
    ])

    // Phase 2: Hide room to prevent ghost artifacts.
    setRoomHidden(true)

    // Phase 3: Zoom out to reveal full bar surface.
    await animateStage(stageScope.current, { scale: 1, y: 0 },
      { duration: ZOOM_REVEAL, ease: HINGE_EASE })

    setIsAnimating(false)
  }, [isAnimating, animateRoom, roomScope, animateSurface, surfaceScope, animateStage, stageScope])

  const lookUp = useCallback(async (zoomScale: number, zoomY: number) => {
    if (isAnimating) return
    setIsAnimating(true)

    // Phase 1: Zoom in to barkeep depth. Ceiling exits visible area.
    await animateStage(stageScope.current, { scale: zoomScale, y: zoomY },
      { duration: ZOOM_REVEAL, ease: HINGE_EASE })

    // Phase 2: Restore room panel.
    setRoomHidden(false)

    // Phase 3: Reverse hinge at zoom scale. Ceiling stays off-screen.
    await Promise.all([
      animateRoom(roomScope.current, { rotateX: 0 },
        { duration: HINGE_DURATION, ease: HINGE_EASE }),
      animateSurface(surfaceScope.current, { rotateX: 90 },
        { duration: HINGE_DURATION, ease: HINGE_EASE }),
    ])

    setIsAnimating(false)
  }, [isAnimating, animateRoom, roomScope, animateSurface, surfaceScope, animateStage, stageScope])

  return {
    roomScope,
    surfaceScope,
    stageScope,
    roomHidden,
    isAnimating,
    lookDown,
    lookUp,
  }
}
