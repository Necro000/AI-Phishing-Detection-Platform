/**
 * proxy.ts  (formerly middleware.ts — renamed for Next.js 16 compatibility)
 *
 * Protects route groups:
 *  - /(app)/*  → requires any authenticated session → redirect to /login
 *  - /(admin)/* → requires authenticated session → redirect to /login
 *    (role check is NOT done here — Edge runtime can't query Postgres efficiently;
 *     requireAdmin.ts does the actual role re-check inside each /api/admin/* handler,
 *     and admin page Server Components also re-check role directly)
 *
 * Why split: proxy runs on the Edge runtime — session presence is fast (cookie decode).
 * Role check is done server-side in the API route / Server Component (Brain.md rule 5).
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const hasValidSupabase =
    Boolean(supabaseUrl &&
    (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://')) &&
    supabaseAnonKey &&
    supabaseAnonKey !== 'your-supabase-anon-key')

  const { pathname } = request.nextUrl

  // Protected routes: /dashboard, /scan/*, /admin/*
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/scan') ||
    pathname.startsWith('/admin')

  if (!hasValidSupabase) {
    if (isProtected) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session — required per @supabase/ssr docs to keep session alive
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (isProtected && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static, _next/image, favicon.ico, public assets
     * - api routes (those handle their own auth via requireAdmin / session check)
     *   Excluding api/ is critical: the middleware calls createServerClient which
     *   requires a valid NEXT_PUBLIC_SUPABASE_URL — if that var is unset the
     *   middleware crashes with a 500 before API route handlers ever run.
     *   API routes do their own session check (401) and requireAdmin (403) internally.
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
