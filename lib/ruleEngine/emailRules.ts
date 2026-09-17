/**
 * emailRules.ts — Email heuristic rule engine
 *
 * Brain.md & Architecture.md conventions:
 *  - One rule = one small named function, not a giant if/else
 *  - Pure functions: zero I/O, zero network calls
 *  - CRITICAL: Never calls Safe Browsing or VirusTotal (prevents external quota drain).
 *    Link checks here are pattern-only heuristics.
 *  - Returns RuleHit[] only — scoring.ts is the single source of truth that turns hits into a score.
 *  - Handles Edge-Cases.md: empty content, no links present, non-English note, bank FP note.
 */

import type { RuleHit, DbKeyword } from './urlRules'

// ─────────────────────────────────────────────────────────────────────────────
// Regex & Pattern Definitions (Pure Heuristics)
// ─────────────────────────────────────────────────────────────────────────────

// Extract URLs found inside plain text or HTML
const URL_REGEX = /https?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/gi

// Generic shortened URL domains
const SHORTENER_DOMAINS = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'ow.ly',
  'is.gd',
  'buff.ly',
  'adf.ly',
  'bit.do',
  'cutt.ly',
])

// High-risk TLDs often abused in email spam
const SUSPICIOUS_TLDS = new Set([
  'zip',
  'mov',
  'top',
  'xyz',
  'work',
  'click',
  'loan',
  'racing',
  'country',
  'stream',
  'download',
  'gq',
  'cf',
  'tk',
  'ml',
  'ga',
])

// ─────────────────────────────────────────────────────────────────────────────
// Individual Rule Functions
// ─────────────────────────────────────────────────────────────────────────────

/** Rule: Urgency & Coercive Phrasing (structural linguistic heuristic) */
function checkUrgencyPatterns(text: string): RuleHit | null {
  const lower = text.toLowerCase()
  const patterns = [
    { phrase: 'within 24 hours', score: 20 },
    { phrase: 'within 48 hours', score: 15 },
    { phrase: 'immediate action required', score: 25 },
    { phrase: 'account will be suspended', score: 30 },
    { phrase: 'account will be terminated', score: 30 },
    { phrase: 'action required immediately', score: 25 },
    { phrase: 'act immediately', score: 20 },
    { phrase: 'security compromised', score: 25 },
    { phrase: 'unauthorized login detected', score: 25 },
    { phrase: 'failure to respond will result', score: 25 },
  ]

  for (const { phrase, score } of patterns) {
    if (lower.includes(phrase)) {
      return {
        rule: 'urgency_coercion',
        reason: `Email uses urgent or coercive language ("${phrase}") to pressure immediate action`,
        score,
      }
    }
  }
  return null
}

/** Rule: Credential & Identity Harvesting */
function checkCredentialHarvesting(text: string): RuleHit | null {
  const lower = text.toLowerCase()
  const patterns = [
    { phrase: 'verify your password', score: 30 },
    { phrase: 'confirm your password', score: 35 },
    { phrase: 'enter your credentials', score: 30 },
    { phrase: 'provide your social security', score: 35 },
    { phrase: 'verify your identity to restore', score: 30 },
    { phrase: 'send your one-time password', score: 35 },
    { phrase: 'update your billing details immediately', score: 25 },
  ]

  for (const { phrase, score } of patterns) {
    if (lower.includes(phrase)) {
      return {
        rule: 'credential_harvesting',
        reason: `Email solicits credentials or sensitive personal information ("${phrase}")`,
        score,
      }
    }
  }
  return null
}

/** Rule: Financial Extortion / Gift Card / Crypto Payment Pressure */
function checkFinancialFraud(text: string): RuleHit | null {
  const lower = text.toLowerCase()
  const patterns = [
    { phrase: 'gift card', score: 30 },
    { phrase: 'apple gift card', score: 35 },
    { phrase: 'google play card', score: 35 },
    { phrase: 'steam card', score: 35 },
    { phrase: 'bitcoin wallet', score: 25 },
    { phrase: 'send btc to', score: 30 },
    { phrase: 'wire transfer urgently', score: 25 },
    { phrase: 'untraceable payment', score: 35 },
  ]

  for (const { phrase, score } of patterns) {
    if (lower.includes(phrase)) {
      return {
        rule: 'financial_fraud_request',
        reason: `Email requests suspicious or untraceable payment method ("${phrase}")`,
        score,
      }
    }
  }
  return null
}

/** Rule: Excessive Capitalization / Shouty Phrasing */
function checkExcessiveCaps(text: string): RuleHit | null {
  // Only evaluate if text has substantial length
  const letters = text.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 40) return null

  const upperCount = (letters.match(/[A-Z]/g) || []).length
  const ratio = upperCount / letters.length

  if (ratio > 0.45) {
    return {
      rule: 'excessive_capitalization',
      reason: `Email contains an unusually high ratio of uppercase letters (${Math.round(ratio * 100)}%), commonly used in scam pressure tactics`,
      score: 15,
    }
  }
  return null
}

