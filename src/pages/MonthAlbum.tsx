import { useMemo, useState, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, CalendarDays, Loader2, ImageOff, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMemories } from '@/hooks/useMemories'
import { formatMonthLabel } from '@/utils/date'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { PhotoNoteModal } from '@/components/memories/PhotoNoteModal'
import { setLocalMonthCover } from '@/lib/localMonthCovers'
import { fileToBase64, fileType } from '@/utils/file'
import { compressImages } from '@/utils/image'
import type { Memory, MemoryMedia } from '@/types'

interface DateGroup {
  date: string
  year: number
  month: number
  day: number
  items: { memory: Memory; media: MemoryMedia }[]
}

export default function MonthAlbum() {
  const { monthKey } = useParams<{ monthKey: string }>()
  const { memories, loading, updateMemoryMedia, refresh } = useMemories()
  const [active, setActive] = useState<{ memory: Memory; media: MemoryMedia } | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const monthMemories = useMemo(() => {
    if (!monthKey) return []
    return memories.filter((m) => m.date.startsWith(monthKey))
  }, [memories, monthKey])

  const dateGroups: DateGroup[] = useMemo(() => {
    const map = new Map<string, DateGroup>()
    monthMemories.forEach((memory) => {
      memory.media.forEach((media) => {
        if (!map.has(memory.date)) {
          const d = new Date(memory.date)
          map.set(memory.date, {
            date: memory.date,
            year: d.getFullYear(),
            month: d.getMonth() + 1,
            day: d.getDate(),
            items: [],
          })
        }
        map.get(memory.date)!.items.push({ memory, media })
      })
    })
    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date))
  }, [monthMemories])

  const toggleDate = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) next.delete(date)
      else next.add(date)
      return next
    })
  }

  const coverItem = (items: DateGroup['items']) => {
    return items.find((i) => i.media.is_cover) || items[0]
  }

  const handleSaveNote = async (note: string) => {
    if (!active) return
    const { memory, media } = active
    await updateMemoryMedia(memory.id, (mediaList) =>
      mediaList.map((m) => (m.id === media.id ? { ...m, note } : m)),
    )
  }

  const handleLike = async () => {
    if (!active) return
    const { memory, media } = active
    await updateMemoryMedia(memory.id, (mediaList) =>
      mediaList.map((m) =>
        m.id === media.id ? { ...m, likes: (m.likes || 0) + 1 } : m,
      ),
    )
  }

  const handleDelete = async () => {
    if (!active) return
    const { memory, media } = active
    await updateMemoryMedia(memory.id, (mediaList) => mediaList.filter((m) => m.id !== media.id))
    setActive(null)
  }

  const handleSetCover = async () => {
    if (!active) return
    const { memory, media } = active
    await updateMemoryMedia(memory.id, (mediaList) =>
      mediaList.map((m) =>
        m.memory_id === memory.id ? { ...m, is_cover: m.id === media.id } : m,
      ),
    )
    if (monthKey) {
      setLocalMonthCover(monthKey, media.url)
      refresh()
    }
  }

  const handleAddFiles = useCallback(
    async (files: FileList | null) => {
      if (!active || !files || files.length === 0) return
      const compressed = await compressImages(Array.from(files))
      const newMedia = await Promise.all(
        compressed.map(async (file, idx) => {
          const url = await fileToBase64(file)
          return {
            id: `local-media-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            memory_id: active.memory.id,
            url,
            type: fileType(file),
            sort_order: active.memory.media.length + idx,
            note: '',
            likes: 0,
            is_cover: false,
          } as MemoryMedia
        }),
      )
      await updateMemoryMedia(active.memory.id, (mediaList) => [...mediaList, ...newMedia])
      refresh()
    },
    [active, updateMemoryMedia, refresh],
  )

  const renderMediaThumb = (
    item: { memory: Memory; media: MemoryMedia },
    className: string,
    onClick?: () => void,
  ) => {
    const { memory, media } = item
    const isVideo = media.type === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(media.url)
    return (
      <button
        key={media.id}
        onClick={onClick || (() => setActive(item))}
        className={`group relative overflow-hidden rounded-xl ${className}`}
      >
        {isVideo ? (
          <video
            src={media.url}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            muted
            playsInline
          />
        ) : (
          <img
            src={media.url}
            alt={memory.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </button>
    )
  }

  return (
    <section className="page-container mx-auto max-w-5xl pt-24">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          返回首页
        </Link>
        <Link to={`/memories/new?from=album&month=${monthKey}`}>
          <GradientButton className="flex items-center gap-2 whitespace-nowrap px-5 py-2 text-sm">
            <Plus className="h-4 w-4" />
            New Moment
          </GradientButton>
        </Link>
      </div>

      <div className="mb-8 flex items-center gap-3">
        <CalendarDays className="h-6 w-6 text-star-pink" />
        <h1 className="font-serif text-4xl font-semibold italic text-white md:text-5xl">
          {monthKey ? formatMonthLabel(monthKey) : 'Month Album'}
        </h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中…
        </div>
      )}

      {!loading && dateGroups.length === 0 && (
        <GlassCard className="py-20 text-center">
          <ImageOff className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <p className="text-white/60">这个月还没有照片</p>
          <p className="mt-2 text-sm text-white/40">点击右上角添加第一张</p>
        </GlassCard>
      )}

      <div className="space-y-6">
        {!loading &&
          dateGroups.map((group, groupIdx) => {
            const cover = coverItem(group.items)
            const rest = group.items.filter((i) => i.media.id !== cover.media.id)
            const isExpanded = expandedDates.has(group.date)
            const displayedRest = isExpanded ? rest : rest.slice(0, 3)

            return (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.06, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  {/* Left: cover photo (smaller) */}
                  <div className="flex-shrink-0">
                    <div className="flex items-start gap-3 md:block">
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-star-pink/15 text-star-pink md:mb-3">
                        <span className="text-xs">{group.month}月</span>
                        <span className="font-serif text-xl font-semibold italic">{group.day}</span>
                      </div>
                      {renderMediaThumb(cover, 'h-20 w-20 md:h-24 md:w-24')}
                    </div>
                  </div>

                  {/* Right: thumbnails + note */}
                  <div className="flex flex-1 flex-col">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-serif text-lg font-semibold italic text-white">
                          {group.year}
                        </p>
                        <p className="text-xs text-white/50">
                          {group.items.length} 张 · 共{' '}
                          {group.items.reduce((acc, i) => acc + (i.media.likes || 0), 0)} 赞
                        </p>
                      </div>
                      {rest.length > 3 && (
                        <button
                          onClick={() => toggleDate(group.date)}
                          className="text-xs text-white/60 transition-colors hover:text-white"
                        >
                          {isExpanded ? '折叠' : `展开 ${rest.length - 3} 张`}
                        </button>
                      )}
                    </div>

                    {/* Thumbnails row */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {displayedRest.map((item) =>
                        renderMediaThumb(item, 'h-8 w-8 md:h-10 md:w-10'),
                      )}
                      {!isExpanded && rest.length > 3 && (
                        <button
                          onClick={() => toggleDate(group.date)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-[10px] text-white/60 md:h-10 md:w-10"
                        >
                          +{rest.length - 3}
                        </button>
                      )}
                    </div>

                    {/* Note area */}
                    {cover.media.note && (
                      <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
                        <p className="text-sm leading-relaxed text-white/80">
                          “{cover.media.note}”
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => handleAddFiles(e.target.files)}
      />

      {active && (
        <PhotoNoteModal
          memory={active.memory}
          media={active.media}
          onClose={() => setActive(null)}
          onSaveNote={handleSaveNote}
          onLike={handleLike}
          onDelete={handleDelete}
          onSetCover={handleSetCover}
          onAddFiles={() => fileInputRef.current?.click()}
        />
      )}
    </section>
  )
}
