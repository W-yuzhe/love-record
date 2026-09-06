import { useEffect, useState } from 'react'
import { Music, X, Disc3 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const STORAGE_KEY = 'music-player-open'
const NETEASE_PLAYLIST_ID = import.meta.env.VITE_NETEASE_PLAYLIST_ID || ''

export function FloatingMusicPlayer() {
  const [isOpen, setIsOpen] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved !== null) {
        setIsOpen(saved === 'true')
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(isOpen))
    } catch {
      // ignore
    }
  }, [isOpen])

  const iframeSrc = NETEASE_PLAYLIST_ID
    ? `https://music.163.com/outchain/player?type=0&id=${NETEASE_PLAYLIST_ID}&auto=1&height=430`
    : ''

  if (!NETEASE_PLAYLIST_ID) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 md:bottom-8 md:right-8">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.25 }}
            className="mb-2 w-[340px] overflow-hidden rounded-2xl border border-white/10 bg-[#151025]/95 p-4 shadow-2xl backdrop-blur-glass"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Disc3 className="h-4 w-4 text-star-pink" />
                <span className="font-serif text-sm font-medium italic text-white">Our Playlist</span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/40">
              {!isLoaded && (
                <div className="flex h-[430px] w-full items-center justify-center text-xs text-white/40">
                  <Disc3 className="mr-2 h-4 w-4 animate-spin" />
                  加载播放器…
                </div>
              )}
              <iframe
                title="网易云音乐"
                src={iframeSrc}
                width="100%"
                height="430"
                frameBorder="0"
                allow="autoplay; encrypted-media"
                className={`block ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setIsLoaded(true)}
              />
            </div>

            <p className="mt-2 text-[10px] leading-relaxed text-white/40">
              已设置为自动播放，受浏览器限制，部分设备需先与页面交互一次才能出声。
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-love-gradient text-white shadow-glow transition-shadow hover:shadow-[0_0_30px_rgba(255,107,157,0.5)] md:h-14 md:w-14"
      >
        {isOpen ? (
          <X className="h-5 w-5 md:h-6 md:w-6" />
        ) : (
          <Music className="h-5 w-5 md:h-6 md:w-6" />
        )}
      </motion.button>
    </div>
  )
}
