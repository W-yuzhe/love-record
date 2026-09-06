import { supabase } from '@/lib/supabase'
import {
  addLocalMemory,
  generateLocalMedia,
  deleteLocalMemory,
  updateLocalMemory,
  updateLocalMemoryMedia,
  getLocalMemories,
} from '@/lib/localMemories'
import { isValidUUID } from '@/utils/uuid'
import type { Memory, MemoryMedia, MemoryMood, Visibility } from '@/types'

export interface LocationInput {
  name: string
  address?: string
  lat?: number
  lng?: number
  district?: string
  city?: string
}

export interface CreateMemoryInput {
  title: string
  date: string
  description?: string
  mood?: MemoryMood
  weather?: string
  visibility: Visibility
  locations: LocationInput[]
  tags: string[]
  files: File[]
}

export interface UpdateMemoryInput {
  title?: string
  date?: string
  description?: string
  mood?: MemoryMood
  weather?: string
  visibility?: Visibility
  locations?: LocationInput[]
  tags?: string[]
  newFiles?: File[]
  keptMedia?: { url: string; type: 'image' | 'video' }[]
}

export async function deleteMemory(memoryId: string, coupleId: string): Promise<void> {
  const supabaseConfigured = isSupabaseReallyConfigured()
  const canUseSupabase = supabaseConfigured && isValidUUID(memoryId) && isValidUUID(coupleId)

  if (!canUseSupabase) {
    deleteLocalMemory(memoryId)
    return
  }

  const { error } = await supabase.from('memories').delete().eq('id', memoryId).eq('couple_id', coupleId)
  if (error) throw error
}

function isSupabaseReallyConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  return Boolean(url && url !== 'http://localhost:54321')
}

export async function updateMemory(
  memoryId: string,
  input: UpdateMemoryInput,
  coupleId: string,
): Promise<Memory> {
  const supabaseConfigured = isSupabaseReallyConfigured()
  const canUseSupabase = supabaseConfigured && isValidUUID(memoryId) && isValidUUID(coupleId)

  const existing = updateLocalMemory(memoryId, {
    title: input.title,
    date: input.date,
    description: input.description,
    mood: input.mood,
    weather: input.weather,
    visibility: input.visibility,
    tags: input.tags,
  }).find((m) => m.id === memoryId)

  if (!canUseSupabase) {
    if (input.keptMedia || (input.newFiles && input.newFiles.length > 0)) {
      const kept: MemoryMedia[] = existing!.media.filter((m: MemoryMedia) =>
        input.keptMedia?.some((k) => k.url === m.url),
      )
      const newMedia: MemoryMedia[] = input.newFiles?.length
        ? await generateLocalMedia(input.newFiles)
        : []
      const merged: MemoryMedia[] = [...kept, ...newMedia].map(
        (m: MemoryMedia, idx) => ({ ...m, sort_order: idx }),
      )
      updateLocalMemoryMedia(memoryId, () => merged)
    }
    return getLocalMemories().find((m) => m.id === memoryId)!
  }

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .update({
      title: input.title,
      date: input.date,
      description: input.description,
      mood: input.mood,
      weather: input.weather,
      visibility: input.visibility,
    })
    .eq('id', memoryId)
    .eq('couple_id', coupleId)
    .select()
    .single()

  if (memoryError || !memory) throw memoryError || new Error('更新记忆失败')

  if (input.locations) {
    await supabase.from('memory_locations').delete().eq('memory_id', memoryId)
    if (input.locations.length > 0) {
      await supabase.from('memory_locations').insert(
        input.locations.map((loc, idx) => ({
          memory_id: memoryId,
          name: loc.name,
          address: loc.address,
          lat: loc.lat,
          lng: loc.lng,
          district: loc.district,
          city: loc.city,
          sort_order: idx,
        })),
      )
    }
  }

  if (input.tags) {
    await supabase.from('memory_tags').delete().eq('memory_id', memoryId)
    if (input.tags.length > 0) {
      await supabase.from('memory_tags').insert(input.tags.map((tag) => ({ memory_id: memoryId, tag })))
    }
  }

  if (input.newFiles && input.newFiles.length > 0) {
    const items = await Promise.all(
      input.newFiles.map(async (file, idx) => {
        const url = await uploadMemoryImage(file)
        const type: 'image' | 'video' | 'audio' = file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'image'
        return { memory_id: memoryId, url, type, sort_order: idx }
      }),
    )
    await supabase.from('memory_media').insert(items)
  }

  const { data: full, error: fullError } = await supabase
    .from('memories')
    .select(`*, memory_locations(*), memory_media(*), memory_tags(tag)`)
    .eq('id', memoryId)
    .single()

  if (fullError || !full) throw fullError || new Error('获取更新后记忆失败')
  return mapMemory(full)
}

