import { useMemo, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Loader2, ImageOff } from 'lucide-react'
import { motion } from 'framer-motion'
import { GlassCard } from '@/components/ui/GlassCard'
import { GradientButton } from '@/components/ui/GradientButton'
import { Chip } from '@/components/ui/Chip'
import { useMemories } from '@/hooks/useMemories'
import { PhotoNoteModal } from '@/components/memories/PhotoNoteModal'
import { fileToBase64, fileType } from '@/utils/file'
import type { Memory, MemoryMedia } from '@/types'

interface DateGroup {
  date: string
  year: number
  month: number
  day: number
  items: { memory: Memory; media: MemoryMedia }[]
}

export default function Memories() {
  const { memories, loading, updateMemoryMedia, updateMemory, deleteMemory, refresh } = useMemories()
  const [query, setQuery] = useState('')
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [active, setActive] = useState<{ memory: Memory; media: MemoryMedia } | null>(null)
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allTags = useMemo(
    () => Array.from(new Set(memories.flatMap((m) => m.tags || []))),
    [memories],
  )

  const dateGroups: DateGroup[] = useMemo(() => {
    const map = new Map<string, DateGroup>()
    memories.forEach((memory) => {
      const matchesQuery =
        !query ||
        memory.title.toLowerCase().includes(query.toLowerCase()) ||
        memory.description?.toLowerCase().includes(query.toLowerCase()) ||
        memory.locations.some((l) => l.name.toLowerCase().includes(query.toLowerCase())) ||
        memory.tags?.some((t) => t.toLowerCase().includes(query.toLowerCase()))
      const matchesTag = !filterTag || memory.tags?.includes(filterTag)
      if (!matchesQuery || !matchesTag) return

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
  }, [memories, query, filterTag])

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
    const remaining = memory.media.filter((m) => m.id !== media.id)
    if (remaining.length === 0) {
      deleteMemory(memory.id)
    } else {
      await updateMemoryMedia(memory.id, () => remaining)
    }
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
  }

  const handleUpdateMeta = async (input: { date: string; tags: string[] }) => {
    if (!active) return
    await updateMemory(active.memory.id, {
      date: input.date,
      tags: input.tags,
    })
  }

  const handleAddFiles = useCallback(
    async (files: FileList | null) => {
      if (!active || !files || files.length === 0) return
      const newMedia = await Promise.all(
        Array.from(files).map(async (file, idx) => {
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
    <section className="page-container mx-auto max-w-6xl pt-24">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-sm tracking-widest text-star-pink/80 uppercase">Experience</p>
          <h1 className="font-serif text-5xl font-light italic text-white md:text-6xl">
            Memories
          </h1>
        </div>
        <Link to="/memories/new">
          <GradientButton className="flex items-center gap-2 whitespace-nowrap">
            <Plus className="h-4 w-4" />
            New Memory
          </GradientButton>
        </Link>
      </div>

      {/* Search & filter */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder="搜索事件、地点、心情或标签…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-full border border-glass-border bg-glass py-3 pl-12 pr-5 text-white placeholder-white/40 outline-none ring-star-pink/30 transition-all focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip label="全部" active={filterTag === null} onClick={() => setFilterTag(null)} />
          {allTags.map((tag) => (
            <Chip key={tag} label={tag} active={filterTag === tag} onClick={() => setFilterTag(tag)} />
          ))}
        </div>
      </div>

      {/* Date groups */}
      {loading && (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载中…
        </div>
      )}

      {!loading && dateGroups.length === 0 && (
        <GlassCard className="py-16 text-center">
          <ImageOff className="mx-auto mb-3 h-10 w-10 text-white/30" />
          <p className="text-white/60">没有找到匹配的回忆</p>
        </GlassCard>
      )}

      <div className="space-y-6">
        {!loading &&
          dateGroups.map((group, groupIdx) => {
            const cover = coverItem(group.items)
            const rest = group.items.filter((i) => i.media.id !== cover.media.id)
            const isExpanded = expandedDates.has(group.date)
            const displayedRest = isExpanded ? rest : rest.slice(0, 4)

            return (
              <motion.div
                key={group.date}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.06, duration: 0.4 }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-lg backdrop-blur-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row">
                  {/* Left: date + cover photo */}
                  <div className="flex-shrink-0">
                    <div className="flex items-start gap-3 md:block">
                      <div className="flex h-12 w-12 flex-shrink-0 flex-col items-center justify-center rounded-xl bg-star-pink/15 text-star-pink md:mb-3">
                        <span className="text-xs">{group.month}月</span>
                        <span className="font-serif text-xl font-semibold italic">{group.day}</span>
                      </div>
                      {renderMediaThumb(cover, 'h-36 w-36 md:h-40 md:w-40')}
                    </div>
                  </div>

                  {/* Right: thumbnails + note area */}
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
                      {rest.length > 4 && (
                        <button
                          onClick={() => toggleDate(group.date)}
                          className="text-xs text-white/60 transition-colors hover:text-white"
                        >
                          {isExpanded ? '折叠' : `展开 ${rest.length - 4} 张`}
                        </button>
                      )}
                    </div>

                    {/* Thumbnails row */}
                    <div className="mb-3 flex flex-wrap gap-2">
                      {displayedRest.map((item) =>
                        renderMediaThumb(item, 'h-14 w-14 md:h-16 md:w-16'),
                      )}
                      {!isExpanded && rest.length > 4 && (
                        <button
                          onClick={() => toggleDate(group.date)}
                          className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-xs text-white/60 md:h-16 md:w-16"
                        >
                          +{rest.length - 4}
                        </button>
                      )}
                    </div>

                    {/* Note area */}
                    <div className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3">
                      {cover.media.note ? (
                        <p className="text-sm leading-relaxed text-white/80">
                          “{cover.media.note}”
                        </p>
                      ) : (
                        <p className="text-sm italic text-white/40">
                          点击照片添加便签…
                        </p>
                      )}
                    </div>
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
          onUpdateMeta={handleUpdateMeta}
          onAddFiles={() => fileInputRef.current?.click()}
        />
      )}
    </section>
  )
}
