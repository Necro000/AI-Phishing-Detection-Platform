/**
 * /api/scan/email/route.ts — POST email/message scan handler
 *
 * Architecture.md §4 (frozen):
 *   Request:  { "content": string }
 *   Response: { "risk_level": "SAFE"|"SUSPICIOUS"|"HIGH_RISK", "risk_score": number, "reasons": string[], "signals": { rules: number, safeBrowsing: null, virusTotal: null, ml: null } }
 *
 * Flow:
 *  1. Verify session (unauthenticated → 401)
 *  2. Validate + length-cap input (Edge-Cases.md: empty reject, >10,000 chars truncate)
 *  3. Load active keywords from DB (service client, fallback to DEFAULT_KEYWORDS)
 *  4. Run email rule engine (pure function, returns RuleHit[])
 *  5. Score via scoring.ts (single source of truth for score calculation)
 *  6. Persist to scans table with explicit null signals
 *  7. Return frozen JSON response
 *
 * CRITICAL: Zero external API calls — Safe Browsing and VirusTotal are never called.
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { runEmailRules } from '@/lib/ruleEngine/emailRules'
import { scoreEmail } from '@/lib/ruleEngine/scoring'
import { DEFAULT_KEYWORDS } from '@/lib/ruleEngine/defaultKeywords'
import type { DbKeyword } from '@/lib/ruleEngine/urlRules'

const MAX_EMAIL_LENGTH = 10000 // Edge-Cases.md: >10,000 chars → cap stored/displayed length
const TRUNCATE_NOTE = ' [truncated — content exceeded 10,000 characters]'

export async function GET() {
  return NextResponse.json(
    {
      status: 'online',
      service: 'PhishGuard Email Threat Scanner Backend',
      method_required: 'POST',
      message: 'Backend is active and listening. To perform an analysis, send an HTTP POST request with a JSON body containing { "content": "email text or message headers" }.',
      supported_engines: ['Social Engineering Detection', 'Credential Harvesting Rules', 'Urgency & Pressure Heuristics'],
      documentation: '/api',
    },
    { status: 200 }
  )
}

export async function POST(request: NextRequest) {
  // ── 1. Session verification ───────────────────────────────────────────────
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

  // ── 2. Parse & Validate Input ─────────────────────────────────────────────
  let body: { content?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rawContent = typeof body.content === 'string' ? body.content.trim() : ''

  if (!rawContent) {
    return NextResponse.json({ error: 'Email content is required' }, { status: 400 })
  }

  // Server-side backstop: hard ceiling on request body size (2MB)
  if (rawContent.length > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload exceeds maximum allowed size (2MB)' }, { status: 413 })
  }

  // Edge-Cases.md: Cap stored and processed length to avoid request hanging
  let processedContent = rawContent
  let storedInput = rawContent

  if (rawContent.length > MAX_EMAIL_LENGTH) {
    processedContent = rawContent.slice(0, MAX_EMAIL_LENGTH)
    storedInput = processedContent + TRUNCATE_NOTE
  }

  // ── 3. Load active keywords from DB (service-role client) ──────────────────
  let keywords: DbKeyword[] = []
  try {
    const serviceClient = createServiceClient()
    const { data: kw } = await serviceClient
      .from('keywords')
      .select('keyword, weight, category')
      .order('weight', { ascending: false })
    keywords = (kw ?? []) as DbKeyword[]
  } catch {
    console.warn('[scan/email] Failed to load keywords from DB — using defaults')
  }

  // Sane defaults fallback if table is empty
  if (!keywords || keywords.length === 0) {
    keywords = DEFAULT_KEYWORDS
  }

  // ── 4. Run pure heuristic rules (zero network calls) ───────────────────────
  const ruleHits = runEmailRules(processedContent, keywords)

  // ── 5. Score result via scoring.ts (single source of truth) ────────────────
  const scanResult = scoreEmail({ ruleHits })

  // Note truncation in reasons if applicable
  if (rawContent.length > MAX_EMAIL_LENGTH) {
    scanResult.reasons.push(
      `Content exceeded ${MAX_EMAIL_LENGTH} characters and was truncated for analysis`
    )
  }

  // Note limitation: English keyword sets only
  // (Edge-Cases.md: Documented limitation for email analyzer)
  if (scanResult.reasons.length === 0) {
    scanResult.reasons.push(
      'No common phishing keywords, urgency triggers, or suspicious link patterns detected'
    )
  }

  // ── 6. Persist to scans table ─────────────────────────────────────────────
  // Explicit null signals for email scans (Architecture.md §4 & §5)
  let scanId: string | undefined
  try {
    const serviceClient = createServiceClient()
    const { data: insertedScan, error: insertError } = await serviceClient
      .from('scans')
      .insert({
        user_id: user.id,
        scan_type: 'email',
        input: storedInput,
        risk_level: scanResult.risk_level,
        risk_score: scanResult.risk_score,
        reasons: scanResult.reasons,
        signals: {
          rules: scanResult.signals.rules,
          safeBrowsing: null,
          virusTotal: null,
          ml: null,
        },
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[scan/email] Failed to persist scan record:', insertError.message)
      // Continue and return verdict even if history persistence hits a temporary DB error
    } else if (insertedScan?.id) {
      scanId = insertedScan.id
    }
  } catch (err) {
    console.error('[scan/email] Unexpected error persisting scan:', err)
  }

  // ── 7. Respond with frozen contract ───────────────────────────────────────
  return NextResponse.json({
    ...scanResult,
    ...(scanId ? { id: scanId } : {}),
  }, { status: 200 })
}
