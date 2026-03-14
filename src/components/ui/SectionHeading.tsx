import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { SlideUp } from '@/components/animations/SlideUp'

interface SectionHeadingProps {
  eyebrow?: string
  children: ReactNode
  className?: string
  align?: 'left' | 'center'
}

export function SectionHeading({
  eyebrow,
  children,
  className,
  align = 'left',
}: SectionHeadingProps) {
  return (
    <div className={cn('mb-16', align === 'center' && 'text-center', className)}>
      {eyebrow && (
        <SlideUp delay={0}>
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-4 font-sans">
            {eyebrow}
          </p>
        </SlideUp>
      )}
      <SlideUp delay={0.1}>
        <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-fg leading-tight">
          {children}
        </h2>
      </SlideUp>
    </div>
  )
}
