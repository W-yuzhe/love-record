import { useEffect, useState } from 'react'

const STORAGE_KEY = 'experience-background'

export interface ExperienceBackground {
  type: 'url' | 'base64' | null
  value: string
}

export function useExperienceBackground() {
  const [background, setBackgroundState] = useState<ExperienceBackground>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed && (parsed.type === 'url' || parsed.type === 'base64')) {
          return parsed as ExperienceBackground
        }
      }
    } catch {
      // ignore parse errors
    }
    return { type: null, value: '' }
  })

  useEffect(() => {
    try {
      if (background.type && background.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(background))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore quota errors
    }
  }, [background])

  const setBackground = (type: 'url' | 'base64', value: string) => {
    setBackgroundState({ type, value })
  }

  const clearBackground = () => {
    setBackgroundState({ type: null, value: '' })
  }

  return { background, setBackground, clearBackground }
}
