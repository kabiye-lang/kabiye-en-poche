import { Link, matchPath, useLocation } from 'react-router-dom'

import { cn } from '@/lib/utils'

import UserNav from './user-nav'

const navItems = [
  { label: 'Units', link: 'units' },
  { label: 'Lessons', link: 'lessons' },
  { label: 'Audios', link: 'audios' },
  { label: 'Alphabet', link: 'alphabet_letters' },
  { label: 'CMS Pages', link: 'cms_pages' },
  { label: 'Categories', link: 'categories' },
  { label: 'Topics', link: 'topics' },
]

const Header = () => {
  const location = useLocation()

  const currentPath = navItems.find((item) => matchPath(`/${item.link}/*`, location.pathname))?.link ?? '/'

  return (
    <div className="bg-opacity-90 fixed top-0 right-0 left-0 z-50 bg-white py-2 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <nav className="flex items-center gap-6">
          <Link to="/" className="text-foreground hover:text-foreground/80 font-semibold transition-colors">
            Kabiyè Admin
          </Link>
          <div className="flex gap-1">
            {navItems.map((item) => (
              <Link
                key={item.link}
                to={`/${item.link}`}
                className={cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  currentPath === item.link
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <UserNav />
      </div>
    </div>
  )
}

export default Header
