import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { ArrowLeft, Plus, Minus, RotateCcw } from 'lucide-react'
import type { FootprintCity } from '@/types'
import chinaMapSvg from '@/assets/china-map.svg?raw'
import { provinceToCities, provinceNames } from '@/data/cityProvinceMap'

const cityPositions: Record<string, { x: number; y: number }> = {
  北京: { x: 782, y: 302 },
  上海: { x: 858, y: 422 },
  广州: { x: 762, y: 592 },
  深圳: { x: 772, y: 602 },
  杭州: { x: 836, y: 452 },
  南京: { x: 824, y: 412 },
  成都: { x: 568, y: 482 },
  重庆: { x: 602, y: 502 },
  西安: { x: 656, y: 392 },
  武汉: { x: 706, y: 470 },
  长沙: { x: 688, y: 532 },
  厦门: { x: 824, y: 574 },
  青岛: { x: 830, y: 352 },
  大连: { x: 862, y: 282 },
  昆明: { x: 548, y: 616 },
  大理: { x: 528, y: 606 },
  丽江: { x: 518, y: 596 },
  三亚: { x: 704, y: 720 },
  桂林: { x: 666, y: 628 },
  拉萨: { x: 324, y: 562 },
  乌鲁木齐: { x: 224, y: 242 },
  哈尔滨: { x: 908, y: 148 },
  苏州: { x: 846, y: 430 },
  宁波: { x: 854, y: 444 },
  天津: { x: 800, y: 312 },
  郑州: { x: 724, y: 384 },
  济南: { x: 792, y: 362 },
  合肥: { x: 796, y: 432 },
  南昌: { x: 762, y: 514 },
  贵阳: { x: 624, y: 572 },
  南宁: { x: 644, y: 640 },
  兰州: { x: 544, y: 382 },
  西宁: { x: 504, y: 372 },
  银川: { x: 584, y: 342 },
}

const MEMORY_COLOR = '#D68FB8'
const DEFAULT_FILL = '#2a2a3e'
const STROKE_DEFAULT = '#4a4a5e'
const MIN_SCALE = 1
const MAX_SCALE = 4

interface ProvinceCityMapProps {
  provinceId: string
  cities: FootprintCity[]
  onCityClick: (city: FootprintCity) => void
  onBack: () => void
}

