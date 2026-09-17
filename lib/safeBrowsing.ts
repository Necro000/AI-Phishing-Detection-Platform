/**
 * safeBrowsing.ts — Google Safe Browsing v4 wrapper
 *
 * Architecture.md §6:
 *  - Endpoint: threatMatches:find
 *  - Timeout: ~3s
 *  - Fallback: { flagged: false, degraded: true } on any failure
 *
 * Brain.md rule 4: No bare fetch() without both timeout and fallback.
 * Never called for private/loopback IPs (caller checks isPrivateOrLoopback first).
 */

export interface SafeBrowsingResult {
  /** true = URL is flagged as malicious by Safe Browsing */
  flagged: boolean
  /** true = API call failed or timed out; result is a fallback, not a real verdict */
  degraded: boolean
  /** Threat type string if flagged, e.g. "MALWARE", "SOCIAL_ENGINEERING" */
  threatType?: string
}

const SAFE_BROWSING_ENDPOINT =
  'https://safebrowsing.googleapis.com/v4/threatMatches:find'

const TIMEOUT_MS = 3000

const THREAT_TYPES = [
  'MALWARE',
  'SOCIAL_ENGINEERING',
  'UNWANTED_SOFTWARE',
  'POTENTIALLY_HARMFUL_APPLICATION',
]

/**
 * checkSafeBrowsing — check a single URL against Google Safe Browsing v4.
 *
 * Returns { flagged: false, degraded: true } on:
 *  - timeout
 *  - network error
 *  - non-2xx response
 *  - missing API key (SAFE_BROWSING_API_KEY env var not set)
 *  - any thrown exception
 */
export async function checkSafeBrowsing(url: string): Promise<SafeBrowsingResult> {
  const apiKey = process.env.SAFE_BROWSING_API_KEY

  if (!apiKey || apiKey === 'your-safe-browsing-api-key') {
    // Key not configured — degrade gracefully, don't crash the scan
    console.warn('[safeBrowsing] SAFE_BROWSING_API_KEY not set — skipping Safe Browsing check')
    return { flagged: false, degraded: true }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        client: {
          clientId: 'ai-phishing-detection-platform',
          clientVersion: '1.0.0',
        },
        threatInfo: {
          threatTypes: THREAT_TYPES,
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      }),
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`[safeBrowsing] API returned ${response.status}: ${response.statusText}`)
      return { flagged: false, degraded: true }
    }

    const data = (await response.json()) as { matches?: Array<{ threatType: string }> }

    if (data.matches && data.matches.length > 0) {
      return {
        flagged: true,
        degraded: false,
        threatType: data.matches[0].threatType,
      }
    }

    return { flagged: false, degraded: false }
  } catch (err) {
    clearTimeout(timeoutId)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    console.error(
      isTimeout
        ? '[safeBrowsing] Request timed out after 3s'
        : `[safeBrowsing] Request failed: ${err}`
    )
    return { flagged: false, degraded: true }
  }
}
