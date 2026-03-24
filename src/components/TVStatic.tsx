import { useEffect, useRef, useState } from 'react'

interface TVStaticProps {
  onComplete: () => void
}

const BLOCK_SIZE = 4
const STATIC_DURATION = 400
const FLASH_DURATION = 80
const FADE_DURATION = 300
const FPS = 30
const FRAME_MS = 1000 / FPS

export function TVStatic({ onComplete }: TVStaticProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<'static' | 'flash' | 'fade' | 'done'>('static')
  const [fadeOpacity, setFadeOpacity] = useState(1)

  // Phase 1: Chunky static at ~30fps
  useEffect(() => {
    if (phase !== 'static') return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
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

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const v = Math.floor(Math.random() * 256)
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
        onComplete()
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase, onComplete])

  if (phase === 'done') return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        opacity: phase === 'fade' ? fadeOpacity : 1,
        pointerEvents: 'all',
      }}
    >
      {phase === 'flash' ? (
        <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }} />
      ) : phase === 'static' ? (
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      ) : (
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      )}
    </div>
  )
}