export function ProvinceCityMap({ provinceId, cities, onCityClick, onBack }: ProvinceCityMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [pathData, setPathData] = useState<string | null>(null)
  const [bbox, setBbox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  const provinceCities = useMemo(() => {
    const names = provinceToCities[provinceId] || []
    return cities.filter((c) => names.includes(c.name))
  }, [provinceId, cities])

  useEffect(() => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(chinaMapSvg, 'image/svg+xml')
    const path = doc.querySelector(`path[data-id="${provinceId}"]`)
    const d = path?.getAttribute('d')
    if (!d) return

    const tmpSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    tmpSvg.style.position = 'fixed'
    tmpSvg.style.visibility = 'hidden'
    tmpSvg.style.pointerEvents = 'none'
    const tmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    tmpPath.setAttribute('d', d)
    tmpSvg.appendChild(tmpPath)
    document.body.appendChild(tmpSvg)
    const box = tmpPath.getBBox()
    document.body.removeChild(tmpSvg)

    setPathData(d)
    setBbox(box)
  }, [provinceId])

  const constrainTranslate = useCallback(
    (nextScale: number, tx: number, ty: number) => {
      const container = containerRef.current
      if (!container) return { x: tx, y: ty }
      const rect = container.getBoundingClientRect()
      const contentW = rect.width * nextScale
      const contentH = rect.height * nextScale
      const maxTx = Math.max(0, (contentW - rect.width) / 2)
      const maxTy = Math.max(0, (contentH - rect.height) / 2)
      return {
        x: Math.max(-maxTx, Math.min(maxTx, tx)),
        y: Math.max(-maxTy, Math.min(maxTy, ty)),
      }
    },
    [],
  )

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta))
      if (nextScale === scale) return
      const scaleRatio = nextScale / scale
      const newX = mouseX - (mouseX - translate.x) * scaleRatio
      const newY = mouseY - (mouseY - translate.y) * scaleRatio
      const constrained = constrainTranslate(nextScale, newX, newY)
      setScale(nextScale)
      setTranslate(constrained)
    },
    [scale, translate, constrainTranslate],
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-city-marker]')) return
      e.preventDefault()
      setDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y }
    },
    [translate],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragging) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      const constrained = constrainTranslate(scale, dragStart.current.tx + dx, dragStart.current.ty + dy)
      setTranslate(constrained)
    },
    [dragging, scale, constrainTranslate],
  )

  const stopDragging = useCallback(() => setDragging(false), [])

  const zoomBy = useCallback(
    (factor: number) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor))
      const scaleRatio = nextScale / scale
      const newX = centerX - (centerX - translate.x) * scaleRatio
      const newY = centerY - (centerY - translate.y) * scaleRatio
      const constrained = constrainTranslate(nextScale, newX, newY)
      setScale(nextScale)
      setTranslate(constrained)
    },
    [scale, translate, constrainTranslate],
  )

  const resetView = useCallback(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])

  useEffect(() => {
    const onWindowMouseUp = () => setDragging(false)
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [])

  if (!pathData || !bbox) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-abyss-light text-white/50">
        加载省份地图中…
      </div>
    )
  }

  const padding = Math.max(bbox.width, bbox.height) * 0.12
  const viewBoxW = bbox.width + padding * 2
  const viewBoxH = bbox.height + padding * 2
  const viewBox = `${bbox.x - padding} ${bbox.y - padding} ${viewBoxW} ${viewBoxH}`

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-abyss-light"
      onWheel={handleWheel}
    >
      {/* 顶部返回与标题 */}
      <div className="absolute left-4 top-4 z-20 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 rounded-full bg-abyss/60 px-4 py-2 text-sm text-white shadow-glass backdrop-blur-glass transition-colors hover:bg-abyss"
        >
          <ArrowLeft className="h-4 w-4" />
          返回全国
        </button>
        <span className="rounded-full bg-abyss/60 px-4 py-2 text-sm text-white/80 shadow-glass backdrop-blur-glass">
          {provinceNames[provinceId] || provinceId}
        </span>
      </div>

      <div
        className={`absolute inset-0 flex select-none items-center justify-center ${
          dragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
      >
        <div className="relative aspect-[1000/776] max-h-full max-w-full">
          <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <path
              d={pathData}
              fill={DEFAULT_FILL}
              fillOpacity={0.35}
              stroke={STROKE_DEFAULT}
              strokeWidth={1.2}
              style={{ transition: 'fill 0.3s, fill-opacity 0.3s' }}
            />
          </svg>

          {provinceCities.map((city) => {
            const pos = cityPositions[city.name]
            if (!pos) return null
            const left = ((pos.x - bbox.x + padding) / viewBoxW) * 100
            const top = ((pos.y - bbox.y + padding) / viewBoxH) * 100
            const hasMemory = city.has_memory

            return (
              <button
                key={city.id}
                type="button"
                data-city-marker
                onClick={(e) => {
                  e.stopPropagation()
                  onCityClick(city)
                }}
                className="group absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ left: `${left}%`, top: `${top}%` }}
                title={city.name}
              >
                <span
                  className={`relative rounded-full transition-all duration-300 ${
                    hasMemory ? 'h-4 w-4' : 'h-2.5 w-2.5 group-hover:h-3.5 group-hover:w-3.5'
                  }`}
                  style={{
                    backgroundColor: hasMemory ? MEMORY_COLOR : 'rgba(255,255,255,0.85)',
                    boxShadow: hasMemory
                      ? `0 0 12px ${MEMORY_COLOR}, 0 0 4px rgba(255,255,255,0.6)`
                      : '0 0 6px rgba(255,255,255,0.3)',
                  }}
                >
                  {hasMemory && (
                    <span
                      className="absolute inset-0 rounded-full animate-ping opacity-40"
                      style={{ backgroundColor: MEMORY_COLOR }}
                    />
                  )}
                </span>
                <span
                  className="mt-1 whitespace-nowrap text-[10px] text-white/80"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                >
                  {city.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 缩放控制 */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          disabled={scale >= MAX_SCALE}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-abyss/70 text-white shadow-glass backdrop-blur-glass transition-colors hover:bg-abyss disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          disabled={scale <= MIN_SCALE}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-abyss/70 text-white shadow-glass backdrop-blur-glass transition-colors hover:bg-abyss disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-abyss/70 text-white shadow-glass backdrop-blur-glass transition-colors hover:bg-abyss"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
