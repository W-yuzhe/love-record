/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SITE_NAME: string
  readonly VITE_PARTNER_A_NICKNAME: string
  readonly VITE_PARTNER_B_NICKNAME: string
  readonly VITE_LOVE_START_DATE: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_TENCENT_MAP_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
