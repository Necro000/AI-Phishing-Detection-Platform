/**
 * /api/history/route.ts — GET scan history for current authenticated user
 *
 * Architecture.md §4 (frozen):
 *   GET /api/history?limit=20&offset=0
 *   Response: { "scans": Scan[], "total": number } — current user's scans only.
 *
 * Edge cases:
 *  - Session check first (401 if unauthenticated)
 *  - Filter by user_id = auth.user.id (guaranteed tenant isolation)
 *  - Pagination bounds: limit clamped 1–100 (default 20), offset clamped >= 0
 *  - Empty history returns { scans: [], total: 0 }, not 404 or 500
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabaseServiceClient'

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch { /* ignore */ }
        },
      },
    }
  )

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined

  const { data: { user }, error: sessionError } = await sessionClient.auth.getUser(bearerToken)
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse pagination params
  const { searchParams } = new URL(request.url)
  const limitParam = parseInt(searchParams.get('limit') || '20', 10)
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10)

  const limit = isNaN(limitParam) ? 20 : Math.min(Math.max(limitParam, 1), 100)
  const offset = isNaN(offsetParam) ? 0 : Math.max(offsetParam, 0)

  // Query scans with count using service client for verified user.id
  const serviceClient = createServiceClient()
  const { data: scans, error, count } = await serviceClient
    .from('scans')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('[history] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to fetch scan history' }, { status: 500 })
  }

  return NextResponse.json(
    {
      scans: scans ?? [],
      total: count ?? 0,
    },
    { status: 200 }
  )
}

export async function DELETE(request: NextRequest) {
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
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            /* ignore */
          }
        },
      },
    }
  )

  const authHeader = request.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined

  const {
    data: { user },
    error: sessionError,
  } = await sessionClient.auth.getUser(bearerToken)

  if (sessionError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const scanId = searchParams.get('id')
  const clearAll = searchParams.get('all') === 'true'

  const serviceClient = createServiceClient()

  if (clearAll) {
    const { error } = await serviceClient
      .from('scans')
      .delete()
      .eq('user_id', user.id)

    if (error) {
      console.error('[history/delete-all] DB error:', error.message)
      return NextResponse.json({ error: 'Failed to clear scan history' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'All personal scan history cleared.' })
  }

  if (!scanId) {
    return NextResponse.json({ error: 'Scan ID or all=true parameter is required' }, { status: 400 })
  }

  // Delete specific scan belonging to this user
  const { error } = await serviceClient
    .from('scans')
    .delete()
    .eq('id', scanId)
    .eq('user_id', user.id)

  if (error) {
    console.error('[history/delete] DB error:', error.message)
    return NextResponse.json({ error: 'Failed to delete scan record' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Scan record deleted.' })
}
