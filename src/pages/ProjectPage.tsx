import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageWrapper } from '@/components/layout/PageWrapper'
import { Badge } from '@/components/ui/Badge'
import { SlideUp } from '@/components/animations/SlideUp'
import { FadeIn } from '@/components/animations/FadeIn'
import { projects } from '@/data/projects'

export function ProjectPage() {
  const { slug } = useParams<{ slug: string }>()
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    return (
      <PageWrapper>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted">Project not found.</p>
        </div>
      </PageWrapper>
    )
  }

  return (
    <PageWrapper>
      <div className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <FadeIn>
            <Link
              to="/#work"
              className="inline-flex items-center gap-2 text-muted hover:text-fg text-sm mb-12 transition-colors duration-200"
            >
              <ArrowLeft size={16} />
              All Work
            </Link>
          </FadeIn>

          {/* Header */}
          <SlideUp>
            <p className="text-accent text-sm tracking-widest uppercase mb-4">
              {project.year} · {project.role}
            </p>
          </SlideUp>
          <SlideUp delay={0.1}>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-fg leading-tight mb-4">
              {project.title}
            </h1>
          </SlideUp>
          <SlideUp delay={0.2}>
            <p className="text-muted text-xl mb-8">{project.tagline}</p>
          </SlideUp>
          <SlideUp delay={0.3}>
            <div className="flex flex-wrap gap-2 mb-16">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </SlideUp>

          {/* Thumbnail */}
          <FadeIn delay={0.2}>
            <div className="aspect-video rounded-2xl bg-surface border border-border mb-16 flex items-center justify-center text-muted">
              Project imagery coming soon
            </div>
          </FadeIn>

          {/* Description */}
          <SlideUp delay={0.1}>
            <p className="text-muted text-lg leading-relaxed">{project.description}</p>
          </SlideUp>
        </div>
      </div>
    </PageWrapper>
  )
}
