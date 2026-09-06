import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Heart, ImageOff, Loader2, ArrowLeft, MapPin, Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getLocalMemories } from '@/lib/localMemories'
import { mapMemory } from '@/hooks/useMemories'
import type { Memory, MemoryMedia } from '@/types'

interface PublicItem {
  memory: Memory
  media: MemoryMedia
}

function usePublicMemories() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      if (!isSupabaseConfigured) {
        setMemories(getLocalMemories().filter((m) => m.visibility === 'public'))
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('memories')
        .select('*, memory_locations(*), memory_media(*), memory_tags(tag)')
        .eq('visibility', 'public')
        .order('date', { ascending: false })

      if (!error && data) {
        setMemories((data as any[]).map(mapMemory))
      } else {
        console.error('public memories error', error)
        setMemories(getLocalMemories().filter((m) => m.visibility === 'public'))
      }
      setLoading(false)
    }

    load()
  }, [])

  const items = useMemo<PublicItem[]>(() => {
    const list: PublicItem[] = []
    memories.forEach((memory) => {
      memory.media.forEach((media) => {
        list.push({ memory, media })
      })
    })
    return list.sort((a, b) => b.memory.date.localeCompare(a.memory.date))
  }, [memories])

  return { memories, items, loading }
}

function ShareButton() {
  const location = useLocation()
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}${location.pathname}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
      title="复制分享链接"
    >
      {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
      {copied ? '已复制' : '分享'}
    </button>
  )
}

export default function PublicGallery() {
  const { items, loading } = usePublicMemories()
  const [active, setActive] = useState<PublicItem | null>(null)

  return (
    <section className="relative min-h-screen w-full bg-gradient-to-b from-abyss via-[#130d22] to-abyss">
      <div className="page-container mx-auto max-w-6xl pt-24 pb-24">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-1 text-sm tracking-widest text-star-pink/80 uppercase">Public</p>
            <h1 className="font-serif text-5xl font-light italic text-white md:text-6xl">
              Our Gallery
            </h1>
            <p className="mt-2 text-sm text-white/50">把当前页面链接分享给朋友，他们无需登录即可浏览公开内容</p>
          </div>
          <div className="flex items-center gap-2">
            <ShareButton />
            <Link
              to="/"
              className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4" />
              返回
            </Link>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-white/40">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            加载中…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] py-16 text-center">
            <ImageOff className="mx-auto mb-3 h-10 w-10 text-white/30" />
            <p className="text-white/60">暂无公开照片</p>
            <p className="mt-1 text-sm text-white/40">
              在“记一件小事”里把回忆可见性设为“公开”，分享给朋友时他们无需登录即可浏览
            </p>
          </div>
        )}

        <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 xl:columns-4">
          {!loading &&
            items.map((item, idx) => (
              <motion.div
                key={`${item.memory.id}-${item.media.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className="mb-4 break-inside-avoid cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] shadow-lg backdrop-blur-sm"
                onClick={() => setActive(item)}
              >
                {item.media.type === 'video' ||
                /\.(mp4|webm|mov)(\?.*)?$/i.test(item.media.url) ? (
                  <video
                    src={item.media.url}
                    className="w-full object-cover"
                    muted
                    playsInline
                    preload="metadata"
                  />
                ) : (
                  <img
                    src={item.media.url}
                    alt={item.memory.title}
                    className="w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                )}
                <div className="p-3">
                  <p className="text-sm font-medium text-white">{item.memory.title}</p>
                  <p className="text-xs text-white/50">{item.memory.date}</p>
                  {item.memory.description && (
                    <p className="mt-2 text-xs leading-relaxed text-white/70 line-clamp-2">
                      {item.memory.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-1 text-xs text-star-pink/80">
                    <Heart className="h-3 w-3" />
                    {item.media.likes || 0}
                  </div>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl border border-white/10 bg-[#151025]/95 p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {active.media.type === 'video' ||
            /\.(mp4|webm|mov)(\?.*)?$/i.test(active.media.url) ? (
              <video src={active.media.url} className="w-full rounded-xl" controls playsInline />
            ) : (
              <img
                src={active.media.url}
                alt={active.memory.title}
                className="w-full rounded-xl"
              />
            )}
            <div className="mt-4 space-y-3">
              <div>
                <h2 className="font-serif text-2xl italic text-white">{active.memory.title}</h2>
                <p className="text-sm text-white/50">{active.memory.date}</p>
              </div>
              {active.memory.locations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {active.memory.locations.map((loc) => (
                    <span
                      key={loc.id}
                      className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-1 text-xs text-white/70"
                    >
                      <MapPin className="h-3 w-3" />
                      {loc.name}
                    </span>
                  ))}
                </div>
              )}
              {active.memory.description && (
                <p className="text-base leading-relaxed text-white/80">{active.memory.description}</p>
              )}
              {active.media.note && (
                <p className="text-sm leading-relaxed text-white/60">
                  图片备注：“{active.media.note}”
                </p>
              )}
              <div className="flex items-center gap-1 text-sm text-star-pink/80">
                <Heart className="h-4 w-4" />
                {active.media.likes || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
