export interface User {
  id: string
  email: string
  nickname: string
  avatar_url?: string
  created_at: string
}

export interface Couple {
  id: string
  partner_a_id: string
  partner_b_id: string
  start_date: string
  couple_name?: string
  created_at: string
}

export interface Location {
  id: string
  memory_id: string
  name: string
  address?: string
  lat?: number
  lng?: number
  district?: string
  city?: string
}

export interface MemoryMedia {
  id: string
  memory_id: string
  url: string
  type: 'image' | 'video' | 'audio'
  sort_order: number
  note?: string
  likes?: number
  is_cover?: boolean
}

export type MemoryMood = 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'night'
export type Visibility = 'private' | 'couple' | 'public'

export interface Memory {
  id: string
  title: string
  date: string
  description?: string
  mood?: MemoryMood
  weather?: string
  visibility: Visibility
  created_by: string
  created_at: string
  updated_at: string
  locations: Location[]
  media: MemoryMedia[]
  tags?: string[]
  completeness?: number
  partner_status?: 'both' | 'waiting_for_partner' | 'waiting_for_me'
}

export interface Wish {
  id: string
  title: string
  category: 'travel' | 'food' | 'life' | 'growth' | 'other'
  description?: string
  is_achieved: boolean
  achieved_date?: string
  related_memory_id?: string
  created_at: string
}

export interface FootprintCity {
  id: string
  name: string
  visit_count: number
  memory_count: number
  lat: number
  lng: number
  has_memory?: boolean
  memory_note?: string
  memory_media?: { url: string; type: 'image' | 'video' }[]
}

export interface DailyQA {
  id: string
  question: string
  partner_a_answer?: string
  partner_b_answer?: string
  date: string
}

export interface StardustNote {
  id: string
  content: string
  author?: string
  x: number
  y: number
  color?: string
  created_at: string
}
