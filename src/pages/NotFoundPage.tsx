import { Link } from 'react-router-dom'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/Button'
import { SlideUp } from '@/components/animations/SlideUp'

export function NotFoundPage() {
  return (
    <PageWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <SlideUp>
          <p className="text-accent text-sm tracking-widest uppercase mb-4">404</p>
        </SlideUp>
        <SlideUp delay={0.1}>
          <h1 className="font-display text-6xl md:text-8xl font-bold text-fg mb-4">
            Lost in space.
          </h1>
        </SlideUp>
        <SlideUp delay={0.2}>
          <p className="text-muted text-lg mb-12">This page doesn&apos;t exist.</p>
        </SlideUp>
        <SlideUp delay={0.3}>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </SlideUp>
      </div>
    </PageWrapper>
  )
}
