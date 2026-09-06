import { useMemo, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { siteConfig } from '@/data/mock'
import { useMemories } from '@/hooks/useMemories'
import { getMonthsBetween } from '@/utils/date'
import { getLocalMonthCover } from '@/lib/localMonthCovers'

const heroImage = '/hero-bg.png'

function getMonthCover(monthKey: string, memories: { date: string; media: { url: string }[] }[]) {
  const localCover = getLocalMonthCover(monthKey)
  if (localCover) return localCover
  const [year, month] = monthKey.split('-').map(Number)
  const found = memories.find((m) => {
    const d = new Date(m.date)
    return d.getFullYear() === year && d.getMonth() + 1 === month && m.media.length > 0
  })
  return found?.media[0]?.url
}

export default function Home() {
  const navigate = useNavigate()
  const { memories } = useMemories()

  const months = useMemo(() => {
    const list = getMonthsBetween(siteConfig.startDate)
    return list.map((m) => ({
      ...m,
      cover: getMonthCover(m.key, memories) || undefined,
    }))
  }, [memories])

  const sectionRef = useRef<HTMLElement>(null)
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    mouseX.set(clientX / innerWidth)
    mouseY.set(clientY / innerHeight)
  }

  const springConfig = { damping: 25, stiffness: 80 }
  const bgX = useSpring(useTransform(mouseX, [0, 1], [-20, 20]), springConfig)
  const bgY = useSpring(useTransform(mouseY, [0, 1], [-20, 20]), springConfig)

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-screen w-full flex-col overflow-x-hidden"
    >
      {/* Fixed hero background with mouse parallax */}
      <motion.div className="fixed inset-0 z-0" style={{ x: bgX, y: bgY, scale: 1.08 }}>
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${heroImage}), linear-gradient(135deg, #4a3b5c 0%, #2a1b3d 40%, #0B0812 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-abyss/30 via-abyss/50 to-abyss" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,184,208,0.18)_0%,_transparent_50%)]" />
      </motion.div>

      {/* Floating cloud layers */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60">
        <div className="cloud-layer cloud-pink -left-[10%] top-[10%] h-[50vh] w-[50vh] animate-cloud-drift" />
        <div className="cloud-layer cloud-violet right-[5%] top-[35%] h-[40vh] w-[40vh] animate-cloud-drift-slow" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-4 font-serif text-xs font-medium italic tracking-[0.2em] text-white/70 uppercase"
        >
          {siteConfig.name}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6 font-serif text-5xl font-light italic tracking-wide text-white md:text-7xl lg:text-8xl"
          style={{ textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}
        >
          CREATE BEYOND REALITY
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="max-w-md font-serif text-lg italic text-white/80 md:text-xl"
        >
          From <span className="text-star-pink">{siteConfig.startDate}</span>, every day is a new chapter.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-8 flex flex-wrap justify-center gap-4"
        >
          <Link
            to="/memories/new"
            className="rounded-full bg-white/10 px-6 py-3 font-serif text-sm font-medium italic text-white backdrop-blur-md transition-colors hover:bg-white/20"
          >
            + New Memory
          </Link>
          <Link
            to="/starry"
            className="rounded-full bg-love-gradient px-6 py-3 font-serif text-sm font-medium italic text-white shadow-glow transition-transform hover:-translate-y-0.5"
          >
            Pick a Star
          </Link>
        </motion.div>
      </div>

      {/* Monthly cards scroll */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.9 }}
        className="relative z-10 pb-28 pt-8 md:pb-12"
      >
        <div className="px-4 md:px-8">
          <div className="mb-4 flex items-center justify-between px-1">
            <p className="text-sm tracking-widest text-white/60 uppercase">Our Timeline</p>
            <Link to="/memories" className="flex items-center gap-1 text-sm text-white/60 hover:text-white">
              All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 md:mx-0 md:px-0">
            {months.map((month, i) => (
              <motion.button
                key={month.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.05, duration: 0.5 }}
                onClick={() => navigate(`/album/${month.key}`)}
                className="group relative h-56 w-40 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg transition-transform duration-300 hover:-translate-y-2 md:h-64 md:w-48"
              >
                {month.cover ? (
                  <img
                    src={month.cover}
                    alt={month.label}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-star-pink/20 to-violet-500/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-abyss/90 via-abyss/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-left">
                  <p className="font-serif text-3xl font-semibold italic text-white md:text-4xl">
                    {month.monthName}
                  </p>
                  <p className="text-sm text-white/60">{month.year}</p>
                </div>
                {!month.cover && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/30">
                    <span className="text-xs">No memory yet</span>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  )
}
