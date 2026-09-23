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
  const patterns: { regex: RegExp; label: string; score: number }[] = [
    {
      regex: /\b(?:action required|immediate(?:ly)? action|act immediately|urgent(?:ly)? action|immediate attention required)\b/i,
      label: 'Action Required / Immediate Action Demand',
      score: 25,
    },
    {
      regex: /\b(?:expires? in \d+\s*(?:days?|hours?|mins?|minutes?)|will expire in|expir(?:ing|y) (?:soon|today|within)|deadline (?:is|approaching))\b/i,
      label: 'Imminent Expiration / Artificial Deadline Pressure',
      score: 25,
    },
    {
      regex: /\b(?:avoid losing access|loss of access|account (?:will be|has been) (?:suspended|terminated|disabled|locked|closed)|losing access to your (?:inbox|account|documents))\b/i,
      label: 'Threat of Account Suspension or Inbox Lockout',
      score: 30,
    },
    {
      regex: /\b(?:within (?:24|48|72|\d+)\s*(?:hours?|hrs?|days?)|failure to respond will result|unauthorized (?:login|access) detected|security compromised)\b/i,
      label: 'Time-Limited Coercion / Unauthorized Access Alarm',
      score: 25,
    },
  ]

  for (const { regex, label, score } of patterns) {
    if (regex.test(text)) {
      return {
        rule: 'urgency_coercion',
        reason: `Email uses urgent or coercive pressure tactics (${label})`,
        score,
      }
    }
  }
  return null
}

/** Rule: Credential & Identity Harvesting */
function checkCredentialHarvesting(text: string): RuleHit | null {
  const patterns: { regex: RegExp; label: string; score: number }[] = [
    {
      regex: /\b(?:password.*(?:will expire|expires?)|(?:re-?change|change|renew|keep.*same|update)\s+(?:your\s+)?(?:same\s+)?password)\b/i,
      label: 'Password Expiration or Renewal Prompt',
      score: 35,
    },
    {
      regex: /\b(?:verify your password|confirm your password|enter your (?:credentials|password|login)|provide your (?:password|credentials|social security)|update your (?:credentials|login details))\b/i,
      label: 'Direct Credential or Password Solicitation',
      score: 35,
    },
    {
      regex: /\b(?:send your (?:one-?time|otp|verification) code|provide the code sent to|share your 2fa code)\b/i,
      label: 'Two-Factor (2FA/OTP) Authentication Theft Lure',
      score: 35,
    },
    {
      regex: /\b(?:update your billing details immediately|verify your identity to restore)\b/i,
      label: 'Identity / Billing Verification Trap',
      score: 25,
    },
  ]

  for (const { regex, label, score } of patterns) {
    if (regex.test(text)) {
      return {
        rule: 'credential_harvesting',
        reason: `Email solicits credentials or authentication secrets (${label})`,
        score,
      }
    }
  }
  return null
}

/** Rule: IT Department & Authority Impersonation */
function checkAuthorityImpersonation(text: string): RuleHit | null {
  const patterns: { regex: RegExp; label: string; score: number }[] = [
    {
      regex: /\b(?:it (?:help\s*desk|support(?: team)?|department|admin|team)|system administrator|help\s*desk support|security operations team|account admin(?:istration)?)\b/i,
      label: 'IT Help Desk / Administrator Impersonation',
      score: 25,
    },
    {
      regex: /\b(?:microsoft 365 (?:support|team)|google workspace (?:support|team)|office 365 security|cisco webex security)\b/i,
      label: 'Cloud Platform Authority Spoofing',
      score: 25,
    },
  ]

  for (const { regex, label, score } of patterns) {
    if (regex.test(text)) {
      return {
        rule: 'authority_impersonation',
        reason: `Email impersonates trusted IT or administrative authority (${label})`,
        score,
      }
    }
  }
  return null
}

/** Rule: Generic Impersonal Salutation */
function checkGenericSalutation(text: string): RuleHit | null {
  const regex = /(?:^|\b|\W)(?:dear (?:email )?user|dear (?:valued )?customer|dear account (?:holder|owner|user)|dear client|dear member)(?:[,\s]|$)/i
  if (regex.test(text)) {
    return {
      rule: 'generic_salutation',
      reason: 'Email uses a generic, impersonal greeting ("Dear Email User") typical of automated mass phishing lures',
      score: 15,
    }
  }
  return null
}

/** Rule: Call-To-Action Link / Button Trap */
function checkCallToActionTraps(text: string): RuleHit | null {
  const regex = /\b(?:click (?:the|this)? (?:link|button) below|click here to (?:re-?change|reset|verify|confirm|update|keep)|follow (?:the|this) link below)\b/i
  if (regex.test(text)) {
    return {
      rule: 'call_to_action_trap',
      reason: 'Email coerces recipient to click an embedded action link for account/security remediation',
      score: 20,
    }
  }
  return null
}

/** Rule: Explicit Suspicious / Malicious Link Markers */
function checkSuspiciousLinkMarkers(text: string): RuleHit | null {
  const regex = /(?:\(malicious link\)|\(phishing link\)|\(untrusted link\)|\[malicious link\]|\[phishing link\])/i
  if (regex.test(text)) {
    return {
      rule: 'suspicious_link_marker',
      reason: 'Email contains explicit threat test notation or simulated malicious link marker',
      score: 25,
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
    checkAuthorityImpersonation(content),
    checkGenericSalutation(content),
    checkCallToActionTraps(content),
    checkSuspiciousLinkMarkers(content),
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
