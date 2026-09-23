/**
 * urlRules.ts — URL heuristic rule engine
 *
 * Brain.md conventions:
 *  - One rule = one small named function, not a big if/else
 *  - Pure functions: no I/O inside them
 *  - Returns RuleHit[] so scoring.ts can build reasons[] from individual rule names
 *
 * Structural rules have hardcoded weights.
 * Keyword-based rules read from the keywords table (passed in at call time — no I/O here).
 */




export interface RuleHit {
  rule: string        // machine-readable name for deduplication
  reason: string      // human-readable string for reasons[]
  score: number       // points this hit contributes
}

export interface DbKeyword {
  keyword: string
  weight: number
  category: string
}

// ─────────────────────────────────────────────────────────────────────────────
// URL normalization (shared with feature extraction path)
// ─────────────────────────────────────────────────────────────────────────────

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('ftp://')
  ) {
    return trimmed
  }
  return 'https://' + trimmed
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual rule functions
// ─────────────────────────────────────────────────────────────────────────────

/** Rule: No HTTPS — weight 15 */
function checkNoHttps(parsed: URL): RuleHit | null {
  if (parsed.protocol !== 'https:') {
    return {
      rule: 'no_https',
      reason: 'URL does not use HTTPS',
      score: 15,
    }
  }
  return null
}

/** Rule: IP-literal host — weight 20 (Edge-Cases.md: flag as suspicious) */
function checkIpLiteralHost(parsed: URL): RuleHit | null {
  const host = parsed.hostname
  const parts = host.split('.')
  if (parts.length === 4 && parts.every(p => /^\d+$/.test(p) && +p >= 0 && +p <= 255)) {
    return {
      rule: 'ip_literal_host',
      reason: `URL uses an IP address as host (${host}) instead of a domain name`,
      score: 20,
    }
  }
  return null
}

/** Rule: @ symbol in URL — phishers use this to hide real host (user:pass@evil.com) — weight 25 */
function checkAtSymbol(url: string): RuleHit | null {
  if (url.includes('@')) {
    return {
      rule: 'at_symbol',
      reason: 'URL contains @ symbol — commonly used to disguise the real destination',
      score: 25,
    }
  }
  return null
}

/** Rule: Excessive subdomains (>= 4 parts in host) — weight 10 */
function checkExcessiveSubdomains(parsed: URL): RuleHit | null {
  const parts = parsed.hostname.split('.')
  if (parts.length >= 4) {
    return {
      rule: 'excessive_subdomains',
      reason: `URL has ${parts.length - 1} subdomains — phishing sites often use deep subdomain chains`,
      score: 10,
    }
  }
  return null
}

/** Rule: Punycode / homograph domain — weight 20 (Edge-Cases.md: flag as suspicious) */
function checkPunycode(parsed: URL): RuleHit | null {
  if (parsed.hostname.includes('xn--')) {
    return {
      rule: 'punycode_domain',
      reason: 'URL uses a Punycode-encoded domain (possible homograph/lookalike attack)',
      score: 20,
    }
  }
  return null
}

/** Rule: Very long URL (> 100 chars in path+query) — weight 10 */
function checkLongUrl(url: string): RuleHit | null {
  if (url.length > 100) {
    return {
      rule: 'long_url',
      reason: `Unusually long URL (${url.length} characters) — often used to hide malicious content`,
      score: 10,
    }
  }
  return null
}

/** Rule: Suspicious TLD — weight 15 */
const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq', '.pw', '.top', '.xyz', '.click',
  '.work', '.link', '.loan', '.download', '.racing', '.party', '.review',
])

function checkSuspiciousTld(parsed: URL): RuleHit | null {
  const hostname = parsed.hostname.toLowerCase()
  for (const tld of SUSPICIOUS_TLDS) {
    if (hostname.endsWith(tld)) {
      return {
        rule: 'suspicious_tld',
        reason: `URL uses a high-risk TLD (${tld}) commonly associated with phishing`,
        score: 15,
      }
    }
  }
  return null
}

/** Rule: Hyphen-heavy domain (>= 3 hyphens) — weight 10 */
function checkHyphenHeavyDomain(parsed: URL): RuleHit | null {
  const domain = parsed.hostname.split('.')[0] ?? ''
  const hyphens = (domain.match(/-/g) ?? []).length
  if (hyphens >= 3) {
    return {
      rule: 'hyphen_heavy_domain',
      reason: `Domain contains ${hyphens} hyphens — often used in phishing to mimic legitimate domains`,
      score: 10,
    }
  }
  return null
}

/** Rule: Brand impersonation — known brands in subdomain/path but not in root domain — weight 20 */
const KNOWN_BRANDS = ['paypal', 'amazon', 'apple', 'google', 'microsoft', 'netflix', 'facebook', 'instagram', 'bank']

function checkBrandImpersonation(parsed: URL): RuleHit | null {
  const hostParts = parsed.hostname.toLowerCase().split('.')
  // Root domain = last two parts (e.g. "evil.com")
  const rootDomain = hostParts.slice(-2).join('.')
  const subdomainPart = hostParts.slice(0, -2).join('.')
  const pathPart = parsed.pathname.toLowerCase()

  for (const brand of KNOWN_BRANDS) {
    const brandInSubOrPath = subdomainPart.includes(brand) || pathPart.includes(brand)
    const brandInRoot = rootDomain.includes(brand)
    if (brandInSubOrPath && !brandInRoot) {
      return {
        rule: 'brand_impersonation',
        reason: `URL references "${brand}" in subdomain/path but not in the root domain — possible impersonation`,
        score: 20,
      }
    }
  }
  return null
}

