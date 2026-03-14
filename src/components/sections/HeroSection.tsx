import { motion } from 'framer-motion'
import { ArrowDown } from 'lucide-react'
import { useLenis } from 'lenis/react'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { Button } from '@/components/ui/Button'
import { slideUp, staggerContainer } from '@/lib/variants'

export function HeroSection() {
  const lenis = useLenis()

  function scrollTo(id: string) {
    lenis?.scrollTo(`#${id}`, { offset: -64 })
  }

  return (
    <section className="relative min-h-screen flex flex-col justify-center px-6 md:px-12 pt-16">
      <div className="max-w-7xl mx-auto w-full">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="max-w-4xl"
        >
          {/* Eyebrow */}
          <motion.p
            variants={slideUp}
            className="text-accent text-sm font-medium tracking-widest uppercase mb-6 font-sans"
          >
            Frontend Designer & Developer
          </motion.p>

          {/* Headline */}
          <motion.h1
            variants={slideUp}
            className="font-display text-6xl md:text-8xl lg:text-[7rem] font-bold text-fg leading-[0.95] tracking-tight mb-8"
          >
            Designing with
            <br />
            <span className="text-accent">intention.</span>
          </motion.h1>

          {/* Subtext */}
          <motion.p
            variants={slideUp}
            className="text-muted text-lg md:text-xl max-w-lg leading-relaxed mb-12"
          >
            I craft thoughtful digital experiences at the intersection of design and engineering —
            with care for every pixel and interaction.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={slideUp} className="flex flex-wrap gap-4">
            <MagneticButton>
              <Button size="lg" onClick={() => scrollTo('work')}>
                View Work
              </Button>
            </MagneticButton>
            <MagneticButton>
              <Button size="lg" variant="secondary" onClick={() => scrollTo('contact')}>
                Get in Touch
              </Button>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.6 }}
      >
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
