const STORAGE_KEY = 'love-record-month-covers'

export function getLocalMonthCovers(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function setLocalMonthCover(monthKey: string, url: string): Record<string, string> {
  const covers = getLocalMonthCovers()
  covers[monthKey] = url
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(covers))
  }
  return covers
}

export function getLocalMonthCover(monthKey: string): string | undefined {
  return getLocalMonthCovers()[monthKey]
}
