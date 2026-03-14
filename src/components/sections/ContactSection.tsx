import { Mail, ArrowUpRight } from 'lucide-react'
import { MagneticButton } from '@/components/animations/MagneticButton'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'

export function ContactSection() {
  return (
    <section id="contact" className="py-28 md:py-36 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="border border-border rounded-3xl p-12 md:p-20 text-center">
          <FadeIn>
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-6">
              Let&apos;s Work Together
            </p>
          </FadeIn>
          <SlideUp delay={0.1}>
            <h2 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold text-fg mb-6 leading-tight">
              Have a project
              <br />
              in mind?
            </h2>
          </SlideUp>
          <SlideUp delay={0.2}>
            <p className="text-muted text-lg max-w-md mx-auto mb-12">
              I&apos;m currently available for freelance projects and full-time opportunities.
              Let&apos;s build something great.
            </p>
          </SlideUp>
          <SlideUp delay={0.3}>
            <MagneticButton className="inline-block">
              <a
                href="mailto:hello@zacharykaplan.com"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-accent text-[#0d0d0d] font-semibold hover:opacity-90 transition-opacity text-lg leading-none"
              >
                <Mail size={18} />
                Say Hello
                <ArrowUpRight size={18} />
              </a>
            </MagneticButton>
          </SlideUp>
        </div>
      </div>
    </section>
  )
}
