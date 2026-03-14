import type { Project } from '@/types'

export const projects: Project[] = [
  {
    id: '1',
    slug: 'brand-identity-system',
    title: 'Brand Identity System',
    tagline: 'Building a visual language from the ground up.',
    description:
      'A comprehensive brand identity project for a tech startup — logo, typography, color system, and component library delivered as a living style guide.',
    tags: ['Brand Design', 'Design Systems', 'Typography'],
    year: '2024',
    role: 'Lead Designer',
    thumbnail: '',
    images: [],
    featured: true,
  },
  {
    id: '2',
    slug: 'motion-design-system',
    title: 'Motion Design System',
    tagline: 'Defining how a product moves.',
    description:
      'An animation and interaction design system for a SaaS product — establishing principles, timing curves, and a library of reusable motion components.',
    tags: ['Motion Design', 'Framer Motion', 'React'],
    year: '2024',
    role: 'Frontend Designer',
    thumbnail: '',
    images: [],
    featured: true,
  },
  {
    id: '3',
    slug: 'editorial-web-experience',
    title: 'Editorial Web Experience',
    tagline: 'Where print meets digital.',
    description:
      'A long-form editorial website with scroll-driven storytelling, custom typography, and immersive full-bleed imagery.',
    tags: ['Editorial Design', 'Web Design', 'Animation'],
    year: '2023',
    role: 'Designer & Developer',
    thumbnail: '',
    images: [],
    featured: false,
  },
  {
    id: '4',
    slug: 'product-redesign',
    title: 'Product Redesign',
    tagline: 'Rethinking the core experience.',
    description:
      'End-to-end redesign of a consumer product — user research, information architecture, interaction design, and a polished high-fidelity prototype.',
    tags: ['Product Design', 'UX Research', 'Figma'],
    year: '2023',
    role: 'Product Designer',
    thumbnail: '',
    images: [],
    featured: false,
  },
]
