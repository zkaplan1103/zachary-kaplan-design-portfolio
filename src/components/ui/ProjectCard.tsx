import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { type Project } from '@/types'
import { Badge } from './Badge'
import { cn } from '@/lib/utils'
import { cardHover, slideUp } from '@/lib/variants'

interface ProjectCardProps {
  project: Project
  index?: number
  className?: string
}

export function ProjectCard({ project, index = 0, className }: ProjectCardProps) {
  return (
    <motion.div
      className={cn('group', className)}
      variants={slideUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/work/${project.slug}`} className="block">
        <motion.div
          className="relative overflow-hidden rounded-2xl bg-surface border border-border"
          variants={cardHover}
          initial="rest"
          whileHover="hover"
        >
          {/* Thumbnail */}
          <div className="aspect-video bg-neutral-900 w-full flex items-center justify-center">
            {project.thumbnail ? (
              <img
                src={project.thumbnail}
                alt={project.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-muted text-sm">{project.title}</span>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-muted text-xs tracking-wider uppercase mb-1">{project.year}</p>
                <h3 className="font-display text-xl font-semibold text-fg group-hover:text-accent transition-colors duration-200">
                  {project.title}
                </h3>
              </div>
              <ArrowUpRight
                className="text-muted group-hover:text-accent transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0 mt-1"
                size={20}
              />
            </div>
            <p className="text-muted text-sm leading-relaxed mb-4">{project.tagline}</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  )
}
