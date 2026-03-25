import { useEffect, useRef, useState, useCallback } from 'react'
import { BEZEL } from '@/config/bezel'

interface TVStaticProps {
  onComplete: () => void
}

const BLOCK_SIZE = 4
const STATIC_DURATION = 400
const FLASH_DURATION = 80
const FADE_DURATION = 300
const FPS = 30
const FRAME_MS = 1000 / FPS

function getBezelRect() {
  const vw = window.innerWidth
  const vh = window.innerHeight
  return {
    sl: (BEZEL.screen.left / 100) * vw,
    st: (BEZEL.screen.top / 100) * vh,
    sw: (BEZEL.screen.width / 100) * vw,
    sh: (BEZEL.screen.height / 100) * vh,
  }
}

export function TVStatic({ onComplete }: TVStaticProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'static' | 'flash' | 'fade' | 'done'>('static')
  const [fadeOpacity, setFadeOpacity] = useState(1)
  const [bezel, setBezel] = useState(getBezelRect)

  // Resize handler
  useEffect(() => {
    function onResize() { setBezel(getBezelRect()) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Phase 1: Chunky static at ~30fps
  useEffect(() => {
    if (phase !== 'static') return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      const b = getBezelRect()
      canvas.width = Math.round(b.sw)
      canvas.height = Math.round(b.sh)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf = 0
    let lastFrame = 0

    function drawStatic(now: number) {
      if (!canvas || !ctx) return
      if (now - lastFrame < FRAME_MS) {
        raf = requestAnimationFrame(drawStatic)
        return
      }
      lastFrame = now

      const w = canvas.width
      const h = canvas.height
      const cols = Math.ceil(w / BLOCK_SIZE)
      const rows = Math.ceil(h / BLOCK_SIZE)

      // CRT-style static: weighted grey distribution
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const roll = Math.random()
          const v = roll < 0.10 ? 0       // 10% black
                  : roll < 0.25 ? 51      // 15% dark grey
                  : roll < 0.45 ? 102     // 20% mid grey
                  : roll < 0.70 ? 170     // 25% light grey
                  : 255                    // 30% white
          ctx.fillStyle = `rgb(${v},${v},${v})`
          ctx.fillRect(c * BLOCK_SIZE, r * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE)
        }
      }
      raf = requestAnimationFrame(drawStatic)
    }
    raf = requestAnimationFrame(drawStatic)

    const timer = setTimeout(() => setPhase('flash'), STATIC_DURATION)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(timer)
      window.removeEventListener('resize', resize)
    }
  }, [phase])

  // Phase 2: White flash
  useEffect(() => {
    if (phase !== 'flash') return
    const timer = setTimeout(() => setPhase('fade'), FLASH_DURATION)
    return () => clearTimeout(timer)
  }, [phase])

  // Phase 3: Fade out
  const onCompleteStable = useCallback(onComplete, [onComplete])
  useEffect(() => {
    if (phase !== 'fade') return
    const start = performance.now()
    let raf = 0

    function tick(now: number) {
      const elapsed = now - start
      const t = Math.min(1, elapsed / FADE_DURATION)
      setFadeOpacity(1 - t)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setPhase('done')
        onCompleteStable()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, onCompleteStable])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        left: bezel.sl,
        top: bezel.st,
        width: bezel.sw,
        height: bezel.sh,
        zIndex: 1000,
        opacity: phase === 'fade' ? fadeOpacity : 1,
        pointerEvents: 'all',
        overflow: 'hidden',
        backgroundColor: '#000000',
      }}
    >
      {phase === 'flash' ? (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }} />
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', opacity: 0.92 }}
        />
      )}
    </div>
  )
}