/**
 * Rule: Pattern-only link heuristics (Pure regex & URL parsing, ZERO network calls)
 * Checks links present in email body without calling external services.
 */
function checkEmailLinks(content: string): RuleHit[] {
  const hits: RuleHit[] = []
  const matches = content.match(URL_REGEX)

  // Edge-Cases.md: No links present → still valid, returns 0 link hits
  if (!matches || matches.length === 0) {
    return hits
  }

  // Deduplicate URLs
  const uniqueUrls = Array.from(new Set(matches))

  let ipLiteralFound = false
  let shortenerFound = false
  let suspiciousTldFound = false
  let atSymbolInUrlFound = false

  for (const rawUrl of uniqueUrls) {
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    try {
      const parsed = new URL(fullUrl)
      const hostname = parsed.hostname.toLowerCase()

      // 1. IP-literal link in email
      const parts = hostname.split('.')
      if (
        !ipLiteralFound &&
        parts.length === 4 &&
        parts.every(p => /^\d+$/.test(p) && +p >= 0 && +p <= 255)
      ) {
        ipLiteralFound = true
        hits.push({
          rule: 'email_link_ip_literal',
          reason: `Email contains a link with a raw IP address host (${hostname}) instead of a domain`,
          score: 25,
        })
      }

      // 2. URL shortener in email (obscures true destination)
      if (!shortenerFound && SHORTENER_DOMAINS.has(hostname)) {
        shortenerFound = true
        hits.push({
          rule: 'email_link_shortener',
          reason: `Email contains a shortened URL (${hostname}) hiding the actual destination`,
          score: 20,
        })
      }

      // 3. High-risk TLD
      const tld = hostname.split('.').pop() || ''
      if (!suspiciousTldFound && SUSPICIOUS_TLDS.has(tld)) {
        suspiciousTldFound = true
        hits.push({
          rule: 'email_link_suspicious_tld',
          reason: `Email contains a link with a high-risk top-level domain (.${tld})`,
          score: 15,
        })
      }

      // 4. @ symbol in link URL (credential/userinfo trick)
      if (!atSymbolInUrlFound && fullUrl.includes('@')) {
        atSymbolInUrlFound = true
        hits.push({
          rule: 'email_link_at_symbol',
          reason: 'Email contains a URL with an "@" symbol (often used to obscure destination host)',
          score: 20,
        })
      }
    } catch {
      // Unparsable regex match — ignore gracefully
    }
  }

  // 5. Check for HTML anchor display text mismatch (e.g. <a href="evil.com">paypal.com</a>)
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  let anchorMatch: RegExpExecArray | null
  while ((anchorMatch = anchorRegex.exec(content)) !== null) {
    const href = anchorMatch[1]
    const text = anchorMatch[2].replace(/<[^>]+>/g, '').trim()

    // If anchor text looks like a domain / URL, check if host matches href host
    const textUrlMatch = text.match(/^(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (textUrlMatch) {
      const textHost = textUrlMatch[1].toLowerCase().replace(/^www\./, '')
      try {
        const hrefUrl = href.startsWith('http') ? href : `https://${href}`
        const hrefHost = new URL(hrefUrl).hostname.toLowerCase().replace(/^www\./, '')

        if (textHost && hrefHost && textHost !== hrefHost && !hrefHost.endsWith(`.${textHost}`)) {
          hits.push({
            rule: 'email_mismatched_anchor',
            reason: `Email contains a deceptive link: display text shows "${textHost}" but links to "${hrefHost}"`,
            score: 35,
          })
          break // one mismatch hit is sufficient
        }
      } catch {
        // ignore malformed href
      }
    }
  }

  return hits
}

/** Rule: Keyword matches from active DB keywords (or fallback defaults) */
function checkKeywords(content: string, keywords: DbKeyword[]): RuleHit[] {
  const contentLower = content.toLowerCase()
  const hits: RuleHit[] = []

  for (const { keyword, weight, category } of keywords) {
    if (contentLower.includes(keyword.toLowerCase())) {
      hits.push({
        rule: `keyword:${keyword}`,
        reason: `Email content contains suspicious term "${keyword}" (category: ${category})`,
        score: weight,
      })
    }
  }

  return hits
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Export: runEmailRules
// Pure function, zero I/O, returns RuleHit[] only.
// scoring.ts handles score summation and risk level determination.
// ─────────────────────────────────────────────────────────────────────────────

export function runEmailRules(content: string, keywords: DbKeyword[]): RuleHit[] {
  if (!content || !content.trim()) {
    return []
  }

  const structuralHits: (RuleHit | null)[] = [
    checkUrgencyPatterns(content),
    checkCredentialHarvesting(content),
    checkFinancialFraud(content),
    checkExcessiveCaps(content),
  ]

  const hits: RuleHit[] = [
    ...structuralHits.filter((h): h is RuleHit => h !== null),
    ...checkEmailLinks(content),
    ...checkKeywords(content, keywords),
  ]

  return hits
}
