import { Link } from 'react-router-dom'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

const navItems = [
  { label: 'Work', href: '#work' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

export function Header() {
  // ALL hooks must be unconditional — no early returns before this point
  const { theme, toggleTheme, navOpen, setNavOpen, introVisible } = useUIStore()
  const { scrollY } = useScroll()
  const headerBg = useTransform(scrollY, [0, 80], ['transparent', 'var(--bg)'])
  const headerBorderOpacity = useTransform(scrollY, [0, 80], [0, 1])

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12"
      style={{
        backgroundColor: headerBg,
        opacity: introVisible ? 0 : 1,
        pointerEvents: introVisible ? 'none' : 'auto',
        transition: introVisible ? 'none' : 'opacity 0.4s ease',
      }}
    >
      <motion.div
        className="absolute inset-x-0 bottom-0 h-px bg-border"
        style={{ opacity: headerBorderOpacity }}
      />
      <div className="max-w-7xl mx-auto h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-lg font-bold text-fg tracking-tight">
          ZK
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted hover:text-fg text-sm font-medium tracking-wide transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-muted hover:text-fg transition-colors duration-200 rounded-lg"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            className="md:hidden p-2 text-muted hover:text-fg transition-colors duration-200"
            onClick={() => setNavOpen(!navOpen)}
            aria-label="Toggle menu"
          >
            {navOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {navOpen && (
        <motion.div
          className="md:hidden border-t border-border py-6 px-2 bg-bg"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="block py-3 text-fg text-lg font-medium"
              onClick={() => setNavOpen(false)}
            >
              {item.label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  )
}
