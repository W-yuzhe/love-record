import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockMemories } from '@/data/mock'
import {
  getLocalMemories,
  deleteLocalMemory,
  updateLocalMemory,
  updateLocalMemoryMedia,
} from '@/lib/localMemories'
import { useAuth } from '@/contexts/AuthContext'
import type { Memory } from '@/types'
import {
  deleteMemory as deleteMemoryApi,
  updateMemory as updateMemoryApi,
  updateMemoryMedia as updateMemoryMediaApi,
} from '@/api/memories'
import type { UpdateMemoryInput } from '@/api/memories'

function mapMemory(m: any): Memory {
  return {
    ...m,
    locations: m.memory_locations || [],
    media: m.memory_media || [],
    tags: (m.memory_tags || []).map((t: { tag: string }) => t.tag),
    completeness: 0,
    partner_status: 'both',
  }
}

export function useMemories() {
  const { couple } = useAuth()
  const [memories, setMemories] = useState<Memory[]>(getLocalMemories())
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!isSupabaseConfigured || !couple) {
      setMemories(getLocalMemories())
      setLoading(false)
      return
    }

    setLoading(true)
    const { data, error } = await supabase
      .from('memories')
      .select(`*, memory_locations(*), memory_media(*), memory_tags(tag)`)
      .eq('couple_id', couple.id)
      .order('date', { ascending: false })

    if (!error && data) {
      setMemories((data as any[]).map(mapMemory))
    } else if (error) {
      console.error('useMemories error', error)
      setMemories(getLocalMemories())
    }
    setLoading(false)
  }, [couple])

  useEffect(() => {
    refresh()
  }, [refresh])

  const deleteMemory = useCallback(
    async (memoryId: string) => {
      if (!isSupabaseConfigured || !couple) {
        const next = deleteLocalMemory(memoryId)
        setMemories(next)
        return
      }

      try {
        await deleteMemoryApi(memoryId, couple.id)
        setMemories((prev) => prev.filter((m) => m.id !== memoryId))
      } catch (err) {
        console.error('deleteMemory failed, fallback to local', err)
        const next = deleteLocalMemory(memoryId)
        setMemories(next)
      }
    },
    [couple],
  )

  const updateMemory = useCallback(
    async (memoryId: string, input: UpdateMemoryInput) => {
      if (!isSupabaseConfigured || !couple) {
        const next = updateLocalMemory(memoryId, {
          title: input.title,
          date: input.date,
          description: input.description,
          mood: input.mood,
          weather: input.weather,
          visibility: input.visibility,
          tags: input.tags,
        })
        setMemories(next)
        return
      }

      try {
        await updateMemoryApi(memoryId, input, couple.id)
        await refresh()
      } catch (err) {
        console.error('updateMemory failed, fallback to local', err)
        const next = updateLocalMemory(memoryId, {
          title: input.title,
          date: input.date,
          description: input.description,
          mood: input.mood,
          weather: input.weather,
          visibility: input.visibility,
          tags: input.tags,
        })
        setMemories(next)
      }
    },
    [couple, refresh],
  )

  const updateMemoryMedia = useCallback(
    async (memoryId: string, mediaUpdater: (media: Memory['media']) => Memory['media']) => {
      if (!isSupabaseConfigured || !couple) {
        const next = updateLocalMemoryMedia(memoryId, mediaUpdater)
        setMemories(next)
        return
      }

      try {
        await updateMemoryMediaApi(memoryId, mediaUpdater, couple.id)
        await refresh()
      } catch (err) {
        console.error('updateMemoryMedia failed, fallback to local', err)
        const next = updateLocalMemoryMedia(memoryId, mediaUpdater)
        setMemories(next)
      }
    },
    [couple, refresh],
  )

  return { memories, loading, refresh, deleteMemory, updateMemory, updateMemoryMedia }
}

export function useMemory(id?: string) {
  const { couple } = useAuth()
  const [memory, setMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fallback = mockMemories.find((m) => m.id === id) || getLocalMemories().find((m) => m.id === id)

    if (!isSupabaseConfigured || !couple) {
      setMemory(fallback || null)
      setLoading(false)
      return
    }

    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('memories')
        .select(`*, memory_locations(*), memory_media(*), memory_tags(tag)`)
        .eq('id', id)
        .eq('couple_id', couple.id)
        .single()

      if (!error && data) {
        setMemory(mapMemory(data))
      } else {
        setMemory(fallback || null)
      }
      setLoading(false)
    }

    fetch()
  }, [id, couple])

  return { memory, loading }
}
