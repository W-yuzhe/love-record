import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase 配置缺失：请复制 .env.example 为 .env 并填入 VITE_SUPABASE_URL 与 VITE_SUPABASE_ANON_KEY。当前使用本地 Mock 数据运行。',
  )
}

export const supabase = createClient<any>(
  supabaseUrl || 'http://localhost:54321',
  supabaseAnonKey || 'mock-key',
)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)
