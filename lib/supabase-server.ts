import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import {
  getSupabasePublicEnv,
  getSupabaseServiceRoleKey,
  SUPABASE_ENV_HELP,
} from '@/lib/supabase-env'

export function createSupabaseServer() {
  const env = getSupabasePublicEnv()
  if (!env) {
    throw new Error(`Invalid Supabase configuration. ${SUPABASE_ENV_HELP}`)
  }

  const cookieStore = cookies()

  return createServerClient(
    env.url,
    env.publicKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll puede fallar en Server Components de solo lectura; se ignora
          }
        },
      },
    }
  )
}

export function createSupabaseServerAdmin() {
  const env = getSupabasePublicEnv()
  const serviceKey = getSupabaseServiceRoleKey()
  if (!env || !serviceKey) {
    throw new Error(`Invalid Supabase configuration. ${SUPABASE_ENV_HELP} Also set SUPABASE_SERVICE_ROLE_KEY for admin client.`)
  }

  const cookieStore = cookies()

  return createServerClient(
    env.url,
    serviceKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignorar en SC de solo lectura
          }
        },
      },
    }
  )
}
