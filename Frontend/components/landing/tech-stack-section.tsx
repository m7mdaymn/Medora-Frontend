import {
  Box,
  Code2,
  Database,
  Gauge,
  Github,
  Layout,
  Server,
  Shield,
  Sparkles,
  Terminal,
  Workflow,
  Zap,
} from 'lucide-react'

const technologies = [
  {
    category: 'Frontend',
    icon: Layout,
    items: [
      {
        name: 'Next.js 16',
        icon: Box,
        description: 'React Framework',
        color: 'text-black dark:text-white',
      },
      { name: 'React 19', icon: Sparkles, description: 'UI Library', color: 'text-sky-500' },
      { name: 'TypeScript', icon: Code2, description: 'Type Safety', color: 'text-blue-600' },
      { name: 'Tailwind CSS', icon: Zap, description: 'Styling', color: 'text-cyan-500' },
      { name: 'shadcn/ui', icon: Layout, description: 'Components', color: 'text-foreground' },
    ],
  },
  {
    category: 'Backend',
    icon: Server,
    items: [
      { name: 'ASP.NET Core 9', icon: Server, description: 'Web API', color: 'text-purple-600' },
      { name: 'C# 13', icon: Terminal, description: 'Language', color: 'text-green-600' },
      { name: 'EF Core', icon: Database, description: 'ORM', color: 'text-orange-500' },
      { name: 'SQL Server', icon: Database, description: 'Database', color: 'text-red-600' },
      { name: 'Redis', icon: Gauge, description: 'Caching', color: 'text-red-500' },
    ],
  },
  {
    category: 'DevOps & Quality',
    icon: Workflow,
    items: [
      { name: 'Docker', icon: Box, description: 'Containerization', color: 'text-blue-500' },
      {
        name: 'GitHub Actions',
        icon: Github,
        description: 'CI/CD',
        color: 'text-gray-600 dark:text-gray-400',
      },
      { name: 'Jest', icon: Zap, description: 'Testing', color: 'text-red-400' },
      { name: 'xUnit', icon: Shield, description: '.NET Testing', color: 'text-green-600' },
    ],
  },
]

export function TechStackSection() {
  return (
    <section className='border-y bg-linear-to-b from-background to-muted/30 py-20'>
      <div className='container mx-auto'>
        {/* Header */}
        <div className='mx-auto max-w-3xl text-center'>
          <div className='mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary'>
            <Zap className='h-4 w-4' />
            Modern Tech Stack
          </div>
          <h2 className='text-3xl font-bold tracking-tight sm:text-4xl'>مبني على أحدث التقنيات</h2>
          <p className='mt-4 text-muted-foreground'>
            نستخدم أقوى الأدوات في السوق لضمان أداء عالي، أمان، وتجربة مستخدم استثنائية
          </p>
        </div>

        {/* Tech Grid */}
        <div className='mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          {technologies.map((category) => {
            const CategoryIcon = category.icon
            return (
              <div
                key={category.category}
                className='group relative overflow-hidden rounded-2xl border bg-card p-6 transition-all hover:shadow-lg'
              >
                {/* Background Decoration */}
                <div className='absolute inset-0 -z-10 bg-linear-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100' />

                {/* Category Header */}
                <div className='mb-6 flex items-center gap-3'>
                  <div className='rounded-lg bg-primary/10 p-2 text-primary'>
                    <CategoryIcon className='h-5 w-5' />
                  </div>
                  <h3 className='text-xl font-semibold'>{category.category}</h3>
                </div>

                {/* Tech Items */}
                <div className='space-y-3'>
                  {category.items.map((tech) => {
                    const Icon = tech.icon
                    return (
                      <div
                        key={tech.name}
                        className='flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50'
                      >
                        <div className={`rounded-lg bg-primary/10 p-2 ${tech.color}`}>
                          <Icon className='h-4 w-4' />
                        </div>
                        <div className='flex flex-1 items-center justify-between'>
                          <span className='font-medium'>{tech.name}</span>
                          <span className='text-xs text-muted-foreground'>{tech.description}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {/* Architecture Tags */}
        <div className='mt-12 text-center'>
          <div className='mt-6 flex flex-wrap items-center justify-center gap-2'>
            {[
              { name: 'Multi-tenancy', icon: Workflow },
              { name: 'JWT Auth', icon: Shield },
              { name: 'RBAC', icon: Gauge },
              { name: 'CQRS', icon: Workflow },
              { name: 'SignalR', icon: Zap },
              { name: 'Event-Driven', icon: Sparkles },
            ].map((tag) => {
              const TagIcon = tag.icon
              return (
                <span
                  key={tag.name}
                  className='inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground'
                >
                  <TagIcon className='h-3 w-3' />
                  {tag.name}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
