/**
 * Reads and validates Supabase env for clients and server admin.
 * Public keys: publishable (new) or JWT anon (legacy). Service role uses the same trim/quote rules.
 */

function trimQuoted(s: string | undefined): string | undefined {
  const t = s?.trim()
  if (!t) return undefined
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1).trim()
  }
  return t
}

function isValidHttpUrl(s: string): boolean {
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Docs often show `https://[project-ref].supabase.co`; literal brackets are invalid in URLs.
 * Strip them when the segment looks like a Supabase project ref.
 */
function normalizeSupabaseUrl(url: string): string {
  return url.replace(/\[([a-zA-Z0-9._-]+)\]/g, '$1')
}

/** Publishable key (sb_publishable_…) or legacy anon JWT — both work with @supabase/ssr clients. */
function resolvePublicSupabaseKey(): string | undefined {
  const publishable = trimQuoted(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
  const anon = trimQuoted(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  return publishable || anon
}

export type SupabasePublicEnv = { url: string; publicKey: string }

export function getSupabasePublicEnv(): SupabasePublicEnv | null {
  const rawUrl = trimQuoted(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const publicKey = resolvePublicSupabaseKey()
  if (!rawUrl || !publicKey) return null
  const url = normalizeSupabaseUrl(rawUrl)
  if (!isValidHttpUrl(url)) return null
  return { url, publicKey }
}

/** Server-only secret; same trimming rules as public keys (handles quoted .env values). */
export function getSupabaseServiceRoleKey(): string | undefined {
  return trimQuoted(process.env.SUPABASE_SERVICE_ROLE_KEY)
}

export const SUPABASE_ENV_HELP =
  'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Dashboard → Settings → API; recommended) or NEXT_PUBLIC_SUPABASE_ANON_KEY (legacy JWT anon).'
