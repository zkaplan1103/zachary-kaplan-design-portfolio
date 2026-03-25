import { createContext, useContext, type ReactNode } from 'react'
import { useBezel, type BezelBounds } from '@/hooks/useBezel'

const BezelContext = createContext<BezelBounds | null>(null)

export function BezelProvider({ children }: { children: ReactNode }) {
  const bounds = useBezel()
  return <BezelContext.Provider value={bounds}>{children}</BezelContext.Provider>
}

export function useBezelContext(): BezelBounds {
  const ctx = useContext(BezelContext)
  if (!ctx) throw new Error('useBezelContext must be used inside BezelProvider')
  return ctx
}
