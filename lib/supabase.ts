'use client'

import { createBrowserClient } from '@supabase/ssr'

import { getSupabasePublicEnv, SUPABASE_ENV_HELP } from '@/lib/supabase-env'

export function createClient() {
  const env = getSupabasePublicEnv()
  if (!env) {
    throw new Error(`Invalid Supabase configuration. ${SUPABASE_ENV_HELP}`)
  }
  return createBrowserClient(env.url, env.publicKey)
}

// Singleton para componentes cliente
let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createClient()
  }
  return browserClient
}
