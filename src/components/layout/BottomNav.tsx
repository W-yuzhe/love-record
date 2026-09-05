import { Link, useLocation } from 'react-router-dom'
import { Home, BookHeart, Sparkles, Plus } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/memories', label: 'Experience', icon: BookHeart },
  { to: '/starry', label: 'Stars', icon: Sparkles },
]

export function BottomNav() {
  const location = useLocation()

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-glass-border bg-abyss/80 backdrop-blur-glass md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 pb-safe">
          {tabs.map((tab) => {
            const active = location.pathname === tab.to
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={[
                  'flex flex-1 flex-col items-center justify-center py-2 text-xs transition-colors',
                  active ? 'text-star-pink' : 'text-white/50 hover:text-white/80',
                ].join(' ')}
              >
                <tab.icon className={['mb-1 h-5 w-5', active && 'fill-star-pink/20'].join(' ')} />
                <span className="font-serif italic">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Floating add button on mobile */}
      <Link
        to="/memories/new"
        className="fixed bottom-20 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-love-gradient text-white shadow-glow transition-transform hover:scale-110 md:hidden"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </>
  )
}
