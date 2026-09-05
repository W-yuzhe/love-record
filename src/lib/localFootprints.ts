import { chinaCities } from '@/data/chinaCities'
import type { FootprintCity } from '@/types'

const STORAGE_KEY = 'love-record-footprints'

export function getInitialCities(): FootprintCity[] {
  return chinaCities.map((c, i) => ({
    id: `city-${i}`,
    ...c,
    has_memory: false,
    memory_note: '',
    memory_media: [],
  }))
}

export function getLocalFootprints(): FootprintCity[] {
  if (typeof window === 'undefined') return getInitialCities()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getInitialCities()
    const parsed = JSON.parse(raw) as FootprintCity[]
    return parsed.length > 0 ? parsed : getInitialCities()
  } catch {
    return getInitialCities()
  }
}

export function saveLocalFootprints(cities: FootprintCity[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cities))
}

export function updateLocalFootprint(
  cityId: string,
  update: Partial<FootprintCity>,
): FootprintCity[] {
  const cities = getLocalFootprints()
  const next = cities.map((c) => (c.id === cityId ? { ...c, ...update } : c))
  saveLocalFootprints(next)
  return next
}

export function resetLocalFootprint(cityId: string): FootprintCity[] {
  const cities = getLocalFootprints()
  const next = cities.map((c) =>
    c.id === cityId
      ? {
          ...c,
          has_memory: false,
          memory_note: '',
          memory_media: [],
          memory_count: Math.max(0, c.memory_count - 1),
        }
      : c,
  )
  saveLocalFootprints(next)
  return next
}

export function clearLocalFootprints() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
