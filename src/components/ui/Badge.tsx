import { cn } from '@/lib/utils'

interface BadgeProps {
  children: string
  className?: string
}

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium tracking-wide',
        'border border-border text-muted bg-surface',
        className
      )}
    >
      {children}
    </span>
  )
}
