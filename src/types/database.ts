export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          nickname: string
          avatar_url?: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      couples: {
        Row: {
          id: string
          partner_a_id: string
          partner_b_id: string
          start_date: string
          couple_name?: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['couples']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['couples']['Insert']>
      }
      memories: {
        Row: {
          id: string
          title: string
          date: string
          description?: string
          mood?: string
          weather?: string
          visibility: string
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['memories']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['memories']['Insert']>
      }
      memory_locations: {
        Row: {
          id: string
          memory_id: string
          name: string
          address?: string
          lat?: number
          lng?: number
          district?: string
          city?: string
        }
        Insert: Omit<Database['public']['Tables']['memory_locations']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['memory_locations']['Insert']>
      }
      memory_media: {
        Row: {
          id: string
          memory_id: string
          url: string
          type: string
          sort_order: number
        }
        Insert: Omit<Database['public']['Tables']['memory_media']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['memory_media']['Insert']>
      }
      wishlists: {
        Row: {
          id: string
          title: string
          category: string
          description?: string
          is_achieved: boolean
          achieved_date?: string
          related_memory_id?: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['wishlists']['Row'], 'created_at' | 'id'>
        Update: Partial<Database['public']['Tables']['wishlists']['Insert']>
      }
      footprint_cities: {
        Row: {
          id: string
          name: string
          visit_count: number
          memory_count: number
          lat: number
          lng: number
          has_memory?: boolean
          memory_note?: string
          memory_media?: { url: string; type: string }[]
        }
        Insert: Omit<Database['public']['Tables']['footprint_cities']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['footprint_cities']['Insert']>
      }
      daily_qa: {
        Row: {
          id: string
          question: string
          partner_a_answer?: string
          partner_b_answer?: string
          date: string
        }
        Insert: Omit<Database['public']['Tables']['daily_qa']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['daily_qa']['Insert']>
      }
      stardust_notes: {
        Row: {
          id: string
          content: string
          author?: string
          x: number
          y: number
          color?: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['stardust_notes']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['stardust_notes']['Insert']>
      }
    }
  }
}
