import type { Memory, MemoryMedia } from '@/types'

interface CoverStackProps {
  cover: { memory: Memory; media: MemoryMedia }
  rest: { memory: Memory; media: MemoryMedia }[]
  onClick?: () => void
  className?: string
}

export function CoverStack({ cover, rest, onClick, className = '' }: CoverStackProps) {
  const { memory, media } = cover
  const isVideo = media.type === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(media.url)
  const count = rest.length

  const renderThumb = (
    item: { memory: Memory; media: MemoryMedia },
    cn: string,
    style?: React.CSSProperties,
  ) => {
    const { memory: m, media: md } = item
    const video = md.type === 'video' || /\.(mp4|webm|mov)(\?.*)?$/i.test(md.url)
    return video ? (
      <video
        src={md.url}
        className={cn}
        style={style}
        muted
        playsInline
      />
    ) : (
      <img
        src={md.url}
        alt={m.title}
        className={cn}
        style={style}
        onError={(e) => {
          ;(e.currentTarget as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex-shrink-0 ${className}`}
    >
      {/* Background peeking images */}
      {count >= 2 && (
        <div
          className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5 shadow-lg"
          style={{
            transform: 'rotate(-6deg) translateX(-8px) translateY(-6px) scale(0.92)',
            zIndex: 1,
          }}
        >
          {renderThumb(
            rest[0],
            'h-full w-full rounded-2xl object-cover opacity-70',
          )}
        </div>
      )}
      {count >= 3 && (
        <div
          className="absolute inset-0 rounded-2xl border border-white/10 bg-white/5 shadow-lg"
          style={{
            transform: 'rotate(5deg) translateX(8px) translateY(-4px) scale(0.88)',
            zIndex: 2,
          }}
        >
          {renderThumb(
            rest[1] || rest[0],
            'h-full w-full rounded-2xl object-cover opacity-60',
          )}
        </div>
      )}

      {/* Main cover */}
      <div
        className="relative z-10 h-full w-full overflow-hidden rounded-2xl border-2 border-white/15 bg-black shadow-2xl transition-transform duration-300 group-hover:scale-[1.02]"
      >
        {isVideo ? (
          <video
            src={media.url}
            className="h-full w-full object-cover"
            muted
            playsInline
          />
        ) : (
          <img
            src={media.url}
            alt={memory.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        )}
      </div>

      {/* Count badge */}
      {count > 0 && (
        <span className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-star-pink text-xs font-bold text-white shadow-lg">
          +{count}
        </span>
      )}
    </button>
  )
}
