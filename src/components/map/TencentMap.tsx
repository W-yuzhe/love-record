import { useEffect, useRef, useState, useMemo } from 'react'
import type { FootprintCity } from '@/types'

interface TencentMapProps {
  center?: { lat: number; lng: number }
  zoom?: number
  cities?: FootprintCity[]
  selectedId?: string | null
  className?: string
  onCityClick?: (city: FootprintCity) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const window: Window & { TMap?: any }

const mapKey = import.meta.env.VITE_TENCENT_MAP_KEY

function markerSvg(color: string, glow = false, size = 20): string {
  const glowFilter = glow
    ? `<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`
    : ''
  const filterAttr = glow ? 'filter="url(#glow)"' : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${glowFilter}<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${color}" stroke="white" stroke-width="1.5" ${filterAttr}/></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

export function TencentMap({
  center = { lat: 35.8617, lng: 104.1954 },
  zoom = 4,
  cities = [],
  selectedId,
  className = '',
  onCityClick,
}: TencentMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<unknown>(null)
  const markerRef = useRef<unknown>(null)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const clickHandlerRef = useRef<((e: unknown) => void) | null>(null)

  const markerIcons = useMemo(
    () => ({
      default: markerSvg('#ffffff', false, 18),
      memory: markerSvg('#FF6B9D', true, 22),
      selected: markerSvg('#FFB8D0', true, 26),
    }),
    [],
  )

  // Load TMap script
  useEffect(() => {
    if (!mapKey) {
      setError('未配置腾讯地图 Key，请在 .env 中设置 VITE_TENCENT_MAP_KEY')
      return
    }
    if (window.TMap) {
      setLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${mapKey}`
    script.async = true
    script.onload = () => {
      if (window.TMap) {
        setLoaded(true)
      } else {
        setError('腾讯地图脚本加载失败，请检查 Key 与 Referer 白名单')
      }
    }
    script.onerror = () => setError('腾讯地图脚本加载失败')
    document.body.appendChild(script)
  }, [])

  // Initialize map
  useEffect(() => {
    if (!loaded || !containerRef.current || !window.TMap) return

    const TMap = window.TMap
    try {
      const map = new TMap.Map(containerRef.current, {
        center: new TMap.LatLng(center.lat, center.lng),
        zoom,
        minZoom: 3,
        maxZoom: 18,
      })
      mapRef.current = map

      // 兜底：点击地图任意位置，查找最近的城市（半径 50 公里内）
      if (onCityClick && cities.length > 0) {
        map.on('click', (e: { latLng: { lat: number; lng: number } }) => {
          const clicked = e.latLng
          let nearest: FootprintCity | null = null
          let minDist = Infinity
          const R = 6371 // km
          const toRad = (deg: number) => (deg * Math.PI) / 180

          cities.forEach((city) => {
            const dLat = toRad(city.lat - clicked.lat)
            const dLng = toRad(city.lng - clicked.lng)
            const a =
              Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(clicked.lat)) *
                Math.cos(toRad(city.lat)) *
                Math.sin(dLng / 2) ** 2
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
            const d = R * c
            if (d < minDist) {
              minDist = d
              nearest = city
            }
          })

          if (nearest && minDist < 80) {
            onCityClick(nearest)
          }
        })
      }
    } catch (err) {
      console.error('TMap init error', err)
      setError('地图初始化失败')
    }

    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapRef.current as any)?.destroy()
      } catch {
        // ignore
      }
    }
  }, [loaded, center.lat, center.lng, zoom, cities, onCityClick])

  // Update markers
  useEffect(() => {
    if (!mapRef.current || !window.TMap || cities.length === 0) return

    const TMap = window.TMap
    const geometries = cities.map((city) => {
      const isSelected = selectedId === city.id
      const styleId = isSelected ? 'selected' : city.has_memory ? 'memory' : 'default'
      return {
        id: city.id,
        position: new TMap.LatLng(city.lat, city.lng),
        properties: { city },
        styleId,
      }
    })

    // 移除旧标记
    if (markerRef.current) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(markerRef.current as any).setMap(null)
        ;(markerRef.current as any).off('click')
      } catch {
        // ignore
      }
    }

    const marker = new TMap.MultiMarker({
      map: mapRef.current,
      styles: {
        default: new TMap.MarkerStyle({
          width: 18,
          height: 18,
          anchor: { x: 9, y: 9 },
          src: markerIcons.default,
        }),
        memory: new TMap.MarkerStyle({
          width: 22,
          height: 22,
          anchor: { x: 11, y: 11 },
          src: markerIcons.memory,
        }),
        selected: new TMap.MarkerStyle({
          width: 26,
          height: 26,
          anchor: { x: 13, y: 13 },
          src: markerIcons.selected,
        }),
      },
      geometries,
    })
    markerRef.current = marker

    if (onCityClick) {
      const handler = (e: unknown) => {
        try {
          // TMap GL JS 点击事件结构：e.geometry.properties.city
          const evt = e as { geometry?: { properties?: { city?: FootprintCity } }; latLng?: { lat: number; lng: number } }
          const city = evt.geometry?.properties?.city
          if (city) {
            onCityClick(city)
            return
          }
          // 兜底：通过 latLng 反查最近城市
          if (evt.latLng && cities.length > 0) {
            const clicked = evt.latLng
            let nearest: FootprintCity | null = null
            let minDist = Infinity
            const R = 6371
            const toRad = (deg: number) => (deg * Math.PI) / 180
            cities.forEach((c) => {
              const dLat = toRad(c.lat - clicked.lat)
              const dLng = toRad(c.lng - clicked.lng)
              const a =
                Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(clicked.lat)) * Math.cos(toRad(c.lat)) * Math.sin(dLng / 2) ** 2
              const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
              if (d < minDist) {
                minDist = d
                nearest = c
              }
            })
            if (nearest && minDist < 80) onCityClick(nearest)
          }
        } catch (err) {
          console.error('marker click handler error', err)
        }
      }
      clickHandlerRef.current = handler
      marker.on('click', handler)
    }

    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(markerRef.current as any)?.setMap(null)
        ;(markerRef.current as any)?.off('click')
      } catch {
        // ignore
      }
    }
  }, [cities, selectedId, markerIcons, onCityClick])

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      <div ref={containerRef} className="h-full w-full" />
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-abyss/80 p-6 text-center text-white/80">
          <p className="mb-2 font-medium">{error}</p>
          <p className="text-sm text-white/50">提示：申请 Key 后需在腾讯地图控制台添加当前域名到 Referer 白名单</p>
        </div>
      )}
    </div>
  )
}
