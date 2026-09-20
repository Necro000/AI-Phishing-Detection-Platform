/**
 * /api/scan/url/route.ts — POST URL scan handler
 *
 * Flow (Architecture.md §1):
 *  1. Verify session (unauthenticated → 401, before any external API call)
 *  2. Validate + normalize URL
 *  3. SSRF guard — reject private/loopback IPs (string-based only, never fetch)
 *  4. Run rule engine (pure, no I/O)
 *  5. Run Safe Browsing + VirusTotal in parallel (both have timeout + fallback)
 *  6. Run ML inference (pure, no I/O)
 *  7. Score with scoring.ts
 *  8. Persist scan row (Supabase)
 *  9. Return JSON result
 *
 * Edge-Cases.md compliance:
 *  - Empty string → 400
 *  - Malformed URL → 400
 *  - URL > 2000 chars → truncate for storage, still analyze
 *  - Private/loopback IP → SSRF guard, heuristics only
 *  - Safe Browsing / VT timeout or error → fallback, scan continues
 *  - Both APIs degraded → scan returns rule+ML result, labeled reduced-confidence
 *  - Unauthenticated → 401, no external API quota consumed
 *  - Duplicate scan by same user → allowed, new row each time
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { runUrlRules, isPrivateOrLoopback, normalizeUrl } from '@/lib/ruleEngine/urlRules'
import { checkSafeBrowsing } from '@/lib/safeBrowsing'
import { checkVirusTotal } from '@/lib/virusTotal'
import { infer as mlInfer } from '@/lib/ml/infer'
import { scoreUrl, isBothApisDegraded } from '@/lib/ruleEngine/scoring'
import { DEFAULT_KEYWORDS } from '@/lib/ruleEngine/defaultKeywords'
import type { DbKeyword } from '@/lib/ruleEngine/urlRules'

const MAX_INPUT_LENGTH = 2000   // Edge-Cases.md: URL > ~2000 chars → truncate for storage
const STORAGE_TRUNCATE_NOTE = ' [truncated — original URL exceeded 2000 characters]'

export async function POST(request: NextRequest) {
  // ── 1. Session check ── before ANY external call (Edge-Cases.md cross-cutting)
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

  const { data: { user }, error: sessionError } = await sessionClient.auth.getUser()
  if (sessionError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── 2. Parse + validate input ─────────────────────────────────────────────
  let body: { url?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''

  if (!rawUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  if (rawUrl.length > 2048) {
    return NextResponse.json({ error: 'URL exceeds maximum length of 2048 characters' }, { status: 400 })
  }

  // Normalize before validation
  const normalizedUrl = normalizeUrl(rawUrl)

  // Validate URL is parsable
  try {
    new URL(normalizedUrl)
  } catch {
    return NextResponse.json(
      { error: 'Invalid URL — please enter a valid web address' },
      { status: 400 }
    )
  }

  // ── 3. SSRF guard ──────────────────────────────────────────────────────────
  let parsedForSSRF: URL
  try {
    parsedForSSRF = new URL(normalizedUrl)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  const isPrivate = isPrivateOrLoopback(parsedForSSRF.hostname)
  // We don't block private IPs — we just skip external API calls for them (heuristics still run)

  // ── 4. Load active keywords from DB (used by rule engine) ─────────────────
  let keywords: DbKeyword[] = []
  try {
    const serviceClient = createServiceClient()
    const { data: kw } = await serviceClient
      .from('keywords')
      .select('keyword, weight, category')
      .order('weight', { ascending: false })
    keywords = (kw ?? []) as DbKeyword[]
  } catch {
    console.warn('[scan/url] Failed to load keywords from DB — using defaults')
  }

  if (!keywords || keywords.length === 0) {
    keywords = DEFAULT_KEYWORDS
  }

  // ── 5. Run rule engine (pure, synchronous, no I/O) ──────────────────────
  const ruleResult = runUrlRules(rawUrl, keywords)

  // ── 6. External API calls in parallel (with timeout + fallback on each) ──
  const [safeBrowsingResult, virusTotalResult] = await Promise.all([
    isPrivate ? Promise.resolve({ flagged: false, degraded: false }) : checkSafeBrowsing(normalizedUrl),
    isPrivate ? Promise.resolve({ flagged: false, degraded: false, unseen: false }) : checkVirusTotal(normalizedUrl),
  ])

  // ── 7. ML inference (pure function, synchronous) ──────────────────────────
  const mlResult = mlInfer(normalizedUrl)

  // ── 8. Score ───────────────────────────────────────────────────────────────
  const scanResult = scoreUrl({
    ruleHits: ruleResult.hits,
    ruleScore: ruleResult.ruleScore,
    safeBrowsing: safeBrowsingResult,
    virusTotal: virusTotalResult,
    mlResult,
    isPrivate,
  })

  // Append reduced-confidence note if both external APIs degraded (Edge-Cases.md)
  if (isBothApisDegraded(safeBrowsingResult, virusTotalResult)) {
    scanResult.reasons.push(
      'Both Safe Browsing and VirusTotal are unavailable — result is based on rules and ML only (reduced confidence)'
    )
  }

  // ── 9. Persist scan row ────────────────────────────────────────────────────
  // Truncate input for storage if too long (Edge-Cases.md: URL > ~2000 chars)
  const storedInput =
    rawUrl.length > MAX_INPUT_LENGTH
      ? rawUrl.slice(0, MAX_INPUT_LENGTH) + STORAGE_TRUNCATE_NOTE
      : rawUrl

  let scanId: string | undefined
  try {
    const serviceClient = createServiceClient()
    const { data: insertedScan } = await serviceClient
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: 'url',
        input: storedInput,
        risk_level: scanResult.risk_level,
        risk_score: scanResult.risk_score,
        reasons: scanResult.reasons,
        signals: scanResult.signals,
      })
      .select('id')
      .single()

    if (insertedScan?.id) {
      scanId = insertedScan.id
    }
  } catch (err) {
    // Persist failure is non-fatal for the response — client still gets the result
    console.error('[scan/url] Failed to persist scan:', err)
  }

  // ── 10. Return result ──────────────────────────────────────────────────────
  return NextResponse.json({
    ...scanResult,
    ...(scanId ? { id: scanId } : {}),
  })
}
