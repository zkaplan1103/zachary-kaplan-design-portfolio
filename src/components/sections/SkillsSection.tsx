import { motion } from 'framer-motion'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { Badge } from '@/components/ui/Badge'
import { StaggerGroup } from '@/components/animations/StaggerGroup'
import { SlideUp } from '@/components/animations/SlideUp'
import { skills } from '@/data/skills'
import { cn } from '@/lib/utils'
import { type Skill } from '@/types'
import { slideUp } from '@/lib/variants'

const categories: { key: Skill['category']; label: string }[] = [
  { key: 'design', label: 'Design' },
  { key: 'development', label: 'Development' },
  { key: 'tools', label: 'Tools' },
]

export function SkillsSection() {
  return (
    <section id="skills" className="py-28 md:py-36 px-6 md:px-12 bg-surface">
      <div className="max-w-7xl mx-auto">
        <SectionHeading eyebrow="Skills">Tools of the trade.</SectionHeading>
        <div className="grid md:grid-cols-3 gap-12">
          {categories.map(({ key, label }) => (
            <div key={key}>
              <SlideUp>
                <h3 className="text-fg font-semibold text-sm tracking-widest uppercase mb-6">
                  {label}
                </h3>
              </SlideUp>
              <StaggerGroup className="flex flex-wrap gap-2">
                {skills
                  .filter((s) => s.category === key)
                  .map((skill) => (
                    <motion.div key={skill.name} variants={slideUp}>
                      <Badge
                        className={cn(skill.proficiency === 'primary' && 'border-accent/30 text-fg')}
                      >
                        {skill.name}
                      </Badge>
                    </motion.div>
                  ))}
              </StaggerGroup>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
