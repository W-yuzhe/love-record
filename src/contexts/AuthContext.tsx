import { createContext, useContext, useEffect, useState } from 'react'
import type { User, Session, AuthError } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { siteConfig } from '@/data/mock'

interface Profile {
  id: string
  email: string
  nickname: string
  avatar_url?: string
}

interface Couple {
  id: string
  partner_a_id: string
  partner_b_id?: string | null
  start_date: string
  couple_name?: string
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  couple: Couple | null
  loading: boolean
  authReady: boolean
  authError: AuthError | null
  signInAnonymously: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  couple: null,
  loading: true,
  authReady: false,
  authError: null,
  signInAnonymously: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [couple, setCouple] = useState<Couple | null>(null)
  const [loading, setLoading] = useState(true)
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState<AuthError | null>(null)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      setAuthReady(true)
      return
    }

    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session && isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInAnonymously()
        if (mounted) {
          if (error) {
            console.error('匿名登录失败', error)
            setAuthError(error)
          } else {
            setSession(data.session)
          }
          setAuthReady(true)
        }
      } else if (mounted) {
        setSession(session)
        setAuthReady(true)
      }
      if (mounted) setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setSession(session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session?.user) {
      setProfile(null)
      setCouple(null)
      return
    }

    let cancelled = false

    const ensureProfile = async (user: User) => {
      const nickname =
        user.user_metadata?.nickname || siteConfig.partnerA
      // 匿名用户没有 email，生成唯一占位邮箱避免 profiles.email UNIQUE 冲突
      const email = user.email || `anonymous-${user.id}@local`
      const upsert = {
        id: user.id,
        email,
        nickname,
        avatar_url: user.user_metadata?.avatar_url,
      }
      const { data, error } = await supabase
        .from('profiles')
        .upsert(upsert)
        .select()
        .single()
      if (error) {
        console.error('ensureProfile error', error)
        return null
      }
      return data as Profile
    }

    const ensureCouple = async (userId: string) => {
      const { data: existing } = await supabase
        .from('couples')
        .select('*')
        .or(`partner_a_id.eq.${userId},partner_b_id.eq.${userId}`)
        .single()

      if (existing) return existing as Couple

      const { data, error } = await supabase
        .from('couples')
        .insert({
          partner_a_id: userId,
          start_date: siteConfig.startDate,
          couple_name: siteConfig.name,
        })
        .select()
        .single()

      if (error) {
        console.error('ensureCouple error', error)
        return null
      }
      return data as Couple
    }

    ;(async () => {
      const [p, c] = await Promise.all([
        ensureProfile(session.user),
        ensureCouple(session.user.id),
      ])
      if (!cancelled) {
        setProfile(p)
        setCouple(c)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [session])

  const signInAnonymously = async () => {
    const { error } = await supabase.auth.signInAnonymously()
    if (error) {
      setAuthError(error)
      throw error
    }
    setAuthError(null)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user: session?.user || null,
        profile,
        couple,
        loading,
        authReady,
        authError,
        signInAnonymously,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
