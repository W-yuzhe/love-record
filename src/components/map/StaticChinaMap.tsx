import { useRef, useState, useEffect, useCallback } from 'react'
import { Plus, Minus, RotateCcw } from 'lucide-react'
import type { FootprintCity } from '@/types'
import chinaMapSvg from '@/assets/china-map.svg?raw'
import { cityToProvince } from '@/data/cityProvinceMap'

interface StaticChinaMapProps {
  cities?: FootprintCity[]
  selectedId?: string | null
  className?: string
  onProvinceClick?: (provinceId: string) => void
}

const MEMORY_COLOR = '#D68FB8'
const DEFAULT_FILL = '#2a2a3e'
const STROKE_DEFAULT = '#4a4a5e'
const STROKE_HOVER = '#D68FB8'
const MIN_SCALE = 1
const MAX_SCALE = 4

export function StaticChinaMap({
  cities = [],
  className = '',
  onProvinceClick,
}: StaticChinaMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapWrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 })

  const callbackRef = useRef(onProvinceClick)
  useEffect(() => {
    callbackRef.current = onProvinceClick
  }, [onProvinceClick])

  const memoryProvincesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    memoryProvincesRef.current = new Set(
      cities
        .filter((c) => c.has_memory)
        .map((c) => cityToProvince[c.name])
        .filter(Boolean),
    )
  }, [cities])

  // 绑定省份点击、hover 事件；只执行一次，数据通过 ref 访问
  useEffect(() => {
    if (!mapWrapperRef.current) return
    const wrapper = mapWrapperRef.current

    const svg = wrapper.querySelector('svg')
    if (svg) {
      svg.setAttribute('width', '100%')
      svg.setAttribute('height', '100%')
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    }

    const paths = Array.from(wrapper.querySelectorAll<SVGPathElement>('svg path[data-id]'))

    const isMemoryProvince = (id: string | null) =>
      id ? memoryProvincesRef.current.has(id) : false

    const updatePathStyle = (path: SVGPathElement, hovered: boolean) => {
      const id = path.getAttribute('data-id')
      const hasMemory = isMemoryProvince(id)
      path.style.fill = hasMemory ? MEMORY_COLOR : DEFAULT_FILL
      path.style.fillOpacity = hovered ? '0.7' : hasMemory ? '0.55' : '0.25'
      path.style.stroke = hovered ? STROKE_HOVER : STROKE_DEFAULT
      path.style.strokeWidth = hovered ? '1.5' : '0.8'
      path.style.transition = 'fill 0.25s, fill-opacity 0.25s, stroke 0.25s, stroke-width 0.25s'
      path.style.cursor = 'pointer'
    }

    const handleClick = (e: Event) => {
      e.stopPropagation()
      const path = e.currentTarget as SVGPathElement
      const provinceId = path.getAttribute('data-id')
      if (!provinceId) return
      callbackRef.current?.(provinceId)
    }

    const handleMouseEnter = (e: Event) => {
      updatePathStyle(e.currentTarget as SVGPathElement, true)
    }

    const handleMouseLeave = (e: Event) => {
      updatePathStyle(e.currentTarget as SVGPathElement, false)
    }

    paths.forEach((path) => {
      updatePathStyle(path, false)
      path.addEventListener('click', handleClick)
      path.addEventListener('mouseenter', handleMouseEnter)
      path.addEventListener('mouseleave', handleMouseLeave)
    })

    return () => {
      paths.forEach((path) => {
        path.removeEventListener('click', handleClick)
        path.removeEventListener('mouseenter', handleMouseEnter)
        path.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // cities 变化时刷新省份颜色
  useEffect(() => {
    if (!mapWrapperRef.current) return
    const paths = Array.from(
      mapWrapperRef.current.querySelectorAll<SVGPathElement>('svg path[data-id]'),
    )
    paths.forEach((path) => {
      const id = path.getAttribute('data-id')
      const hasMemory = id ? memoryProvincesRef.current.has(id) : false
      path.style.fill = hasMemory ? MEMORY_COLOR : DEFAULT_FILL
      path.style.fillOpacity = hasMemory ? '0.55' : '0.25'
    })
  }, [cities])

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
      if (target.closest('svg path[data-id]')) return
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

  const touchStart = useRef<{ x: number; y: number; tx: number; ty: number } | null>(null)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length !== 1) return
      const t = e.touches[0]
      const target = t.target as HTMLElement
      if (target.closest('svg path[data-id]')) return
      touchStart.current = { x: t.clientX, y: t.clientY, tx: translate.x, ty: translate.y }
    },
    [translate],
  )

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStart.current || e.touches.length !== 1) return
      const t = e.touches[0]
      const dx = t.clientX - touchStart.current.x
      const dy = t.clientY - touchStart.current.y
      const constrained = constrainTranslate(scale, touchStart.current.tx + dx, touchStart.current.ty + dy)
      setTranslate(constrained)
    },
    [scale, constrainTranslate],
  )

  const handleTouchEnd = useCallback(() => {
    touchStart.current = null
  }, [])

  useEffect(() => {
    const onWindowMouseUp = () => setDragging(false)
    window.addEventListener('mouseup', onWindowMouseUp)
    return () => window.removeEventListener('mouseup', onWindowMouseUp)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-2xl bg-abyss-light ${className}`}
      onWheel={handleWheel}
    >
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          ref={mapWrapperRef}
          className="aspect-[1000/776] max-h-full max-w-full"
          style={{ width: 'auto', height: 'auto' }}
        >
          <div
            className="china-map h-full w-full"
            dangerouslySetInnerHTML={{ __html: chinaMapSvg }}
          />
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

      {/* 图例 */}
      <div className="absolute left-4 top-4 rounded-xl bg-abyss/60 px-3 py-2 text-xs text-white/70 shadow-glass backdrop-blur-glass">
        <div className="mb-1.5 flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-sm border border-white/10"
            style={{ backgroundColor: MEMORY_COLOR, opacity: 0.7 }}
          />
          <span>已点亮</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="h-3.5 w-3.5 rounded-sm border border-white/10"
            style={{ backgroundColor: DEFAULT_FILL, opacity: 0.5 }}
          />
          <span>未点亮</span>
        </div>
      </div>
    </div>
  )
}
