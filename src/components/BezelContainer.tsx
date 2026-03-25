import { useMemo, type ReactNode, type CSSProperties } from 'react'
import { useBezelContext } from '@/contexts/BezelContext'

interface BezelContainerProps {
  children?: ReactNode
  zIndex?: number
  style?: CSSProperties
}

/**
 * BezelContainer — positions children exactly over the bezel screen area.
 *
 * Use for components rendered OUTSIDE CRTScreen that need to overlay the
 * bezel screen (e.g. SwarmCanvas, future overlays).
 *
 * Do NOT use for IntroAnimation or WesternTown — those live INSIDE
 * CRTScreen and are already constrained by it.
 *
 * Debug: visit any page with ?debug=bezel to see a red outline confirming
 * the container aligns with the physical monitor screen.
 */
export function BezelContainer({ children, zIndex = 10, style = {} }: BezelContainerProps) {
  const b = useBezelContext()
  const isDebug = useMemo(() => window.location.search.includes('debug=bezel'), [])

  return (
    <div
      style={{
        position: 'fixed',
        left: b.left,
        top: b.top,
        width: b.width,
        height: b.height,
        overflow: 'hidden',
        zIndex,
        ...(isDebug ? { outline: '2px solid red', outlineOffset: '-2px' } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}
