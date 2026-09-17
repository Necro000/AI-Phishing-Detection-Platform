/**
 * /api/admin/users/route.ts — GET all users with scan counts
 *
 * Architecture.md §4 (frozen):
 *   Response: { "users": { id, email, role, scan_count }[] }
 *
 * Security: requireAdmin re-checks profiles.role from DB every request (Brain.md rule 5).
 * Sanitization: user emails are rendered in the admin UI — see AdminTable component.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServiceClient } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  // ── Role check (server-side, every request) ───────────────────────────────
  const { error } = await requireAdmin(request)
  if (error) return error

  try {
    const supabase = createServiceClient()

    // Join profiles (role) with auth.users (email) via admin API, then aggregate scan counts
    // Supabase admin listUsers gives us email; profiles gives us role.
    // We join these in JS since Supabase doesn't expose auth.users in regular SQL queries.

    // Step 1: Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, role, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) throw profilesError

    // Step 2: Get scan counts per user
    const { data: scanCounts, error: scanError } = await supabase
      .from('scans')
      .select('user_id')

    if (scanError) throw scanError

    const countByUser: Record<string, number> = {}
    for (const { user_id } of (scanCounts ?? [])) {
      countByUser[user_id] = (countByUser[user_id] ?? 0) + 1
    }

    // Step 3: Get emails from Supabase Auth admin API
    const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
      perPage: 1000, // sufficient for a project of this scale
    })

    if (authError) throw authError

    const emailById: Record<string, string> = {}
    for (const u of authData.users) {
      emailById[u.id] = u.email ?? '(no email)'
    }

    // Step 4: Combine
    const users = (profiles ?? []).map(p => ({
      id: p.id,
      email: emailById[p.id] ?? '(unknown)',
      role: p.role as string,
      scan_count: countByUser[p.id] ?? 0,
    }))

    return NextResponse.json({ users })
  } catch (err) {
    console.error('[admin/users] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
