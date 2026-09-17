/**
 * virusTotal.ts — VirusTotal v3 lookup wrapper
 *
 * Architecture.md §6:
 *  - GET existing URL report only — /urls/{id} where id = base64url(URL)
 *  - NEVER POST a new scan + poll (avoids wait state + quota)
 *  - Check url_intel_cache first (24h TTL, read-time check in this file per Architecture.md §3)
 *  - Free-tier rate limit (4 req/min) — cache is load-bearing, not optional
 *  - Timeout + fallback on every call (Brain.md rule 4)
 *
 * Malicious threshold: >= 3 vendors flag as malicious → flagged: true (Architecture.md §5)
 * VT has no report for URL → { flagged: false, degraded: false, unseen: true }
 */

import { createServiceClient } from './supabaseClient'

export interface VirusTotalResult {
  /** true = >= 3 vendors flagged as malicious */
  flagged: boolean
  /** true = API call failed/timed out; result is fallback */
  degraded: boolean
  /** true = VT has no existing report for this URL (new/unseen URL) */
  unseen: boolean
  /** Number of malicious vendor verdicts (when flagged) */
  maliciousCount?: number
}

const VT_ENDPOINT = 'https://www.virustotal.com/api/v3/urls'
const TIMEOUT_MS = 5000
const MALICIOUS_THRESHOLD = 3
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24 hours in ms

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * VT URL ID = base64url(URL) with no padding (= stripped)
 * Architecture.md §6: /urls/{id} where id = base64url(URL)
 */
function vtUrlId(url: string): string {
  const b64 = Buffer.from(url).toString('base64')
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

/**
 * SHA-256 of the normalized URL — used as the cache primary key.
 * Using Node's crypto (server-side only, this file is never in the client bundle).
 */
async function sha256(text: string): Promise<string> {
  const { createHash } = await import('crypto')
  return createHash('sha256').update(text).digest('hex')
}

// ─────────────────────────────────────────────────────────────────────────────
// Cache read/write (via service-role Supabase client — bypasses RLS)
// TTL check: read-time, not a cron job (Architecture.md §3)
// ─────────────────────────────────────────────────────────────────────────────

interface CachedVerdict {
  flagged: boolean
  unseen: boolean
  maliciousCount?: number
}

async function readCache(urlHash: string): Promise<CachedVerdict | null> {
  try {
    const supabase = createServiceClient()
    const { data, error } = await supabase
      .from('url_intel_cache')
      .select('virustotal_result, fetched_at')
      .eq('url_hash', urlHash)
      .single()

    if (error || !data) return null

    // TTL check — treat stale as cache miss (Architecture.md §3)
    const fetchedAt = new Date(data.fetched_at as string).getTime()
    if (Date.now() - fetchedAt > CACHE_TTL_MS) {
      return null  // stale — caller will overwrite on next fetch
    }

    return data.virustotal_result as CachedVerdict
  } catch {
    return null  // cache read failure is non-fatal — fall through to API call
  }
}

async function writeCache(urlHash: string, verdict: CachedVerdict): Promise<void> {
  try {
    const supabase = createServiceClient()
    await supabase
      .from('url_intel_cache')
      .upsert({
        url_hash: urlHash,
        virustotal_result: verdict,
        fetched_at: new Date().toISOString(),
      })
  } catch (err) {
    // Cache write failure is non-fatal — scan result is still valid
    console.error('[virusTotal] Cache write failed:', err)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

/**
 * checkVirusTotal — lookup an existing VT URL report.
 * Cache hit → return cached result (no API call).
 * Cache miss → GET from VT API → write to cache → return result.
 * Any failure → { flagged: false, degraded: true, unseen: false }
 */
export async function checkVirusTotal(normalizedUrl: string): Promise<VirusTotalResult> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY

  if (!apiKey || apiKey === 'your-virustotal-api-key') {
    console.warn('[virusTotal] VIRUSTOTAL_API_KEY not set — skipping VirusTotal check')
    return { flagged: false, degraded: true, unseen: false }
  }

  const urlHash = await sha256(normalizedUrl)

  // ── 1. Cache check ───────────────────────────────────────────────────────
  const cached = await readCache(urlHash)
  if (cached !== null) {
    return { ...cached, degraded: false }
  }

  // ── 2. VT API call ───────────────────────────────────────────────────────
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const id = vtUrlId(normalizedUrl)
    const response = await fetch(`${VT_ENDPOINT}/${id}`, {
      headers: {
        'x-apikey': apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // 404 = URL not yet indexed by VT (Edge-Cases.md: treat as no VT signal, not an error)
    if (response.status === 404) {
      const verdict: CachedVerdict = { flagged: false, unseen: true }
      await writeCache(urlHash, verdict)
      return { ...verdict, degraded: false }
    }

    // 429 = rate limited
    if (response.status === 429) {
      console.warn('[virusTotal] Rate limited — degrading gracefully')
      return { flagged: false, degraded: true, unseen: false }
    }

    if (!response.ok) {
      console.error(`[virusTotal] API returned ${response.status}: ${response.statusText}`)
      return { flagged: false, degraded: true, unseen: false }
    }

    const data = (await response.json()) as {
      data?: {
        attributes?: {
          last_analysis_stats?: {
            malicious: number
            suspicious: number
          }
        }
      }
    }

    const stats = data?.data?.attributes?.last_analysis_stats
    if (!stats) {
      // Unexpected response shape — degrade
      return { flagged: false, degraded: true, unseen: false }
    }

    const maliciousCount = stats.malicious ?? 0
    const flagged = maliciousCount >= MALICIOUS_THRESHOLD

    const verdict: CachedVerdict = { flagged, unseen: false, maliciousCount }
    await writeCache(urlHash, verdict)
    return { ...verdict, degraded: false }
  } catch (err) {
    clearTimeout(timeoutId)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    console.error(
      isTimeout
        ? '[virusTotal] Request timed out after 5s'
        : `[virusTotal] Request failed: ${err}`
    )
    return { flagged: false, degraded: true, unseen: false }
  }
}
