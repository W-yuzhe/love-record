import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { StardustNote } from '@/types'

const mockNotes: StardustNote[] = [
  {
    id: 's1',
    content: '第一次一起看日出，虽然云层很厚，但你在身边就够了。',
    author: '小A',
    x: 22,
    y: 28,
    color: '#FFB8D0',
    created_at: new Date().toISOString(),
  },
  {
    id: 's2',
    content: '你说想吃城北那家牛肉面，周末带你去。',
    author: '小B',
    x: 68,
    y: 35,
    color: '#A78BFA',
    created_at: new Date().toISOString(),
  },
  {
    id: 's3',
    content: '今天的星空特别亮，像你笑起来的眼睛。',
    author: '小A',
    x: 45,
    y: 62,
    color: '#FFE4A1',
    created_at: new Date().toISOString(),
  },
]

export function useStardustNotes() {
  const [notes, setNotes] = useState<StardustNote[]>(mockNotes)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('stardust_notes')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        setNotes(data as StardustNote[])
      }
      setLoading(false)
    }

    fetch()
  }, [])

  const addNote = async (note: Omit<StardustNote, 'id' | 'created_at'>) => {
    if (!isSupabaseConfigured) {
      const created: StardustNote = {
        ...note,
        id: `local-${Date.now()}`,
        created_at: new Date().toISOString(),
      }
      setNotes((prev) => [created, ...prev])
      return created
    }

    const { data, error } = await supabase.from('stardust_notes').insert(note as any).select().single()
    if (error) throw error
    const created = data as StardustNote
    setNotes((prev) => [created, ...prev])
    return created
  }

  return { notes, loading, addNote }
}
