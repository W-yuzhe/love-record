import { supabase } from '@/lib/supabase'
import { uploadMemoryImage } from './memories'
import { isValidUUID } from '@/utils/uuid'
import type { FootprintCity } from '@/types'

export interface TripMemoryInput {
  note: string
  newFiles: File[]
  keptMedia: { url: string; type: 'image' | 'video' }[]
}

function isSupabaseReallyConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  return Boolean(url && url !== 'http://localhost:54321')
}

export async function uploadTripMedia(file: File): Promise<string> {
  return uploadMemoryImage(file)
}

export async function unlightTripCity(city: FootprintCity, coupleId: string): Promise<FootprintCity> {
  if (!isSupabaseReallyConfigured() || !isValidUUID(coupleId)) {
    throw new Error('Supabase 未配置或伴侣关系未就绪，请使用本地模式')
  }

  const update = {
    has_memory: false,
    memory_note: '',
    memory_media: [],
    memory_count: Math.max(0, city.memory_count - 1),
  }

  const { data, error } = await supabase
    .from('footprint_cities')
    .update(update)
    .eq('id', city.id)
    .eq('couple_id', coupleId)
    .select()
    .single()

  if (error || !data) throw error || new Error('取消点亮失败')
  return data as FootprintCity
}

export async function saveTripMemory(
  city: FootprintCity,
  input: TripMemoryInput,
  coupleId: string,
): Promise<FootprintCity> {
  if (!isSupabaseReallyConfigured() || !isValidUUID(coupleId)) {
    throw new Error('Supabase 未配置或伴侣关系未就绪，请使用本地模式')
  }

  const newUrls: { url: string; type: 'image' | 'video' }[] = []
  for (const file of input.newFiles) {
    const url = await uploadTripMedia(file)
    newUrls.push({ url, type: file.type.startsWith('video/') ? 'video' : 'image' })
  }

  const memory_media = [...input.keptMedia, ...newUrls]

  const update = {
    has_memory: true,
    memory_note: input.note,
    memory_media,
    visit_count: city.has_memory ? city.visit_count : city.visit_count + 1,
    memory_count: city.has_memory ? city.memory_count : city.memory_count + 1,
  }

  const { data, error } = await supabase
    .from('footprint_cities')
    .update(update)
    .eq('id', city.id)
    .eq('couple_id', coupleId)
    .select()
    .single()

  if (error || !data) throw error || new Error('保存足迹记忆失败')
  return data as FootprintCity
}

export async function ensureFootprintCities(
  coupleId: string,
  cities: Omit<FootprintCity, 'id'>[],
): Promise<FootprintCity[]> {
  if (!isValidUUID(coupleId)) {
    throw new Error('伴侣关系 ID 无效')
  }

  const { data: existing } = await supabase
    .from('footprint_cities')
    .select('*')
    .eq('couple_id', coupleId)

  const existingNames = new Set((existing || []).map((c) => c.name))
  const toInsert = cities
    .filter((c) => !existingNames.has(c.name))
    .map((c) => ({ ...c, couple_id: coupleId }))

  if (toInsert.length > 0) {
    const { error } = await supabase.from('footprint_cities').insert(toInsert)
    if (error) console.error('ensureFootprintCities insert error', error)
  }

  const { data, error } = await supabase
    .from('footprint_cities')
    .select('*')
    .eq('couple_id', coupleId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []) as FootprintCity[]
}
