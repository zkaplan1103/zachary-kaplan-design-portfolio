import { useScroll, useTransform } from 'framer-motion'

export function useScrollProgress() {
  const { scrollYProgress } = useScroll()
  const width = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  return { scrollYProgress, width }
}