export async function updateMemoryMedia(
  memoryId: string,
  mediaUpdater: (media: Memory['media']) => Memory['media'],
  coupleId: string,
): Promise<Memory> {
  const supabaseConfigured = isSupabaseReallyConfigured()
  const canUseSupabase = supabaseConfigured && isValidUUID(memoryId) && isValidUUID(coupleId)

  const existing = updateLocalMemoryMedia(memoryId, mediaUpdater).find((m) => m.id === memoryId)

  if (!canUseSupabase) {
    return existing!
  }

  // 读取当前 media
  const { data: current, error: currentError } = await supabase
    .from('memories')
    .select(`*, memory_media(*)`)
    .eq('id', memoryId)
    .eq('couple_id', coupleId)
    .single()

  if (currentError || !current) throw currentError || new Error('读取记忆失败')

  const nextMedia = mediaUpdater(current.memory_media || [])

  // 简单策略：删除旧 media，插入新 media（本地模式已保存，Supabase 端也同步）
  await supabase.from('memory_media').delete().eq('memory_id', memoryId)
  if (nextMedia.length > 0) {
    const { error: mediaError } = await supabase.from('memory_media').insert(
      nextMedia.map((m, idx) => ({
        memory_id: memoryId,
        url: m.url,
        type: m.type,
        sort_order: idx,
        note: m.note,
        likes: m.likes || 0,
        is_cover: m.is_cover || false,
      })),
    )
    if (mediaError) console.error('update media error', mediaError)
  }

  const { data: full, error: fullError } = await supabase
    .from('memories')
    .select(`*, memory_locations(*), memory_media(*), memory_tags(tag)`)
    .eq('id', memoryId)
    .single()

  if (fullError || !full) throw fullError || new Error('获取更新后记忆失败')
  return mapMemory(full)
}

export async function uploadMemoryImage(file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from('memory-photos').upload(path, file)
  if (error) throw error
  const { data: publicUrlData } = supabase.storage.from('memory-photos').getPublicUrl(data.path)
  return publicUrlData.publicUrl
}

export async function createMemory(
  input: CreateMemoryInput,
  userId: string,
  coupleId: string,
): Promise<Memory> {
  const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const now = new Date().toISOString()

  const localMedia = input.files.length > 0 ? await generateLocalMedia(input.files) : []

  const localMemory: Memory = {
    id,
    title: input.title,
    date: input.date,
    description: input.description,
    mood: input.mood,
    weather: input.weather,
    visibility: input.visibility,
    created_by: userId,
    created_at: now,
    updated_at: now,
    locations: input.locations.map((loc, idx) => ({
      id: `loc-${id}-${idx}`,
      memory_id: id,
      name: loc.name,
      address: loc.address,
      lat: loc.lat,
      lng: loc.lng,
      district: loc.district,
      city: loc.city,
    })),
    media: localMedia.map((m) => ({ ...m, memory_id: id })),
    tags: input.tags,
    completeness: 10,
    partner_status: 'both',
  }

  const supabaseConfigured = isSupabaseReallyConfigured()
  const canUseSupabase = supabaseConfigured && isValidUUID(userId) && isValidUUID(coupleId)

  if (!canUseSupabase) {
    // 本地模式：未配置 Supabase，或匿名登录未成功导致 ID 不是合法 UUID
    addLocalMemory(localMemory)
    return localMemory
  }

  const { data: memory, error: memoryError } = await supabase
    .from('memories')
    .insert({
      title: input.title,
      date: input.date,
      description: input.description,
      mood: input.mood,
      weather: input.weather,
      visibility: input.visibility,
      created_by: userId,
      couple_id: coupleId,
    })
    .select()
    .single()

  if (memoryError || !memory) throw memoryError || new Error('创建记忆失败')

  if (input.locations.length > 0) {
    const { error: locError } = await supabase.from('memory_locations').insert(
      input.locations.map((loc, idx) => ({
        memory_id: memory.id,
        name: loc.name,
        address: loc.address,
        lat: loc.lat,
        lng: loc.lng,
        district: loc.district,
        city: loc.city,
        sort_order: idx,
      })),
    )
    if (locError) console.error('insert locations error', locError)
  }

  if (input.tags.length > 0) {
    const { error: tagError } = await supabase.from('memory_tags').insert(
      input.tags.map((tag) => ({ memory_id: memory.id, tag })),
    )
    if (tagError) console.error('insert tags error', tagError)
  }

  if (input.files.length > 0) {
    const items = await Promise.all(
      input.files.map(async (file, idx) => {
        const url = await uploadMemoryImage(file)
        const type: 'image' | 'video' | 'audio' = file.type.startsWith('video/')
          ? 'video'
          : file.type.startsWith('audio/')
            ? 'audio'
            : 'image'
        return { memory_id: memory.id, url, type, sort_order: idx }
      }),
    )
    const { error: mediaError } = await supabase.from('memory_media').insert(items)
    if (mediaError) console.error('insert media error', mediaError)
  }

  return mapMemory(memory)
}

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
