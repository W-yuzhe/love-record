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

export function mapMemory(m: any): Memory {
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
    if (!isSupabaseConfigured) {
      setMemories(getLocalMemories())
      setLoading(false)
      return
    }

    setLoading(true)
    // 所有回忆都已公开：未登录/无 couple 的访客也能读取
    const { data, error } = await supabase
      .from('memories')
      .select(`*, memory_locations(*), memory_media(*), memory_tags(tag)`)
      .eq('visibility', 'public')
      .order('date', { ascending: false })

    if (!error && data) {
      setMemories((data as any[]).map(mapMemory))
    } else if (error) {
      console.error('useMemories error', error)
      setMemories(getLocalMemories())
    }
    setLoading(false)
  }, [])

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
  const [memory, setMemory] = useState<Memory | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }

    const fallback = mockMemories.find((m) => m.id === id) || getLocalMemories().find((m) => m.id === id)

    if (!isSupabaseConfigured) {
      setMemory(fallback || null)
      setLoading(false)
      return
    }

    const fetch = async () => {
      setLoading(true)
      // 公开回忆详情：无需 couple/登录即可读取
      const { data, error } = await supabase
        .from('memories')
        .select(`*, memory_locations(*), memory_media(*), memory_tags(tag)`)
        .eq('id', id)
        .eq('visibility', 'public')
        .single()

      if (!error && data) {
        setMemory(mapMemory(data))
      } else {
        setMemory(fallback || null)
      }
      setLoading(false)
    }

    fetch()
  }, [id])

  return { memory, loading }
}
