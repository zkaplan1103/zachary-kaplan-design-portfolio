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
