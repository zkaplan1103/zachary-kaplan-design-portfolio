import { useUIStore } from '@/store/uiStore'
import monitorPng from '@/assets/images/monitor.png'

/**
 * Monitor frame PNG — sits at z-index 100 above all CRT effect layers.
 *
 * mix-blend-mode technique:
 *   dark  → lighten: screen pixels (26,28,26 ≈ black) lose to any site content,
 *           becoming invisible. Bezel pixels (238,236,233 ≈ grey) win against
 *           the dark background and remain visible.
 *   light → multiply: inverts the logic for light backgrounds where grey bezel
 *           would otherwise be washed out by the light site background.
 *
 * object-fit: fill stretches the PNG to exactly 100vw × 100vh so the bezel
 * touches all four browser edges at every viewport size — no letterbox bars.
 */
export function CRTMonitor() {
  const theme = useUIStore(s => s.theme)
  const dark  = theme === 'dark'

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      <img
        src={monitorPng}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
          mixBlendMode: dark ? 'lighten' : 'multiply',
        }}
      />
    </div>
  )
}
