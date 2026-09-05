import { useParams, Link } from 'react-router-dom'
import { MapPin, Calendar, Lock, Users, Globe, ChevronLeft, User, PenLine, Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Chip } from '@/components/ui/Chip'
import { useMemory } from '@/hooks/useMemories'
import { siteConfig, currentUser } from '@/data/mock'
import type { Visibility } from '@/types'

const visibilityOptions: { key: Visibility; label: string; icon: React.ReactNode }[] = [
  { key: 'private', label: '仅自己', icon: <Lock className="h-3.5 w-3.5" /> },
  { key: 'couple', label: '双人', icon: <Users className="h-3.5 w-3.5" /> },
  { key: 'public', label: '公开', icon: <Globe className="h-3.5 w-3.5" /> },
]

const completenessItems = [
  '时间',
  '地点',
  '人物',
  '心情',
  '天气',
  '照片',
  '描述',
  '标签',
  '语音',
  '协作',
]

export default function MemoryDetail() {
  const { id } = useParams<{ id: string }>()
  const { memory, loading } = useMemory(id)

  const partner = memory && memory.created_by === currentUser.id ? siteConfig.partnerB : siteConfig.partnerA

  if (loading) {
    return (
      <section className="page-container mx-auto flex max-w-5xl items-center justify-center pt-24">
        <div className="flex items-center text-white/40">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载记忆中…
        </div>
      </section>
    )
  }

  if (!memory) {
    return (
      <section className="page-container mx-auto max-w-5xl pt-24 text-center">
        <GlassCard className="py-16">
          <p className="text-white/60">找不到这条记忆</p>
          <Link to="/memories" className="mt-4 inline-block text-star-pink hover:underline">
            返回回忆录
          </Link>
        </GlassCard>
      </section>
    )
  }

  return (
    <section className="page-container mx-auto max-w-5xl pt-24">
      <Link
        to="/memories"
        className="mb-6 inline-flex items-center gap-1 text-sm text-white/60 transition-colors hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        返回回忆录
      </Link>

      {/* Cover */}
      <div className="relative mb-8 aspect-[21/9] w-full overflow-hidden rounded-3xl border border-glass-border shadow-glass">
        <img
          src={
            memory.media[0]?.url ||
            'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=1200&q=80'
          }
          alt={memory.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-abyss via-abyss/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">
              <Calendar className="h-3 w-3" />
              {memory.date}
            </span>
            {memory.locations.map((loc) => (
              <span
                key={loc.id}
                className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm"
              >
                <MapPin className="h-3 w-3" />
                {loc.name}
              </span>
            ))}
          </div>
          <h1 className="font-serif text-3xl font-bold text-white md:text-5xl">{memory.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard>
            <h3 className="mb-3 font-serif text-xl font-semibold text-white">故事</h3>
            <p className="leading-relaxed text-white/70">
              {memory.description || '还没有写下故事，点击补充完整这份记忆。'}
            </p>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 font-serif text-xl font-semibold text-white">照片墙</h3>
            {memory.media.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {memory.media.map((m) => (
                  <div key={m.id} className="aspect-square overflow-hidden rounded-xl border border-glass-border">
                    <img src={m.url} alt="memory" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">暂无照片</p>
            )}
          </GlassCard>

          {/* Partner collaboration */}
          <GlassCard>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-star-pink/20">
                  <User className="h-5 w-5 text-star-pink" />
                </div>
                <div>
                  <h3 className="font-medium text-white">双人协作</h3>
                  <p className="text-sm text-white/60">
                    {currentUser.nickname} 已写 · 等 {partner}
                  </p>
                </div>
              </div>
              <button className="flex items-center gap-1 rounded-full bg-white/5 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/10">
                <PenLine className="h-4 w-4" />
                切换 {partner} 视角
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <GlassCard>
            <h3 className="mb-4 font-serif text-lg font-semibold text-white">记录完整度</h3>
            <div className="mb-3 flex items-center justify-between text-sm text-white/70">
              <span>
                {memory.completeness}/{completenessItems.length} 项
              </span>
              <span className="font-bold text-star-pink">
                {Math.round(((memory.completeness || 0) / completenessItems.length) * 100)}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-love-gradient transition-all"
                style={{ width: `${((memory.completeness || 0) / completenessItems.length) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {completenessItems.map((item, i) => (
                <span
                  key={item}
                  className={[
                    'rounded-full px-2.5 py-1 text-xs font-medium',
                    i < (memory.completeness || 0)
                      ? 'bg-star-pink/20 text-star-pink'
                      : 'bg-white/5 text-white/40',
                  ].join(' ')}
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-4 text-xs text-white/40">补全标签、语音或描述可提升完整度</p>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 font-serif text-lg font-semibold text-white">情绪反应</h3>
            <div className="flex gap-2">
              {['😍', '🥰', '😄', '😢', '❤️'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-xl transition-colors hover:bg-white/10"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-4 font-serif text-lg font-semibold text-white">可见性</h3>
            <div className="flex flex-wrap gap-2">
              {visibilityOptions.map((v) => (
                <Chip
                  key={v.key}
                  label={v.label}
                  icon={v.icon}
                  active={memory.visibility === v.key}
                />
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h3 className="mb-3 font-serif text-lg font-semibold text-white">补充的话</h3>
            <textarea
              rows={3}
              placeholder="你还有什么想说的…"
              className="w-full rounded-xl border border-glass-border bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none ring-star-pink/30 transition-all focus:ring-2"
            />
          </GlassCard>
        </div>
      </div>
    </section>
  )
}
