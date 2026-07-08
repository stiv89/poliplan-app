import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '@/config/env'

let client: SupabaseClient | null = null

export function getSupabaseClient(): SupabaseClient | null {
  if (!env.isSupabaseConfigured) {
    return null
  }

  if (!client) {
    client = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY)
  }

  return client
}
