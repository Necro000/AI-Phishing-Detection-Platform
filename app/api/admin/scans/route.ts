/**
 * /api/admin/scans/route.ts — GET all scans (Reports view)
 *
 * Architecture.md §4 (frozen):
 *   GET /api/admin/scans?limit=50&offset=0
 *   Response: { "scans": Scan[], "total": number } — all users, joined with user email
 *
 * Context.md §4: Reports = admin view over scans table (not a separate table).
 * Security: requireAdmin re-checks profiles.role from DB every request (Brain.md rule 5).
 * Pagination: required (Edge-Cases.md: admin all-scans view growing large → paginate).
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServiceClient } from '@/lib/supabaseServiceClient'

const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

export async function GET(request: NextRequest) {
  // ── Role check ─────────────────────────────────────────────────────────────
  const { error } = await requireAdmin(request)
  if (error) return error

  // ── Pagination params ──────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const limit = Math.min(
    parseInt(searchParams.get('limit') ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  )
  const offset = Math.max(parseInt(searchParams.get('offset') ?? '0', 10) || 0, 0)

  try {
    const supabase = createServiceClient()

    // Get paginated scans (all users — service-role bypasses RLS)
    const { data: scans, error: scansError, count } = await supabase
      .from('scans')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (scansError) throw scansError

    // Get emails for the user_ids that appear in this page
    const userIds = [...new Set((scans ?? []).map(s => s.user_id as string))]
    const emailById: Record<string, string> = {}

    if (userIds.length > 0) {
      const { data: authData } = await supabase.auth.admin.listUsers({ perPage: 1000 })
      for (const u of authData?.users ?? []) {
        if (userIds.includes(u.id)) {
          emailById[u.id] = u.email ?? '(no email)'
        }
      }
    }

    // Attach user email to each scan row
    const scansWithEmail = (scans ?? []).map(scan => ({
      ...scan,
      user_email: emailById[scan.user_id as string] ?? '(unknown)',
    }))

    return NextResponse.json({
      scans: scansWithEmail,
      total: count ?? 0,
    })
  } catch (err) {
    console.error('[admin/scans] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch scans' }, { status: 500 })
  }
}
