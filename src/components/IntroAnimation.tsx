import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

// ─── Constants ────────────────────────────────────────────────────────────────

const CHARS = '0123456789!@#$%^&*()_-+=[]{}|;:,./<>?~`\'"\\abcdefghijklmnopqrstuvwxyz'
const PARTICLE_COUNT = 3000
const REPULSION_RADIUS = 120
const REPULSION_STRENGTH = 5.5
const GRAVITY = 0.3
const CELL_SIZE = 26           // reduced from 36 — smaller cells, more fill density
const ZK_ROWS = 18
const ZK_COLS = 30    // Z (14) + gap (2) + K (14)
const ZK_TOTAL_W = (ZK_COLS - 1) * CELL_SIZE // 29 × 26 = 754px
const ZK_TOTAL_H = (ZK_ROWS - 1) * CELL_SIZE // 17 × 26 = 442px
const BAND_WIDTH = 300
const BAND_ACTIVATION_MS = 90   // was 180, ×0.5 for faster formation
const CLUSTER_FIRE_MS = 6       // was 13, ×0.5 for faster formation
const PULL_MAX_DIST = 800
const PULL_LERP_MIN = 0.02
const PULL_LERP_MAX = 0.15
const SETTLE_RADIUS = 3
const MAX_WOBBLE_RAD = 0.4
const WOBBLE_FALLOFF_DIST = 150
const REVERT_MAX_DIST = 600

// Z pixel art: 18 rows × 14 cols
// Top bar: rows 0-4, all cols. Bottom bar: rows 13-17, all cols.
// Diagonal: 4-cell wide, top-right → bottom-left, rows 5-12.
const Z_GRID: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 0  — top bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 1  — top bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 2  — top bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 3  — top bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 4  — top bar
  [0,0,0,0,0,0,0,0,1,1,1,1,0,0], // Row 5  — diag cols 8-11
  [0,0,0,0,0,0,0,1,1,1,1,0,0,0], // Row 6  — diag cols 7-10
  [0,0,0,0,0,0,1,1,1,1,0,0,0,0], // Row 7  — diag cols 6-9
  [0,0,0,0,0,1,1,1,1,0,0,0,0,0], // Row 8  — diag cols 5-8
  [0,0,0,0,1,1,1,1,0,0,0,0,0,0], // Row 9  — diag cols 4-7
  [0,0,0,1,1,1,1,0,0,0,0,0,0,0], // Row 10 — diag cols 3-6
  [0,0,1,1,1,1,0,0,0,0,0,0,0,0], // Row 11 — diag cols 2-5
  [0,1,1,1,1,0,0,0,0,0,0,0,0,0], // Row 12 — diag cols 1-4
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 13 — bottom bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 14 — bottom bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 15 — bottom bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 16 — bottom bar
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Row 17 — bottom bar
]

// K pixel art: 18 rows × 14 cols
// Stem: cols 0-4, all rows (5 wide).
// Upper arm: rows 0-8, diagonal cols 10-13 (top) → cols 5-8 (V-notch rows 6-11), 4-cell wide.
// Lower arm: rows 9-17, mirror from cols 5-8 (V-notch) → cols 10-13 (bottom), 4-cell wide.
const K_GRID: number[][] = [
  [1,1,1,1,1, 0,0,0,0,0, 1,1,1,1], // Row 0  — stem | upper arm cols 10-13
  [1,1,1,1,1, 0,0,0,0, 1,1,1,1,0], // Row 1  — stem | upper arm cols 9-12
  [1,1,1,1,1, 0,0,0, 1,1,1,1,0,0], // Row 2  — stem | upper arm cols 8-11
  [1,1,1,1,1, 0,0, 1,1,1,1,0,0,0], // Row 3  — stem | upper arm cols 7-10
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 4  — stem | upper arm cols 6-9
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 5  — stem | upper arm cols 6-9
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 6  — stem | upper arm cols 5-8 (V-notch start)
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 7  — stem | V-notch cols 5-8
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 8  — stem | V-notch cols 5-8
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 9  — stem | V-notch cols 5-8
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 10 — stem | V-notch cols 5-8
  [1,1,1,1,1, 1,1,1,1,0,0,0,0,0],  // Row 11 — stem | lower arm cols 5-8 (V-notch end)
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 12 — stem | lower arm cols 6-9
  [1,1,1,1,1, 0, 1,1,1,1,0,0,0,0], // Row 13 — stem | lower arm cols 6-9
  [1,1,1,1,1, 0,0, 1,1,1,1,0,0,0], // Row 14 — stem | lower arm cols 7-10
  [1,1,1,1,1, 0,0,0, 1,1,1,1,0,0], // Row 15 — stem | lower arm cols 8-11
  [1,1,1,1,1, 0,0,0,0, 1,1,1,1,0], // Row 16 — stem | lower arm cols 9-12
  [1,1,1,1,1, 0,0,0,0,0, 1,1,1,1], // Row 17 — stem | lower arm cols 10-13
]

