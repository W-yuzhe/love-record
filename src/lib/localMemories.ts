import { mockMemories } from '@/data/mock'
import { fileToBase64, fileType } from '@/utils/file'
import type { Memory, MemoryMedia } from '@/types'

const STORAGE_KEY = 'love-record-memories'

export function getLocalMemories(): Memory[] {
  if (typeof window === 'undefined') return mockMemories
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return mockMemories
    const parsed = JSON.parse(raw) as Memory[]
    if (parsed.length === 0) return mockMemories
    // 统一将本地回忆可见性设为公开，确保现有数据也能被访客浏览
    const normalized = parsed.map((m) =>
      m.visibility === 'public' ? m : { ...m, visibility: 'public' as const },
    )
    if (normalized.some((m, i) => m.visibility !== parsed[i].visibility)) {
      saveLocalMemories(normalized)
    }
    return normalized
  } catch {
    return mockMemories
  }
}

export function saveLocalMemories(memories: Memory[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(memories))
}

export function addLocalMemory(memory: Memory) {
  const memories = getLocalMemories()
  memories.unshift(memory)
  saveLocalMemories(memories)
  return memory
}

export function deleteLocalMemory(memoryId: string): Memory[] {
  const memories = getLocalMemories()
  const next = memories.filter((m) => m.id !== memoryId)
  saveLocalMemories(next)
  return next
}

export function updateLocalMemory(memoryId: string, updates: Partial<Memory>): Memory[] {
  const memories = getLocalMemories()
  const next = memories.map((m) =>
    m.id === memoryId ? { ...m, ...updates, updated_at: new Date().toISOString() } : m,
  )
  saveLocalMemories(next)
  return next
}

export function updateLocalMemoryMedia(
  memoryId: string,
  mediaUpdater: (media: MemoryMedia[]) => MemoryMedia[],
): Memory[] {
  const memories = getLocalMemories()
  const next = memories.map((m) => {
    if (m.id !== memoryId) return m
    return {
      ...m,
      media: mediaUpdater(m.media),
      updated_at: new Date().toISOString(),
    }
  })
  saveLocalMemories(next)
  return next
}

export async function generateLocalMedia(files: File[]): Promise<MemoryMedia[]> {
  const results = await Promise.all(
    files.map(async (file, idx) => {
      const url = await fileToBase64(file)
      return {
        id: `local-media-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        memory_id: '',
        url,
        type: fileType(file),
        sort_order: idx,
      } as MemoryMedia
    }),
  )
  return results
}

export function clearLocalMemories() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(STORAGE_KEY)
}
