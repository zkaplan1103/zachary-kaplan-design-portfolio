import { useState, useEffect } from 'react'
import { BEZEL } from '@/config/bezel'

export interface BezelBounds {
  // Position of screen area in viewport px
  left: number
  top: number
  // Dimensions of screen area in px
  width: number
  height: number
  // Right and bottom edges (convenience)
  right: number
  bottom: number
  // Center point of screen area
  centerX: number
  centerY: number
  // Transform origin string for CRT animations
  transformOrigin: string
  // Spacing system based on screen height
  space: {
    xs: number // sh * 0.01
    sm: number // sh * 0.02
    md: number // sh * 0.04
    lg: number // sh * 0.07
    xl: number // sh * 0.12
  }
}

function compute(): BezelBounds {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const left   = (BEZEL.screen.left   / 100) * vw
  const top    = (BEZEL.screen.top    / 100) * vh
  const width  = (BEZEL.screen.width  / 100) * vw
  const height = (BEZEL.screen.height / 100) * vh
  const right  = left + width
  const bottom = top + height
  const centerX = left + width / 2
  const centerY = top + height / 2

  return {
    left, top, width, height,
    right, bottom, centerX, centerY,
    transformOrigin: `${centerX}px ${centerY}px`,
    space: {
      xs: height * 0.01,
      sm: height * 0.02,
      md: height * 0.04,
      lg: height * 0.07,
      xl: height * 0.12,
    },
  }
}

export function useBezel(): BezelBounds {
  const [bounds, setBounds] = useState<BezelBounds>(() => compute())

  useEffect(() => {
    function handleResize() {
      setBounds(compute())
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return bounds
}
