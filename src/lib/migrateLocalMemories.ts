import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { getLocalMemories } from '@/lib/localMemories'
import type { MemoryMedia } from '@/types'

function generateUUID(): string {
  if (typeof window !== 'undefined' && 'crypto' in window && 'randomUUID' in window.crypto) {
    return window.crypto.randomUUID()
  }
  // fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export interface MigrationResult {
  migrated: number
  errors: string[]
}

export async function migrateLocalMemories(
  userId: string,
  coupleId: string,
): Promise<MigrationResult> {
  if (!isSupabaseConfigured || !userId || !coupleId) {
    throw new Error('Supabase 未配置或用户信息不完整')
  }

  const localMemories = getLocalMemories()
  if (localMemories.length === 0) {
    return { migrated: 0, errors: [] }
  }

  const errors: string[] = []
  let migrated = 0

  for (const memory of localMemories) {
    try {
      const memoryId = generateUUID()
      const now = new Date().toISOString()

      const { error: memoryError } = await supabase.from('memories').insert({
        id: memoryId,
        title: memory.title || '未命名回忆',
        date: memory.date || now.slice(0, 10),
        description: memory.description,
        mood: memory.mood,
        weather: memory.weather,
        visibility: memory.visibility || 'private',
        created_by: userId,
        couple_id: coupleId,
        created_at: memory.created_at || now,
        updated_at: memory.updated_at || now,
      })

      if (memoryError) {
        errors.push(`「${memory.title}」创建失败：${memoryError.message}`)
        continue
      }

      if (memory.locations?.length) {
        const { error: locError } = await supabase.from('memory_locations').insert(
          memory.locations.map((loc, idx) => ({
            memory_id: memoryId,
            name: loc.name || '',
            address: loc.address,
            lat: loc.lat,
            lng: loc.lng,
            district: loc.district,
            city: loc.city,
            sort_order: idx,
          })),
        )
        if (locError) {
          console.error('migrate locations error', locError)
        }
      }

      if (memory.tags?.length) {
        const { error: tagError } = await supabase.from('memory_tags').insert(
          memory.tags.map((tag) => ({ memory_id: memoryId, tag })),
        )
        if (tagError) {
          console.error('migrate tags error', tagError)
        }
      }

      if (memory.media?.length) {
        const { error: mediaError } = await supabase.from('memory_media').insert(
          memory.media.map((m: MemoryMedia, idx) => ({
            memory_id: memoryId,
            url: m.url,
            type: ['image', 'video', 'audio'].includes(m.type) ? m.type : 'image',
            sort_order: idx,
            note: m.note,
            likes: m.likes || 0,
            is_cover: m.is_cover || false,
          })),
        )
        if (mediaError) {
          console.error('migrate media error', mediaError)
        }
      }

      migrated += 1
    } catch (err) {
      errors.push(`「${memory.title || '未命名'}」异常：${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return { migrated, errors }
}
