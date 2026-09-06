import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Sparkles, X } from 'lucide-react'
import { useMemories } from '@/hooks/useMemories'

const starImage = '/star-sky.png'

interface Star {
  id: number
  x: number
  y: number
  size: number
  delay: number
  memoryId?: string
  note?: string
}

const presetNotes = [
  '那天夕阳很好，你笑起来的样子更好。',
  '在一起的日子，连下雨都变得浪漫。',
  '想和你一起去更多地方，看更多风景。',
  '你的存在，就是我最大的幸运。',
  '每一个平凡的日子，因为有你而闪闪发光。',
]

export default function StarrySky() {
  const navigate = useNavigate()
  const { memories } = useMemories()
  const [selected, setSelected] = useState<{ type: 'memory' | 'note'; content: string; id?: string } | null>(null)

  const stars = useMemo<Star[]>(() => {
    const list: Star[] = []
    const memoryIds = memories.map((m) => m.id)
    const total = 18

    for (let i = 0; i < total; i++) {
      const isMemory = Math.random() > 0.45 && memoryIds.length > 0
      list.push({
        id: i,
        x: Math.random() * 88 + 6,
        y: Math.random() * 70 + 15,
        size: Math.random() * 3 + 2,
        delay: Math.random() * 3,
        memoryId: isMemory ? memoryIds[Math.floor(Math.random() * memoryIds.length)] : undefined,
        note: !isMemory ? presetNotes[Math.floor(Math.random() * presetNotes.length)] : undefined,
      })
    }
    return list
  }, [memories])

  const handleClick = (star: Star) => {
    if (star.memoryId) {
      setSelected({ type: 'memory', content: '一颗星星带你飞向某段回忆…', id: star.memoryId })
      setTimeout(() => {
        navigate(`/memories/${star.memoryId}`)
      }, 1200)
    } else if (star.note) {
      setSelected({ type: 'note', content: star.note })
    }
  }

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url(${starImage}), linear-gradient(135deg, #0B0812 0%, #1a102e 50%, #2a1b3d 100%)`,
          }}
        />
        <div className="absolute inset-0 bg-abyss/40" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(255,184,208,0.12)_0%,_transparent_60%)]" />
      </div>

      {/* Minimalist stars */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8 text-center"
        >
          <h1 className="font-serif text-4xl font-semibold italic text-white md:text-5xl">
            Pick a Star
          </h1>
          <p className="mt-2 text-sm text-white/50">点击任意一颗星，随机打开一段回忆或便签</p>
        </motion.div>

        <div className="relative h-[60vh] w-full max-w-4xl">
          {stars.map((star) => (
            <motion.button
              key={star.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: star.delay * 0.15, duration: 0.6 }}
              onClick={() => handleClick(star)}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)] outline-none transition-transform hover:scale-150"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
              }}
            >
              <span className="sr-only">star</span>
            </motion.button>
          ))}

          {/* Twinkle rings */}
          {stars.slice(0, 6).map((star) => (
            <motion.div
              key={`ring-${star.id}`}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20"
              style={{ left: `${star.x}%`, top: `${star.y}%` }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2 + star.delay, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => selected.type === 'note' && setSelected(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/70 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-sm rounded-2xl border border-white/10 bg-white/10 p-6 text-center shadow-glow backdrop-blur-glass md:max-w-md"
            >
              <Sparkles className="mx-auto mb-4 h-8 w-8 text-star-pink" />
              <p className="mb-4 text-lg leading-relaxed text-white/90">{selected.content}</p>
              {selected.type === 'memory' ? (
                <p className="text-sm text-white/50">正在飞向那段回忆…</p>
              ) : (
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-full bg-white/10 px-5 py-2 text-sm text-white transition-colors hover:bg-white/20"
                >
                  <X className="mr-1 inline h-4 w-4" />
                  关闭
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
