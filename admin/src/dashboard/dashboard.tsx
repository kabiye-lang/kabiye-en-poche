import { Link } from 'react-router-dom'

import { BookOpen, CaretRight, CircleDashed, House, ListBullets, Table, Waveform } from '@phosphor-icons/react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRequireAdmin } from '@/hooks/use-require-admin'

const internalLinks = [
  {
    label: 'Units',
    link: '/units',
    description: 'Learning units and modules',
    icon: <BookOpen size={24} weight="duotone" />,
  },
  {
    label: 'Lessons',
    link: '/lessons',
    description: 'Edit lessons with contents and activities in one place',
    icon: <ListBullets size={24} weight="duotone" />,
  },
  {
    label: 'Audios',
    link: '/audios',
    description: 'Search, tag, and manage audio files',
    icon: <Waveform size={24} weight="duotone" />,
  },
  {
    label: 'Alphabet',
    link: '/alphabet_letters',
    description: 'Kabiyè alphabet letters',
    icon: <Table size={24} weight="duotone" />,
  },
  {
    label: 'CMS Pages',
    link: '/cms_pages',
    description: 'Static content pages',
    icon: <House size={24} weight="duotone" />,
  },
  {
    label: 'Categories',
    link: '/categories',
    description: 'Lesson categories',
    icon: <CircleDashed size={24} weight="duotone" />,
  },
  { label: 'Topics', link: '/topics', description: 'Lesson topics', icon: <CircleDashed size={24} weight="duotone" /> },
]

export const Dashboard = () => {
  const isAdmin = useRequireAdmin()

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-4 pt-4">
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Kabiyè en Poche Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {internalLinks.map((item) => (
              <Link
                className="hover:bg-accent/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
                key={item.label}
                to={item.link}
              >
                {item.icon}
                <div className="flex-1 space-y-1">
                  <p className="text-sm leading-none font-medium">{item.label}</p>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
                <CaretRight size={16} weight="bold" />
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
