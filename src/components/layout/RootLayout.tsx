import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Header } from './Header'
import { Footer } from './Footer'

export function RootLayout() {
  const outlet = useOutlet()
  const { pathname } = useLocation()

  return (
    <div className="min-h-screen bg-bg text-fg flex flex-col">
      <Header />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <div key={pathname}>{outlet}</div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  )
}
