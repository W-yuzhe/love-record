import { useMemo, useState } from 'react'
import { CalendarDays, Images, Tag, Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Chip } from '@/components/ui/Chip'
import { useMemories } from '@/hooks/useMemories'

type ViewMode = 'event' | 'month'

interface PhotoItem {
  url: string
  title?: string
}

interface GalleryGroup {
  id: string
  title: string
  subtitle: string
  photos: PhotoItem[]
}

export default function Gallery() {
  const { memories, loading } = useMemories()
  const [mode, setMode] = useState<ViewMode>('event')

  const groups: GalleryGroup[] = useMemo(() => {
    if (mode === 'event') {
      return memories.map((m) => ({
        id: m.id,
        title: m.title,
        subtitle: m.date,
        photos: m.media.map((media) => ({ url: media.url, title: m.title })),
      }))
    }
    const map = new Map<string, GalleryGroup>()
    memories.forEach((m) => {
      const month = m.date.slice(0, 7)
      if (!map.has(month)) {
        map.set(month, {
          id: month,
          title: `${month.replace('-', ' 年 ')} 月`,
          subtitle: '',
          photos: [],
        })
      }
      const group = map.get(month)!
      m.media.forEach((media) => group.photos.push({ url: media.url, title: m.title }))
      group.subtitle = `${group.photos.length} 张`
    })
    return Array.from(map.values()).sort((a, b) => b.id.localeCompare(a.id))
  }, [mode, memories])

  return (
    <section className="page-container mx-auto max-w-7xl pt-24">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-sm tracking-widest text-star-pink/80 uppercase">Gallery</p>
          <h1 className="section-title">相册</h1>
        </div>
        <div className="flex gap-2">
          <Chip
            label="按事件"
            icon={<Tag className="h-3.5 w-3.5" />}
            active={mode === 'event'}
            onClick={() => setMode('event')}
          />
          <Chip
            label="按月份"
            icon={<CalendarDays className="h-3.5 w-3.5" />}
            active={mode === 'month'}
            onClick={() => setMode('month')}
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载相册中…
        </div>
      )}
      <div className="space-y-12">
        {!loading && groups.length === 0 && (
          <GlassCard className="py-16 text-center">
            <p className="text-white/60">还没有照片</p>
          </GlassCard>
        )}
        {groups.map((group) => (
          <div key={group.id}>
            <div className="mb-4 flex items-center gap-3">
              {mode === 'event' ? (
                <Images className="h-5 w-5 text-star-pink" />
              ) : (
                <CalendarDays className="h-5 w-5 text-star-pink" />
              )}
              <h2 className="font-serif text-2xl font-semibold text-white">{group.title}</h2>
              {group.subtitle && <span className="text-sm text-white/50">{group.subtitle}</span>}
              <div className="h-px flex-1 bg-gradient-to-r from-glass-border to-transparent" />
            </div>

            <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
              {group.photos.map((photo, idx) => (
                <GlassCard key={idx} className="mb-4 break-inside-avoid overflow-hidden p-0" hover>
                  <div className="relative">
                    <img
                      src={photo.url}
                      alt={photo.title || 'gallery'}
                      className="w-full object-cover"
                      style={{ display: 'block' }}
                    />
                    {photo.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-abyss/90 to-transparent px-3 py-2">
                        <p className="line-clamp-1 text-xs text-white/80">{photo.title}</p>
                      </div>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
