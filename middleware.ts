import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import {
  getSupabasePublicEnv,
  SUPABASE_ENV_HELP,
} from '@/lib/supabase-env'

export async function middleware(request: NextRequest) {
  const env = getSupabasePublicEnv()
  if (!env) {
    if (process.env.NODE_ENV === 'development') {
      console.error(`[middleware] ${SUPABASE_ENV_HELP}`)
      return NextResponse.next({ request })
    }
    throw new Error(`Invalid Supabase configuration. ${SUPABASE_ENV_HELP}`)
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    env.url,
    env.publicKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const publicPaths = ['/login', '/auth/callback']
  const isPublic = publicPaths.some((p) => pathname.startsWith(p))

  if (!user && !isPublic) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
