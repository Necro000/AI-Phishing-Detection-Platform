/**
 * /api/admin/keywords/route.ts — GET all keywords & POST new keyword
 *
 * Architecture.md §4 & Day 3 Track B:
 *  - requireAdmin re-checks profiles.role from DB on every request.
 *  - POST validation:
 *      * keyword: non-empty string, trimmed, lowercase
 *      * weight: integer 1–40 (Architecture.md §4: a single keyword can push into SUSPICIOUS
 *        [30–69] but can NEVER unilaterally force HIGH_RISK [70–100])
 *      * category: non-empty string (free-text forward-compatible, categories.ts is suggested only)
 *      * duplicate keyword check: 409 Conflict
 *  - Stores created_by: user.id
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServiceClient } from '@/lib/supabaseServiceClient'

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const serviceClient = createServiceClient()
  const { data: keywords, error: dbError } = await serviceClient
    .from('keywords')
    .select('*')
    .order('weight', { ascending: false })

  if (dbError) {
    console.error('[admin/keywords] GET error:', dbError.message)
    return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 })
  }

  return NextResponse.json({ keywords: keywords ?? [] }, { status: 200 })
}

export async function POST(request: NextRequest) {
  const { userId, error } = await requireAdmin(request)
  if (error) return error

  let body: { keyword?: unknown; weight?: unknown; category?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawKeyword = typeof body.keyword === 'string' ? body.keyword.trim().toLowerCase() : ''
  const weightNum = Number(body.weight)
  const rawCategory = typeof body.category === 'string' ? body.category.trim() : ''

  // Validation 1: keyword
  if (!rawKeyword) {
    return NextResponse.json({ error: 'Keyword must be a non-empty string' }, { status: 400 })
  }

  // Validation 2: weight (1–40 capped per Architecture.md §4)
  if (!Number.isInteger(weightNum) || weightNum < 1 || weightNum > 40) {
    return NextResponse.json(
      { error: 'Weight must be an integer between 1 and 40 (single keywords cannot force HIGH_RISK)' },
      { status: 400 }
    )
  }

  // Validation 3: category (free-text string, no enum constraint per Architecture.md §4)
  if (!rawCategory) {
    return NextResponse.json({ error: 'Category must be a non-empty string' }, { status: 400 })
  }

  const serviceClient = createServiceClient()

  // Validation 4: duplicate check
  const { data: existing } = await serviceClient
    .from('keywords')
    .select('id')
    .eq('keyword', rawKeyword)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: `Keyword "${rawKeyword}" already exists` }, { status: 409 })
  }

  // Insert keyword
  const { data: inserted, error: insertError } = await serviceClient
    .from('keywords')
    .insert({
      keyword: rawKeyword,
      weight: weightNum,
      category: rawCategory,
      created_by: userId,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[admin/keywords] POST error:', insertError.message)
    return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 })
  }

  return NextResponse.json({ keyword: inserted }, { status: 201 })
}
