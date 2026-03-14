import { SectionHeading } from '@/components/ui/SectionHeading'
import { FadeIn } from '@/components/animations/FadeIn'
import { SlideUp } from '@/components/animations/SlideUp'

export function AboutSection() {
  return (
    <section id="about" className="py-28 md:py-36 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Text */}
          <div>
            <SectionHeading eyebrow="About">
              Design with
              <br />
              purpose.
            </SectionHeading>
            <SlideUp delay={0.2}>
              <p className="text-muted text-lg leading-relaxed mb-6">
                I&apos;m Zachary Kaplan — a frontend designer and developer. I believe great design
                is invisible: it guides, delights, and gets out of the way.
              </p>
            </SlideUp>
            <SlideUp delay={0.3}>
              <p className="text-muted text-lg leading-relaxed">
                With a background spanning visual design, motion, and frontend engineering, I bring
                a holistic perspective to every project. I care deeply about typography, spacing,
                and the micro-interactions that make a product feel alive.
              </p>
            </SlideUp>
          </div>

          {/* Image placeholder */}
          <FadeIn delay={0.3}>
            <div className="aspect-[4/5] rounded-2xl bg-surface border border-border flex items-center justify-center text-muted text-sm">
              Photo coming soon
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
