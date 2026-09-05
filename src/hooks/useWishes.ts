import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { mockWishes } from '@/data/mock'
import { useAuth } from '@/contexts/AuthContext'
import type { Wish } from '@/types'

export function useWishes() {
  const { couple } = useAuth()
  const [wishes, setWishes] = useState<Wish[]>(mockWishes)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured || !couple) {
      setLoading(false)
      return
    }

    const fetch = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('couple_id', couple.id)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setWishes(data as Wish[])
      } else if (error) {
        console.error('useWishes error', error)
      }
      setLoading(false)
    }

    fetch()
  }, [couple])

  return { wishes, loading }
}
