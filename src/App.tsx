import { RouterProvider } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import { router } from '@/router'
import { CRTMonitor } from '@/components/layout/CRTMonitor'

export default function App() {
  const theme = useUIStore(s => s.theme)
  const dark  = theme === 'dark'

  return (
    <>
      {/* ── SVG noise filter definition (zero visual footprint) ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden' }}
      >
        <defs>
          <filter id="crt-noise" x="0%" y="0%" width="100%" height="100%"
            colorInterpolationFilters="sRGB">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
              result="noise"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>
      </svg>

      {/*
       * ── Site content — normal document flow ─────────────────────────────────
       * No wrapper, no clipping, no z-index manipulation.
       * ReactLenis (root) in main.tsx scrolls the window naturally.
       * The monitor bezel (z:100) covers the viewport edges.
       */}
      <RouterProvider router={router} />

      {/*
       * ── CRT effect overlays — z-index 2–6 ───────────────────────────────────
       * All fixed 100vw×100vh, pointer-events: none.
       * The monitor PNG (z:100) covers their edges with the opaque bezel,
       * so effects are only visually active inside the screen area.
       */}

      {/* z:2 — Grain (drifting SVG noise) */}
      {/* Oversized by 30% so the drift animation never exposes an edge */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: '-15%', left: '-15%', right: '-15%', bottom: '-15%',
          zIndex: 2,
          opacity: dark ? 0.045 : 0.025,
          filter: 'url(#crt-noise)',
          background: 'white',
          willChange: 'transform',
          animation: 'crt-grain-drift 12s linear infinite',
          pointerEvents: 'none',
        }}
      />

      {/* z:3 — Scanlines */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 3,
          background: `repeating-linear-gradient(
            transparent 0px,
            transparent 2px,
            rgba(0,0,0,${dark ? '0.08' : '0.04'}) 2px,
            rgba(0,0,0,${dark ? '0.08' : '0.04'}) 4px
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* z:4 — Phosphor glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 4,
          background: dark
            ? 'radial-gradient(ellipse at center, rgba(120,255,120,0.04) 0%, transparent 70%)'
            : 'radial-gradient(ellipse at center, rgba(255,255,200,0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* z:5 — Vignette + bezel depth */}
      {/* Ellipse centered at 50% × 47% to match the screen area's visual center */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 5,
          background: `radial-gradient(
            ellipse 55% 60% at 50% 47%,
            transparent 60%,
            rgba(0,0,0,${dark ? '0.9' : '0.6'}) 100%
          )`,
          pointerEvents: 'none',
        }}
      />

      {/* z:6 — Flicker */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 6,
          animation: 'crt-flicker 4s linear infinite',
          willChange: 'opacity',
          pointerEvents: 'none',
        }}
      />

      {/* z:100 — Monitor frame PNG with mix-blend-mode */}
      <CRTMonitor />
    </>
  )
}
