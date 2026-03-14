export interface Project {
  id: string
  slug: string
  title: string
  tagline: string
  description: string
  tags: string[]
  year: string
  role: string
  thumbnail: string
  images: string[]
  link?: string
  featured: boolean
}

export interface Skill {
  name: string
  category: 'design' | 'development' | 'tools'
  proficiency: 'primary' | 'secondary'
}

export interface NavItem {
  label: string
  href: string
}
