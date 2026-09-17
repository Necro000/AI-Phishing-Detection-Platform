/**
 * requireAdmin.ts
 *
 * Server-side admin role gate. Import and call at the TOP of every /api/admin/* route handler.
 * Re-checks profiles.role = 'admin' from the DB on EVERY request — never trusts a client-side
 * claim, never caches "is admin" across requests (Brain.md rule 5).
 *
 * Usage in a route handler:
 *   const { error } = await requireAdmin(request)
 *   if (error) return error  // already a NextResponse with 401/403
 *
 * Returns { userId, error: null } on success, { userId: null, error: NextResponse } on failure.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabaseClient'

export async function requireAdmin(
  request: NextRequest
): Promise<{ userId: string; error: null } | { userId: null; error: NextResponse }> {
  // Step 1: Read the user's session from the request cookies (anon-scoped, for auth only)
  const cookieStore = await cookies()

  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Route handlers can't set cookies; we only need to read session here
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore — setting cookies in Route Handlers is fine; ignore if it fails
          }
        },
      },
    }
  )

  const {
    data: { user },
    error: sessionError,
  } = await sessionClient.auth.getUser()

  if (sessionError || !user) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // Step 2: Re-check role from profiles table using the service-role client
  // (not the session client — we don't want RLS to filter it if the profile row
  // doesn't match the user's own auth.uid(), which would be a bug, not a feature)
  const serviceClient = createServiceClient()

  const { data: profile, error: profileError } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Forbidden: profile not found' }, { status: 403 }),
    }
  }

  if (profile.role !== 'admin') {
    return {
      userId: null,
      error: NextResponse.json({ error: 'Forbidden: admin only' }, { status: 403 }),
    }
  }

  return { userId: user.id, error: null }
}