// Combined: Z | 2-col gap | K  →  30 cols total
const ZK_GRID: number[][] = Z_GRID.map((zRow, r) => [...zRow, 0, 0, ...K_GRID[r]])

// ─── Types ────────────────────────────────────────────────────────────────────

type Phase = 'idle' | 'forming' | 'reverting' | 'exploding' | 'typing' | 'outro'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  char: string
  opacity: number
  flickerSpeed: number
  flickerOffset: number
  isZK: boolean
  activationTime: number  // ms from formingStart when particle begins pulling in
  settled: boolean        // locked to ZK target (or landed on floor in explosion)
  evicted: boolean        // true when a later particle claimed this particle's cell
  cellIdx: number         // index into cells[] array — which cell this particle targets
  revertStartTime: number
  homeX: number
  homeY: number
  zkOffX: number          // cursor-relative target offset (exact cell center, no stack jitter)
  zkOffY: number
  targetX: number
  targetY: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IntroAnimation() {
  const setIntroComplete = useUIStore((s) => s.setIntroComplete)
  const setIntroVisible = useUIStore((s) => s.setIntroVisible)
  const theme = useUIStore((s) => s.theme)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const phaseRef = useRef<Phase>('idle')
  const mouseRef = useRef({ x: -500, y: -500 })
  const rafRef = useRef<number>(0)
  const formingStartRef = useRef<number>(0)
  const glitchRef = useRef<{ active: boolean; offsetX: number }>({ active: false, offsetX: 0 })
  const themeRef = useRef(theme)
  const settledCountRef = useRef<number>(0)
  const formationCompleteRef = useRef<boolean>(false)
  // One slot per filled ZK cell — tracks the current visible occupant
  const cellOccupantRef = useRef<(Particle | null)[]>([])

  const [showTyping, setShowTyping] = useState(false)
  const [typedText, setTypedText] = useState('')
  const [showBlink, setShowBlink] = useState(true)
  const [exitPhase, setExitPhase] = useState(false)

  useEffect(() => {
    themeRef.current = theme
  }, [theme])

  // ── Particle init ──────────────────────────────────────────────────────────

  function initParticles(w: number, h: number) {
    const ps: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const x = Math.random() * w
      const y = Math.random() * h
      ps.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        char: CHARS[Math.floor(Math.random() * CHARS.length)],
        opacity: 0.5,
        flickerSpeed: 0.001 + Math.random() * 0.003,
        flickerOffset: Math.random() * Math.PI * 2,
        isZK: false,
        activationTime: 0,
        settled: false,
        evicted: false,
        cellIdx: 0,
        revertStartTime: 0,
        homeX: x,
        homeY: y,
        zkOffX: 0,
        zkOffY: 0,
        targetX: 0,
        targetY: 0,
      })
    }
    particlesRef.current = ps
  }

  // ── ZK assignment ──────────────────────────────────────────────────────────

  function assignZK(cx: number, cy: number) {
    const particles = particlesRef.current
    settledCountRef.current = 0
    formationCompleteRef.current = false

    // Build ordered list of filled cell offsets from cursor center
    const cells: { offX: number; offY: number }[] = []
    for (let r = 0; r < ZK_ROWS; r++) {
      for (let c = 0; c < ZK_COLS; c++) {
        if (ZK_GRID[r][c] === 1) {
          cells.push({
            offX: c * CELL_SIZE - ZK_TOTAL_W / 2,
            offY: r * CELL_SIZE - ZK_TOTAL_H / 2,
          })
        }
      }
    }

    // Reset cell occupancy array — one slot per cell, starts empty
    cellOccupantRef.current = new Array(cells.length).fill(null)

    // Assign every particle to a cell via round-robin.
    // Each cell gets ~5 particles cycling through it — one visible at a time via eviction.
    // No stack offset: all particles target the exact cell center (clean, no visual clutter).
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]
      const cell = cells[i % cells.length]
      p.isZK = true
      p.settled = false
      p.evicted = false
      p.cellIdx = i % cells.length
      p.activationTime = 0
      p.revertStartTime = 0
      p.vx = 0
      p.vy = 0
      p.zkOffX = cell.offX   // exact cell center — no random stack jitter
      p.zkOffY = cell.offY
      p.targetX = cx + p.zkOffX
      p.targetY = cy + p.zkOffY
    }

    // Cluster-based activation: ripple outward band by band.
    // Within each band, particles are shuffled so clusters fire from random positions.
    const bandGroups = new Map<number, Particle[]>()
    for (const p of particles) {
      const dist = Math.hypot(p.x - cx, p.y - cy)
      const band = Math.floor(dist / BAND_WIDTH)
      if (!bandGroups.has(band)) bandGroups.set(band, [])
      bandGroups.get(band)!.push(p)
    }

    for (const [band, ps] of bandGroups) {
      const bandStart = band * BAND_ACTIVATION_MS
      for (let i = ps.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[ps[i], ps[j]] = [ps[j], ps[i]]
      }
      let clusterTime = bandStart
      let i = 0
      while (i < ps.length) {
        const clusterSize = 4 + Math.floor(Math.random() * 5)
        const end = Math.min(i + clusterSize, ps.length)
        for (let j = i; j < end; j++) {
          ps[j].activationTime = clusterTime + Math.random() * 10
        }
        clusterTime += CLUSTER_FIRE_MS
        i = end
      }
    }
  }

  // ── Glitch sequence ────────────────────────────────────────────────────────

  function runGlitch(onComplete: () => void) {
    const flashes = [
      { dur: 60, gap: 45, ox: 4 + Math.floor(Math.random() * 5) },
      { dur: 75, gap: 50, ox: 5 + Math.floor(Math.random() * 4) },
      { dur: 50, gap: 35, ox: 4 + Math.floor(Math.random() * 5) },
      { dur: 65, gap: 0,  ox: 6 + Math.floor(Math.random() * 3) },
    ]
    let t = 0
    for (const f of flashes) {
      const startT = t
      const { ox } = f
      setTimeout(() => { glitchRef.current = { active: true, offsetX: ox } }, startT)
      t += f.dur
      const endT = t
      setTimeout(() => { glitchRef.current = { active: false, offsetX: 0 } }, endT)
      t += f.gap
    }
    setTimeout(onComplete, t)
  }

  // ── RAF loop ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize() {
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    initParticles(canvas.width, canvas.height)

    const ctx = canvas.getContext('2d')!

    function loop() {
      if (!canvas) return
      const w = canvas.width
      const h = canvas.height
      const phase = phaseRef.current
      const mouse = mouseRef.current
      const particles = particlesRef.current
      const floorY = h
      const now = Date.now()

      const isDark = themeRef.current === 'dark'
      const bgColor = isDark ? '#000000' : '#ffffff'
      const particleColor = isDark ? '#ffffff' : '#000000'

      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, w, h)
      ctx.font = '14px "Courier New", monospace'

      // ZK targets follow cursor every frame during forming
      if (phase === 'forming') {
        for (const p of particles) {
          p.targetX = mouse.x + p.zkOffX
          p.targetY = mouse.y + p.zkOffY
        }
      }

      const formingElapsed = phase === 'forming' ? now - formingStartRef.current : 0
      const isGlitching = glitchRef.current.active
      const glitchOffX = glitchRef.current.offsetX

      for (const p of particles) {
        // ── Physics ──

        if (phase === 'idle') {
          // Gentle drift toward home — organic speed matches post-release scatter drift
          p.x += (p.homeX - p.x) * 0.025
          p.y += (p.homeY - p.y) * 0.025

          const dx = p.x - mouse.x
          const dy = p.y - mouse.y
          const dist = Math.hypot(dx, dy)
          if (dist > 0 && dist < REPULSION_RADIUS) {
            const force = (1 - dist / REPULSION_RADIUS) * REPULSION_STRENGTH
            p.x += (dx / dist) * force
            p.y += (dy / dist) * force
          }

          p.opacity = 0.3 + 0.7 * Math.sin(now * p.flickerSpeed + p.flickerOffset)
        } else if (phase === 'forming') {
          if (formingElapsed < p.activationTime) {
            // Not yet activated — breathe at scatter position
            p.opacity = 0.3 + 0.7 * Math.sin(now * p.flickerSpeed + p.flickerOffset)
          } else if (p.settled) {
            if (p.evicted) {
              // Evicted — fade out, stay put
              p.opacity *= 0.88
            } else {
              // Current cell occupant — smoothly follow cursor-relative target
              p.x += (p.targetX - p.x) * PULL_LERP_MAX
              p.y += (p.targetY - p.y) * PULL_LERP_MAX
              p.opacity += (1.0 - p.opacity) * 0.1
            }
          } else {
            // Active: gravitational pull with angular turbulence
            const dx = p.targetX - p.x
            const dy = p.targetY - p.y
            const dist = Math.hypot(dx, dy)

            if (dist < SETTLE_RADIUS) {
              // Arrive and claim cell — evict any prior occupant
              const occ = cellOccupantRef.current
              if (occ[p.cellIdx] && occ[p.cellIdx] !== p) {
                occ[p.cellIdx]!.evicted = true
              }
              occ[p.cellIdx] = p
              p.settled = true
              p.x = p.targetX
              p.y = p.targetY
              settledCountRef.current++
              if (settledCountRef.current >= PARTICLE_COUNT && !formationCompleteRef.current) {
                formationCompleteRef.current = true
              }
            } else {
              // Adaptive lerp: easeInQuad — slow far, fast close
              const t = Math.max(0, 1 - dist / PULL_MAX_DIST)
              const lerpFactor = PULL_LERP_MIN + (PULL_LERP_MAX - PULL_LERP_MIN) * t * t

              // Angular turbulence: reduces to zero near target
              const wobbleMag = MAX_WOBBLE_RAD * Math.min(1, dist / WOBBLE_FALLOFF_DIST)
              const wobbleSign = p.flickerOffset > Math.PI ? 1 : -1
              const wobble =
                Math.sin(now * 0.003 + p.flickerOffset) * wobbleMag * wobbleSign
              const cosW = Math.cos(wobble)
              const sinW = Math.sin(wobble)
              const wdx = dx * cosW - dy * sinW
              const wdy = dx * sinW + dy * cosW

              p.x += wdx * lerpFactor
              p.y += wdy * lerpFactor
              p.opacity = 0.4 + 0.6 * Math.sin(now * p.flickerSpeed + p.flickerOffset)
            }
          }
        } else if (phase === 'reverting') {
          // Kept for completeness — not entered in current flow (revert goes idle directly)
          p.vx *= 0.88
          p.vy *= 0.88
          p.x += p.vx
          p.y += p.vy
          if (now >= p.revertStartTime) {
            const dx = p.homeX - p.x
            const dy = p.homeY - p.y
            const dist = Math.hypot(dx, dy)
            const t = Math.min(1, dist / REVERT_MAX_DIST)
            const lerpFactor = PULL_LERP_MIN + (PULL_LERP_MAX - PULL_LERP_MIN) * t
            p.x += dx * lerpFactor
            p.y += dy * lerpFactor
          }
          p.opacity += (0.5 - p.opacity) * 0.04
        } else if (phase === 'exploding' || phase === 'typing') {
          if (!p.settled) {
            p.vy += GRAVITY
            if (p.y >= floorY && p.vy > 0) {
              p.vy *= -0.40
              p.y = floorY
              p.vx *= 0.78
              if (Math.abs(p.vy) < 0.9) {
                p.vy = 0
                p.settled = true
              }
            }
            p.x += p.vx
            p.y += p.vy
            p.vx *= 0.996
          }
          const targetOp = p.isZK ? (p.settled ? 0.22 : 0.88) : (p.settled ? 0.04 : 0.07)
          p.opacity += (targetOp - p.opacity) * 0.05
        } else if (phase === 'outro') {
          if (!p.settled) {
            p.vy += GRAVITY * 0.4
            if (p.y >= floorY && p.vy > 0) {
              p.vy = 0
              p.vx *= 0.6
              p.settled = true
              p.y = floorY
            }
            p.x += p.vx
            p.y += p.vy
          }
          p.opacity *= 0.96
        }

        // ── Draw ──
        // Skip evicted particles once fully transparent
        if (p.evicted && p.opacity < 0.01) continue

        ctx.globalAlpha = Math.max(0, Math.min(1, p.opacity))
        if (isGlitching) {
          ctx.fillStyle = 'rgba(255,0,0,0.85)'
          ctx.fillText(p.char, p.x - glitchOffX, p.y)
          ctx.fillStyle = 'rgba(0,255,255,0.85)'
          ctx.fillText(p.char, p.x + glitchOffX, p.y)
        }
        ctx.fillStyle = particleColor
        ctx.fillText(p.char, p.x, p.y)
      }

      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Event handlers ─────────────────────────────────────────────────────────

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      const sx = window.scrollX
      const sy = window.scrollY
      mouseRef.current = { x: e.clientX + sx, y: e.clientY + sy }
      if (labelRef.current && phaseRef.current === 'idle') {
        labelRef.current.style.transform = `translate(${e.clientX + sx + 16}px, ${e.clientY + sy - 8}px)`
        labelRef.current.style.opacity = '1'
      }
    }

    function onMouseDown(e: MouseEvent) {
      if (phaseRef.current !== 'idle') return
      if (labelRef.current) {
        labelRef.current.style.transition = 'opacity 0.08s'
        labelRef.current.style.opacity = '0'
      }
      assignZK(e.clientX + window.scrollX, e.clientY + window.scrollY)
      formingStartRef.current = Date.now()
      phaseRef.current = 'forming'
    }

    function onMouseUp() {
      if (phaseRef.current !== 'forming') return

      const mx = mouseRef.current.x
      const my = mouseRef.current.y

      if (formationCompleteRef.current) {
        // All particles settled — full explosion
        for (const p of particlesRef.current) {
          const angle = Math.atan2(p.y - my, p.x - mx)
          const speed = 9 + Math.random() * 13
          p.vx = Math.cos(angle) * speed + (Math.random() - 0.5) * 5
          p.vy = Math.sin(angle) * speed - (1.5 + Math.random() * 7)
          p.settled = false
        }
        phaseRef.current = 'exploding'
        setTimeout(() => {
          phaseRef.current = 'typing'
          setShowTyping(true)
        }, 1000)
        return
      }

      // Revert: assign each particle a completely new random home on screen.
      // Particles drift from wherever they currently are to their new home — no snap.
      // The idle lerp (0.025) handles all movement; no separate reverting phase needed.
      const cw = canvasRef.current?.width ?? window.innerWidth
      const ch = canvasRef.current?.height ?? window.innerHeight

      for (const p of particlesRef.current) {
        p.homeX = Math.random() * cw
        p.homeY = Math.random() * ch
        p.isZK = false
        p.settled = false
        p.evicted = false
        p.vx = 0
        p.vy = 0
      }

      settledCountRef.current = 0
      formationCompleteRef.current = false
      cellOccupantRef.current = []

      if (labelRef.current) labelRef.current.style.transition = 'opacity 0.4s'
      phaseRef.current = 'idle'
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Typing sequence ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const fullText = 'zachary kaplan'
    let i = 0
    const typeInterval = setInterval(() => {
      i++
      setTypedText(fullText.slice(0, i))
      if (i >= fullText.length) {
        clearInterval(typeInterval)
        setTimeout(() => {
          phaseRef.current = 'outro'
          runGlitch(() => setExitPhase(true))
        }, 800)
      }
    }, 78)
    return () => clearInterval(typeInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTyping])

  // ── Blinking cursor ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!showTyping) return
    const blinkInterval = setInterval(() => setShowBlink((prev) => !prev), 530)
    return () => clearInterval(blinkInterval)
  }, [showTyping])

  // ─── Derived colors for DOM overlays ──────────────────────────────────────

  const particleColor = theme === 'dark' ? '#ffffff' : '#000000'
  const labelColor = theme === 'dark' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'

  // ─── CRT power-off variants ────────────────────────────────────────────────

  const powerOffVariants = {
    normal: {
      scaleY: 1,
      scaleX: 1,
      opacity: 1,
      filter: 'brightness(1) hue-rotate(0deg)',
    },
    off: {
      // Phase 1 (0→200ms): instant vertical collapse → thin phosphor line
      // Phase 2 (200→300ms): line holds, phosphor overdriven + green tint
      // Phase 3 (300→450ms): horizontal shrink to dot, intense white glow
      // Phase 4 (450→550ms): dot cuts to black
      scaleY: [1,     0.015, 0.015, 0.015, 0   ],
      scaleX: [1,     1,     1,     0.04,  0   ],
      opacity: [1,    1,     1,     1,     0   ],
      filter: [
        'brightness(1) hue-rotate(0deg)',
        'brightness(3) hue-rotate(20deg)',
        'brightness(2) hue-rotate(15deg)',
        'brightness(5) hue-rotate(0deg)',
        'brightness(0) hue-rotate(0deg)',
      ],
      transition: {
        duration: 0.55,
        times: [0, 0.36, 0.55, 0.82, 1.0],
        ease: 'linear' as const,
      },
    },
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <motion.section
      className={`relative w-full h-screen overflow-hidden select-none ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}
      style={{ cursor: 'pointer', transformOrigin: '50% 38.04%' }}
      variants={powerOffVariants}
      animate={exitPhase ? 'off' : 'normal'}
      onAnimationComplete={() => {
        if (exitPhase) {
          setIntroComplete(true)
          setIntroVisible(false)
        }
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* "click and hold" label */}
      <div
        ref={labelRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          transform: 'translate(-500px,-500px)',
          opacity: 0,
          transition: 'opacity 0.4s',
          willChange: 'transform, opacity',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: '11px',
          color: labelColor,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        click and hold
      </div>

      {/* Terminal typeout */}
      {showTyping && (
        <div className="absolute inset-x-0 flex justify-center pointer-events-none" style={{ top: '38%' }}>
          <div
            style={{
              fontFamily: '"IBM Plex Mono", monospace',
              fontSize: '15px',
              color: particleColor,
              letterSpacing: '0.06em',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span>{typedText}</span>
            <span
              style={{
                display: 'inline-block',
                width: '9px',
                height: '17px',
                backgroundColor: particleColor,
                opacity: showBlink ? 1 : 0,
                marginLeft: '2px',
                verticalAlign: 'middle',
                flexShrink: 0,
              }}
            />
          </div>
        </div>
      )}
    </motion.section>
  )
}
