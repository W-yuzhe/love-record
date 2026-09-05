import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Plus } from 'lucide-react'
import { daysTogether } from '@/data/mock'

const navItems = [
  { to: '/', label: 'Home' },
  { to: '/memories', label: 'Experience' },
  { to: '/starry', label: 'Stars' },
]

export function NavBar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const d = daysTogether()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={[
        'fixed left-0 right-0 top-0 z-50 transition-all duration-300',
        scrolled || mobileOpen
          ? 'border-b border-glass-border bg-abyss/70 backdrop-blur-glass shadow-lg'
          : 'border-b border-transparent bg-transparent',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        {/* Left nav */}
        <div className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={[
                'rounded-full px-3 py-2 font-serif text-sm font-medium italic transition-colors md:px-4 md:text-base',
                location.pathname === item.to
                  ? 'bg-white/10 text-white'
                  : 'text-white/80 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Center days */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <Link to="/" className="group flex flex-col items-center">
            <span className="font-serif text-lg font-semibold italic text-star-gold transition-colors group-hover:text-white md:text-xl">
              {d} days of us
            </span>
          </Link>
        </div>

        {/* Right placeholder + mobile menu */}
        <div className="flex items-center gap-2">
          <Link
            to="/memories/new"
            className="hidden items-center gap-1.5 rounded-full bg-love-gradient px-4 py-2 font-serif text-sm font-medium italic text-white shadow-glow transition-transform hover:-translate-y-0.5 md:flex"
          >
            <Plus className="h-4 w-4" />
            <span>Memory</span>
          </Link>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full bg-glass transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-glass-border bg-abyss/95 px-4 py-4 backdrop-blur-glass md:hidden">
          <div className="mb-3 text-center">
            <span className="font-serif text-lg font-semibold italic text-star-gold">
              {d} days of us
            </span>
          </div>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={[
                'block rounded-lg px-3 py-3 font-serif text-base font-medium italic',
                location.pathname === item.to ? 'bg-white/10 text-white' : 'text-white/80',
              ].join(' ')}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/memories/new"
            onClick={() => setMobileOpen(false)}
            className="mt-3 flex items-center justify-center gap-1.5 rounded-full bg-love-gradient px-5 py-3 text-center font-serif text-sm font-medium italic text-white"
          >
            <Plus className="h-4 w-4" />
            <span>Memory</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
