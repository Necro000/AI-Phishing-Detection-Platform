/**
 * /api/admin/keywords/[id]/route.ts — PATCH and DELETE for individual keywords
 *
 * Architecture.md §4:
 *  - PATCH edits weight/category in place — deliberately not DELETE+re-POST, which would
 *    lose created_at/created_by.
 *  - Weight is capped at 1–40.
 *  - Category is free-text string (forward-compatible).
 *  - DELETE removes keyword row.
 *  - Gated by requireAdmin on every request.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { createServiceClient } from '@/lib/supabaseClient'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 })
  }

  let body: { weight?: unknown; category?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  // Validate weight if provided
  if (body.weight !== undefined) {
    const weightNum = Number(body.weight)
    if (!Number.isInteger(weightNum) || weightNum < 1 || weightNum > 40) {
      return NextResponse.json(
        { error: 'Weight must be an integer between 1 and 40' },
        { status: 400 }
      )
    }
    updates.weight = weightNum
  }

  // Validate category if provided
  if (body.category !== undefined) {
    const rawCategory = typeof body.category === 'string' ? body.category.trim() : ''
    if (!rawCategory) {
      return NextResponse.json({ error: 'Category must be a non-empty string' }, { status: 400 })
    }
    updates.category = rawCategory
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields provided to update' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { data: updated, error: dbError } = await serviceClient
    .from('keywords')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (dbError) {
    console.error('[admin/keywords/:id] PATCH error:', dbError.message)
    return NextResponse.json({ error: 'Failed to update keyword' }, { status: 500 })
  }

  if (!updated) {
    return NextResponse.json({ error: 'Keyword not found' }, { status: 404 })
  }

  return NextResponse.json({ keyword: updated }, { status: 200 })
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { error } = await requireAdmin(request)
  if (error) return error

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 })
  }

  const serviceClient = createServiceClient()
  const { error: dbError } = await serviceClient
    .from('keywords')
    .delete()
    .eq('id', id)

  if (dbError) {
    console.error('[admin/keywords/:id] DELETE error:', dbError.message)
    return NextResponse.json({ error: 'Failed to delete keyword' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