/**
 * Rule: Cloud/SaaS form credential abuse — weight 20
 *
 * Attackers host phishing credential forms on legitimate free SaaS platforms
 * (Google Forms, Office Forms, Tally, Firebase, Weebly, Typeform) which have
 * pristine domain reputations. Flag when the URL path/query contains credential
 * or financial harvesting keywords — conservative +20 pts (can push SUSPICIOUS,
 * never HIGH_RISK alone, consistent with Architecture.md §4 weight cap).
 */
const CLOUD_FORM_HOSTS = new Set([
  'docs.google.com',
  'forms.gle',
  'forms.office.com',
  'forms.microsoft.com',
  'tally.so',
  'typeform.com',
  'firebaseapp.com',
  'web.app',
  'weebly.com',
  'wixsite.com',
  'sites.google.com',
])

const CREDENTIAL_PATH_TERMS = [
  'password', 'passwd', 'login', 'signin', 'sign-in', 'verify',
  'credential', 'ssn', 'pin', 'account', 'banking', 'payment',
  'credit-card', 'cvv', 'social-security',
]

function checkCloudFormAbuse(parsed: URL, rawUrl: string): RuleHit | null {
  const hostname = parsed.hostname.toLowerCase()
  if (!CLOUD_FORM_HOSTS.has(hostname)) return null

  const searchable = (parsed.pathname + parsed.search + parsed.hash).toLowerCase()
  const rawLower = rawUrl.toLowerCase()

  const matched = CREDENTIAL_PATH_TERMS.find(
    (term) => searchable.includes(term) || rawLower.includes(term)
  )

  if (matched) {
    return {
      rule: 'cloud_form_credential_abuse',
      reason: `Credential-harvesting form hosted on a trusted public SaaS platform (${hostname}) — attackers commonly abuse free form builders to bypass domain reputation checks (matched term: "${matched}")`,
      score: 20,
    }
  }
  return null
}

/** Rule: Keyword matches from the DB keywords table (or fallback defaults) — weight per keyword */
function checkKeywords(url: string, keywords: DbKeyword[]): RuleHit[] {
  const urlLower = url.toLowerCase()
  const hits: RuleHit[] = []

  for (const { keyword, weight, category } of keywords) {
    if (urlLower.includes(keyword.toLowerCase())) {
      hits.push({
        rule: `keyword:${keyword}`,
        reason: `URL contains suspicious term "${keyword}" (category: ${category})`,
        score: weight,
      })
    }
  }

  return hits
}

// ─────────────────────────────────────────────────────────────────────────────
// SSRF guard — never fetch private/loopback IPs (Edge-Cases.md URL Scanner)
// This is a string-only check — we never fetch the URL itself.
// ─────────────────────────────────────────────────────────────────────────────

const PRIVATE_IP_PATTERNS = [
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^169\.254\.\d+\.\d+$/, // AWS / Azure / GCP link-local metadata
  /^::1$/,
  /^::ffff:127\.\d+\.\d+\.\d+$/, // IPv4-mapped loopback
  /^::ffff:169\.254\.\d+\.\d+$/, // IPv4-mapped metadata
  /^localhost$/i,
  /^metadata\.google\.internal$/i,
  /^0\.0\.0\.0$/,
]

export function isPrivateOrLoopback(hostname: string): boolean {
  return PRIVATE_IP_PATTERNS.some(pat => pat.test(hostname))
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export: run all URL rules
// ─────────────────────────────────────────────────────────────────────────────

export interface UrlRuleResult {
  hits: RuleHit[]
  /** Sum of all rule hit scores — this is signals.rules in the scan row */
  ruleScore: number
  /** True if URL was private/loopback — external APIs should not be called */
  isPrivate: boolean
  /** Normalized URL for use in external API calls */
  normalizedUrl: string
}

/**
 * runUrlRules — pure function, no I/O.
 * @param rawUrl     The raw URL string submitted by the user
 * @param keywords   Active keywords from the DB (pass [] to use defaults only)
 * @returns UrlRuleResult
 */
export function runUrlRules(rawUrl: string, keywords: DbKeyword[]): UrlRuleResult {
  const normalizedUrl = normalizeUrl(rawUrl)

  let parsed: URL
  try {
    parsed = new URL(normalizedUrl)
  } catch {
    // Malformed URL — return a single hit explaining the issue
    return {
      hits: [{ rule: 'malformed_url', reason: 'URL could not be parsed', score: 0 }],
      ruleScore: 0,
      isPrivate: false,
      normalizedUrl,
    }
  }

  const isPrivate = isPrivateOrLoopback(parsed.hostname)

  const structuralRules: (RuleHit | null)[] = [
    checkNoHttps(parsed),
    checkIpLiteralHost(parsed),
    checkAtSymbol(normalizedUrl),
    checkExcessiveSubdomains(parsed),
    checkPunycode(parsed),
    checkLongUrl(normalizedUrl),
    checkSuspiciousTld(parsed),
    checkHyphenHeavyDomain(parsed),
    checkBrandImpersonation(parsed),
    checkCloudFormAbuse(parsed, normalizedUrl),
  ]

  const hits: RuleHit[] = [
    ...structuralRules.filter((h): h is RuleHit => h !== null),
    ...checkKeywords(normalizedUrl, keywords),
  ]

  const ruleScore = hits.reduce((sum, h) => sum + h.score, 0)

  return { hits, ruleScore, isPrivate, normalizedUrl }
}
