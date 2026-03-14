import { SectionHeading } from '@/components/ui/SectionHeading'
import { ProjectCard } from '@/components/ui/ProjectCard'
import { projects } from '@/data/projects'

export function WorkSection() {
  return (
    <section id="work" className="py-28 md:py-36 px-6 md:px-12">
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow="Work">Selected projects.</SectionHeading>
        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
