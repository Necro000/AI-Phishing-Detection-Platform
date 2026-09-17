/**
 * features.ts — URL feature extraction for ML inference
 *
 * Architecture.md §7: This file MUST extract features identically to
 * scripts/train_model.py's extract_features() function.
 * Feature order is frozen once weights.json is committed.
 *
 * Feature vector (index order matches Python — DO NOT reorder):
 *   0: url_length          — total character count / 100
 *   1: subdomain_count     — number of subdomains (host parts - 2), clamped 0–10
 *   2: has_ip_host         — 1 if host is IPv4 literal, 0 otherwise
 *   3: has_at_symbol       — 1 if '@' in URL, 0 otherwise
 *   4: has_https           — 1 if scheme is https, 0 otherwise
 *   5: suspicious_kw_count — count of suspicious keywords in lowercased URL, clamped 0–10
 *   6: domain_entropy      — Shannon entropy of hostname string
 */

// Suspicious keywords — must match SUSPICIOUS_KEYWORDS in train_model.py exactly
const SUSPICIOUS_KEYWORDS: string[] = [
  'verify', 'account', 'suspended', 'password', 'credentials',
  'login', 'signin', 'secure', 'update', 'confirm',
  'banking', 'paypal', 'amazon', 'apple', 'microsoft',
  'prize', 'winner', 'free', 'urgent', 'alert',
  'limited', 'expire', 'immediately', 'click', 'validate',
  'unusual', 'activity', 'security', 'notification', 'member',
]

export const FEATURE_NAMES = [
  'url_length',
  'subdomain_count',
  'has_ip_host',
  'has_at_symbol',
  'has_https',
  'suspicious_kw_count',
  'domain_entropy',
] as const

export type FeatureVector = [
  number, // 0: url_length
  number, // 1: subdomain_count
  number, // 2: has_ip_host
  number, // 3: has_at_symbol
  number, // 4: has_https
  number, // 5: suspicious_kw_count
  number, // 6: domain_entropy
]

/**
 * Shannon entropy of a string.
 * Matches Python: -sum((f/n) * log2(f/n) for each char frequency)
 */
function shannonEntropy(s: string): number {
  if (!s) return 0
  const freq: Record<string, number> = {}
  for (const c of s) {
    freq[c] = (freq[c] ?? 0) + 1
  }
  const n = s.length
  let entropy = 0
  for (const f of Object.values(freq)) {
    const p = f / n
    entropy -= p * Math.log2(p)
  }
  return entropy
}

/**
 * Check if a hostname is an IPv4 literal.
 * Matches Python ip_pattern regex + range check.
 */
function isIPv4Host(host: string): boolean {
  const parts = host.split('.')
  if (parts.length !== 4) return false
  return parts.every((p) => {
    const n = parseInt(p, 10)
    return /^\d+$/.test(p) && n >= 0 && n <= 255
  })
}

/**
 * Normalize a URL by adding https:// if no scheme present.
 * Matches Python: "if not url.startswith(('http://', 'https://', 'ftp://'))"
 */
function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('ftp://')
  ) {
    return trimmed
  }
  return 'https://' + trimmed
}

/**
 * Extract the 7-feature vector from a URL string.
 *
 * Returns null if:
 *   - URL is empty
 *   - URL is unparsable (caught by try/catch)
 *   - Hostname is empty after parsing
 *   - Any feature would be NaN/undefined (Edge-Cases.md: ML — NaN guard)
 *
 * Caller should treat null as { ml: null } and skip ML inference.
 */
export function extractFeatures(url: string): FeatureVector | null {
  if (!url || !url.trim()) return null

  const normalized = normalizeUrl(url)

  let parsed: URL
  try {
    parsed = new URL(normalized)
  } catch {
    // Malformed URL — Edge-Cases.md: malformed URL → clean response, not a crash
    return null
  }

  const host = parsed.hostname
  if (!host) return null

  // Feature 0: URL length normalized
  const urlLength = normalized.length / 100

  // Feature 1: subdomain count
  // "a.b.c.com".split('.') = ['a','b','c','com'] → len=4 → subdomains = 4-2 = 2
  const hostParts = host.split('.')
  const subdomainCount = Math.min(Math.max(hostParts.length - 2, 0), 10)

  // Feature 2: IP-literal host
  const hasIpHost = isIPv4Host(host) ? 1.0 : 0.0

  // Feature 3: @ symbol in URL
  const hasAtSymbol = normalized.includes('@') ? 1.0 : 0.0

  // Feature 4: HTTPS
  const hasHttps = parsed.protocol === 'https:' ? 1.0 : 0.0

  // Feature 5: suspicious keyword count in full lowercased URL
  const urlLower = normalized.toLowerCase()
  const kwCount = SUSPICIOUS_KEYWORDS.filter((kw) => urlLower.includes(kw)).length
  const suspiciousKwCount = Math.min(kwCount, 10)

  // Feature 6: Shannon entropy of hostname
  const domainEntropy = shannonEntropy(host)

  const vector: FeatureVector = [
    urlLength,
    subdomainCount,
    hasIpHost,
    hasAtSymbol,
    hasHttps,
    suspiciousKwCount,
    domainEntropy,
  ]

  // NaN guard — Edge-Cases.md: ML — out-of-range/NaN features
  if (vector.some((v) => !isFinite(v) || isNaN(v))) {
    return null
  }

  return vector
}
