import { RouterProvider } from 'react-router-dom'
import { ReactLenis } from 'lenis/react'
import { useUIStore } from '@/store/uiStore'
import { router } from '@/router'
import { CRTScreen } from '@/components/layout/CRTScreen'

export default function App() {
  const theme = useUIStore(s => s.theme)
  const dark  = theme === 'dark'

  return (
    <>
      {/* ── SVG noise filter definition (zero visual footprint) ── */}
      {/* Referenced by the grain overlay inside CRTScreen via filter:url(#crt-noise) */}
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
       * CRTScreen manages:
       *   - Monitor PNG at z:100 (object-fit:contain, covers full viewport)
       *   - Screen content wrapper at z:1 (positioned in px via ResizeObserver)
       *   - All 7 CRT effects inside the screen wrapper as absolute overlays
       *
       * ReactLenis (scoped, no root) provides smooth scroll inside the wrapper.
       */}
      <CRTScreen dark={dark}>
        <ReactLenis
          options={{ lerp: 0.08, duration: 1.2, smoothWheel: true }}
          style={{ height: '100%', overflow: 'hidden' }}
        >
          <RouterProvider router={router} />
        </ReactLenis>
      </CRTScreen>
    </>
  )
}
