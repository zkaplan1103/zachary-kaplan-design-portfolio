import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
// import { Header } from './Header' // REMOVED — Western Town has no nav chrome
// import { Footer } from './Footer' // REMOVED — Western Town has no footer

export function RootLayout() {
  const outlet = useOutlet()
  const { pathname } = useLocation()

  return (
    <div>
      <main>
        <AnimatePresence mode="wait">
          <div key={pathname}>{outlet}</div>
        </AnimatePresence>
      </main>
    </div>
  )
}
