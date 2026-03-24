/* ═══════════════════════════════════════
   SNAKE/SWARM SYSTEM — COMMENTED OUT
   Preserved for future use
   ═══════════════════════════════════════

import { useEffect, useRef } from 'react'
import {
  initParticlesZK,
  renderParticles,
  scatterParticles,
  updateParticles,
  type Particle,
  type SwarmMode,
} from './swarmEngine'
import { ZK_HOLD_MS } from './swarmConfig'

export function SwarmCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const modeRef = useRef<SwarmMode>('ZK')
  const rafRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    const maybeCtx = canvas.getContext('2d')
    if (!maybeCtx) return
    const ctx: CanvasRenderingContext2D = maybeCtx
    ctx.imageSmoothingEnabled = false

    const { width, height } = canvas

    particlesRef.current = initParticlesZK(width, height)

    // After ZK_HOLD_MS: switch to SCATTER — particles drift away from the ZK form
    const scatterTimerId = setTimeout(() => {
      modeRef.current = 'SCATTER'
      scatterParticles(particlesRef.current, width, height)
    }, ZK_HOLD_MS)

    function tick() {
      updateParticles(particlesRef.current, modeRef.current, width, height)
      renderParticles(particlesRef.current, ctx, width, height)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafRef.current)
      clearTimeout(scatterTimerId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    />
  )
}
*/

// Placeholder export so imports don't break during western town build
export function SwarmCanvas() {
  return null
}
