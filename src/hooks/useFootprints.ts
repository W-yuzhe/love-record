import { useEffect, useState, useCallback } from 'react'
import { isSupabaseConfigured } from '@/lib/supabase'
import { chinaCities } from '@/data/chinaCities'
import { getLocalFootprints, updateLocalFootprint, resetLocalFootprint } from '@/lib/localFootprints'
import { ensureFootprintCities, saveTripMemory, unlightTripCity } from '@/api/footprints'
import { useAuth } from '@/contexts/AuthContext'
import type { FootprintCity } from '@/types'

export function useFootprints() {
  const { couple } = useAuth()
  const [cities, setCities] = useState<FootprintCity[]>(getLocalFootprints())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setError(null)
    if (!isSupabaseConfigured || !couple) {
      setCities(getLocalFootprints())
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const synced = await ensureFootprintCities(couple.id, chinaCities)
      setCities(synced)
    } catch (err: any) {
      console.error('useFootprints refresh error', err)
      setError(err?.message || '同步足迹失败')
      setCities(getLocalFootprints())
    } finally {
      setLoading(false)
    }
  }, [couple])

  useEffect(() => {
    refresh()
  }, [refresh])

  const saveMemory = useCallback(
    async (city: FootprintCity, input: { note: string; newFiles: File[]; keptMedia: { url: string; type: 'image' | 'video' }[] }) => {
      if (!isSupabaseConfigured || !couple) {
        // 本地模式
        const urls = input.newFiles.map((file) => ({
          url: URL.createObjectURL(file),
          type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
        }))
        const memory_media = [...input.keptMedia, ...urls]
        const next = updateLocalFootprint(city.id, {
          has_memory: true,
          memory_note: input.note,
          memory_media,
          visit_count: city.has_memory ? city.visit_count : city.visit_count + 1,
          memory_count: city.has_memory ? city.memory_count : city.memory_count + 1,
        })
        setCities(next)
        return next.find((c) => c.id === city.id)!
      }

      try {
        const updated = await saveTripMemory(city, input, couple.id)
        setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        return updated
      } catch (err) {
        console.error('saveTripMemory failed, fallback to local', err)
        // 出错时回退到本地模式，保证用户仍可点亮城市
        const urls = input.newFiles.map((file) => ({
          url: URL.createObjectURL(file),
          type: (file.type.startsWith('video/') ? 'video' : 'image') as 'image' | 'video',
        }))
        const memory_media = [...input.keptMedia, ...urls]
        const next = updateLocalFootprint(city.id, {
          has_memory: true,
          memory_note: input.note,
          memory_media,
          visit_count: city.has_memory ? city.visit_count : city.visit_count + 1,
          memory_count: city.has_memory ? city.memory_count : city.memory_count + 1,
        })
        setCities(next)
        return next.find((c) => c.id === city.id)!
      }
    },
    [couple],
  )

  const unlight = useCallback(
    async (city: FootprintCity) => {
      if (!isSupabaseConfigured || !couple) {
        const next = resetLocalFootprint(city.id)
        setCities(next)
        return next.find((c) => c.id === city.id)!
      }

      try {
        const updated = await unlightTripCity(city, couple.id)
        setCities((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
        return updated
      } catch (err) {
        console.error('unlightTripCity failed, fallback to local', err)
        const next = resetLocalFootprint(city.id)
        setCities(next)
        return next.find((c) => c.id === city.id)!
      }
    },
    [couple],
  )

  return { cities, loading, error, refresh, saveMemory, unlight }
}
