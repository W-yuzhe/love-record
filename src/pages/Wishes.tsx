import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plane, UtensilsCrossed, Home, Sprout, Sparkles, Check, ArrowRight, Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Chip } from '@/components/ui/Chip'
import { useWishes } from '@/hooks/useWishes'
import type { Wish } from '@/types'

const categories: { key: Wish['category'] | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: '全部', icon: <Sparkles className="h-3.5 w-3.5" /> },
  { key: 'travel', label: '旅行', icon: <Plane className="h-3.5 w-3.5" /> },
  { key: 'food', label: '美食', icon: <UtensilsCrossed className="h-3.5 w-3.5" /> },
  { key: 'life', label: '生活', icon: <Home className="h-3.5 w-3.5" /> },
  { key: 'growth', label: '成长', icon: <Sprout className="h-3.5 w-3.5" /> },
]

export default function Wishes() {
  const { wishes, loading } = useWishes()
  const [category, setCategory] = useState<Wish['category'] | 'all'>('all')

  const filtered = useMemo(() => {
    return category === 'all' ? wishes : wishes.filter((w) => w.category === category)
  }, [category, wishes])

  const achieved = wishes.filter((w) => w.is_achieved).length

  return (
    <section className="page-container mx-auto max-w-7xl pt-24">
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="mb-1 text-sm tracking-widest text-star-pink/80 uppercase">Wishlist</p>
          <h1 className="section-title">心愿清单</h1>
          <p className="mt-2 text-white/60">
            已实现 <span className="font-serif text-2xl font-bold text-white">{achieved}</span> /{' '}
            {wishes.length} 个
          </p>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map((c) => (
          <Chip
            key={c.key}
            label={c.label}
            icon={c.icon}
            active={category === c.key}
            onClick={() => setCategory(c.key)}
          />
        ))}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-white/40">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          加载心愿中…
        </div>
      )}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((wish) => (
          <GlassCard key={wish.id} className="relative overflow-hidden" hover>
            {wish.is_achieved && (
              <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-gradient-to-r from-green-400/20 to-emerald-500/20 px-3 py-1 text-xs font-medium text-green-300 backdrop-blur-sm">
                <Check className="h-3 w-3" />
                已实现
              </div>
            )}
            <div className="mb-3 flex items-center gap-2">
              {(() => {
                const cat = categories.find((c) => c.key === wish.category)
                return cat ? (
                  <span className="flex items-center gap-1 text-xs text-white/50">
                    {cat.icon}
                    {cat.label}
                  </span>
                ) : null
              })()}
            </div>
            <h3 className="mb-2 font-serif text-xl font-semibold text-white">{wish.title}</h3>
            <p className="mb-4 text-sm text-white/60">{wish.description}</p>

            {wish.is_achieved && wish.achieved_date && (
              <p className="mb-4 text-xs text-white/40">实现于 {wish.achieved_date}</p>
            )}

            <div className="flex items-center justify-between">
              {wish.is_achieved ? (
                <Link
                  to={wish.related_memory_id ? `/memories/${wish.related_memory_id}` : '/memories'}
                  className="flex items-center gap-1 text-sm text-star-pink hover:underline"
                >
                  查看关联记忆 <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : (
                <span className="text-xs text-white/40">待完成</span>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  )
}
