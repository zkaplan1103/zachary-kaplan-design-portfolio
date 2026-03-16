/**
 * Screen cutout as percentages of PNG natural size (1225×815):
 *   left:   77  / 1225 = 6.286%
 *   top:    51  / 815  = 6.258%
 *   width:  1070 / 1225 = 87.347%
 *   height: 620  / 815  = 76.074%
 *
 * With object-fit: fill the PNG stretches to exactly 100vw × 100vh,
 * so these percentages map directly to vw/vh viewport units.
 * No ResizeObserver or JS measurement needed.
 */

import monitorPng from '@/assets/images/monitor-v2-cropped.png'

interface CRTScreenProps {
  children: React.ReactNode
  dark: boolean
}

/**
 * CRTScreen — monitor PNG frame + screen content wrapper.
 *
 * Architecture:
 *   - Monitor PNG at z:100, object-fit:fill, covers full viewport
 *   - Screen content wrapper at z:1, positioned via pure CSS viewport units
 *     that directly correspond to the screen cutout location in the stretched PNG
 *   - 6px bleed on all sides so the bezel PNG always overlaps wrapper edges
 *   - All CRT effects layered inside the screen wrapper as absolute overlays
 *
 * z-order inside screen wrapper:
 *   children (content)  →  grain (z:2)  →  scanlines (z:3)  →
 *   phosphor (z:4)      →  vignette (z:5)
 */
export function CRTScreen({ children, dark }: CRTScreenProps) {
  return (
    <>
      {/*
       * ── z:100 — Monitor frame PNG ─────────────────────────────────────────
       * object-fit: fill stretches the PNG to exactly 100vw × 100vh so the
       * bezel touches all four browser edges at every viewport size.
       */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 100,
          pointerEvents: 'none',
          overflow: 'hidden',
          margin: 0,
          padding: 0,
        }}
      >
        <img
          src={monitorPng}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'fill',
            margin: 0,
            padding: 0,
          }}
        />
      </div>

      {/*
       * z:0 — Bezel background fill.
       * Pure black so the monitor PNG's rounded corners blend seamlessly.
       */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: '-4px',
          zIndex: 0,
          backgroundColor: '#000000',
          pointerEvents: 'none',
        }}
      />

      {/*
       * ── z:1 — Screen content wrapper ──────────────────────────────────────
       * Positioned via viewport units derived from screen cutout percentages.
       * 6px bleed on all sides so the bezel PNG always covers wrapper edges.
       * padding pushes content inward to stay clear of the bezel overlap.
       */}
      <div
        style={{
          position: 'fixed',
          left: 'calc(6.286vw - 6px)',
          top: 'calc(6.258vh - 6px)',
          width: 'calc(87.347vw + 12px)',
          height: 'calc(76.074vh + 12px)',
          zIndex: 1,
          overflow: 'hidden',
          borderRadius: 8,
          padding: 'calc(6.258vh + 2px) calc(6.286vw + 2px)',
          backgroundColor: dark ? '#0d0d0d' : '#f8f7f4',
          boxShadow: dark
            ? 'none'
            : 'inset 0 0 40px 8px rgba(60,50,40,0.18)',
          transform: 'perspective(1200px)',
          animation: 'crt-flicker 4s linear infinite',
        }}
      >
        {/* Site content */}
        {children}

        {/* z:2 — Grain (drifting SVG noise) — oversized so drift never exposes edge */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
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
            position: 'absolute',
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
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            background: dark
              ? 'radial-gradient(ellipse at center, rgba(120,255,120,0.04) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at center, rgba(255,255,200,0.03) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* z:5 — Vignette */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 5,
            background: `radial-gradient(
              ellipse at center,
              transparent 50%,
              rgba(0,0,0,${dark ? '0.7' : '0.08'}) 100%
            )`,
            pointerEvents: 'none',
          }}
        />
      </div>
    </>
  )
}
