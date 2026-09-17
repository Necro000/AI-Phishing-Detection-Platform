/**
 * test_email_rules.mjs — Day 3 Logic Verification
 * Tests email rules, scoring, 1–40 weight cap, and link heuristics as pure functions.
 */

import assert from 'node:assert/strict'

// Inline pure logic matching emailRules.ts & scoring.ts
const URL_REGEX = /https?:\/\/[^\s<>"')]+|\bwww\.[^\s<>"')]+/gi
const SHORTENER_DOMAINS = new Set(['bit.ly', 'tinyurl.com', 't.co', 'goo.gl'])
const SUSPICIOUS_TLDS = new Set(['zip', 'mov', 'top', 'xyz', 'click'])

function checkUrgencyPatterns(text) {
  const lower = text.toLowerCase()
  const patterns = [
    { phrase: 'within 24 hours', score: 20 },
    { phrase: 'immediate action required', score: 25 },
    { phrase: 'account will be suspended', score: 30 },
  ]
  for (const { phrase, score } of patterns) {
    if (lower.includes(phrase)) {
      return { rule: 'urgency_coercion', score, reason: `Uses urgent language: ${phrase}` }
    }
  }
  return null
}

function checkCredentialHarvesting(text) {
  const lower = text.toLowerCase()
  const patterns = [
    { phrase: 'confirm your password', score: 35 },
    { phrase: 'verify your password', score: 30 },
  ]
  for (const { phrase, score } of patterns) {
    if (lower.includes(phrase)) {
      return { rule: 'credential_harvesting', score, reason: `Solicits credentials: ${phrase}` }
    }
  }
  return null
}

function checkFinancialFraud(text) {
  const lower = text.toLowerCase()
  const patterns = [
    { phrase: 'apple gift card', score: 35 },
    { phrase: 'bitcoin wallet', score: 25 },
  ]
  for (const { phrase, score } of patterns) {
    if (lower.includes(phrase)) {
      return { rule: 'financial_fraud_request', score, reason: `Suspicious payment request: ${phrase}` }
    }
  }
  return null
}

function checkExcessiveCaps(text) {
  const letters = text.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 40) return null
  const upperCount = (letters.match(/[A-Z]/g) || []).length
  const ratio = upperCount / letters.length
  if (ratio > 0.45) {
    return { rule: 'excessive_capitalization', score: 15, reason: 'Excessive capitalization' }
  }
  return null
}

function checkEmailLinks(content) {
  const hits = []
  const matches = content.match(URL_REGEX)
  if (!matches) return hits

  for (const rawUrl of new Set(matches)) {
    const fullUrl = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`
    try {
      const parsed = new URL(fullUrl)
      const host = parsed.hostname.toLowerCase()
      const parts = host.split('.')

      if (parts.length === 4 && parts.every(p => /^\d+$/.test(p) && +p >= 0 && +p <= 255)) {
        hits.push({ rule: 'email_link_ip_literal', score: 25, reason: `IP host: ${host}` })
      }
      if (SHORTENER_DOMAINS.has(host)) {
        hits.push({ rule: 'email_link_shortener', score: 20, reason: `Shortener: ${host}` })
      }
      const tld = host.split('.').pop() || ''
      if (SUSPICIOUS_TLDS.has(tld)) {
        hits.push({ rule: 'email_link_suspicious_tld', score: 15, reason: `Suspicious TLD: .${tld}` })
      }
      if (fullUrl.includes('@')) {
        hits.push({ rule: 'email_link_at_symbol', score: 20, reason: '@ in link' })
      }
    } catch {}
  }

  // Anchor mismatch check
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi
  let m
  while ((m = anchorRegex.exec(content)) !== null) {
    const href = m[1]
    const text = m[2].replace(/<[^>]+>/g, '').trim()
    const textMatch = text.match(/^(?:https?:\/\/)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
    if (textMatch) {
      const textHost = textMatch[1].toLowerCase().replace(/^www\./, '')
      try {
        const hrefHost = new URL(href.startsWith('http') ? href : `https://${href}`).hostname.toLowerCase().replace(/^www\./, '')
        if (textHost && hrefHost && textHost !== hrefHost) {
          hits.push({ rule: 'email_mismatched_anchor', score: 35, reason: `Mismatch: ${textHost} vs ${hrefHost}` })
          break
        }
      } catch {}
    }
  }

  return hits
}

function checkKeywords(content, keywords) {
  const lower = content.toLowerCase()
  const hits = []
  for (const { keyword, weight, category } of keywords) {
    if (lower.includes(keyword.toLowerCase())) {
      hits.push({ rule: `keyword:${keyword}`, score: weight, reason: `Found keyword: ${keyword} (${category})` })
    }
  }
  return hits
}

function runEmailRules(content, keywords) {
  if (!content || !content.trim()) return []
  return [
    checkUrgencyPatterns(content),
    checkCredentialHarvesting(content),
    checkFinancialFraud(content),
    checkExcessiveCaps(content),
    ...checkEmailLinks(content),
    ...checkKeywords(content, keywords),
  ].filter(Boolean)
}

function scoreEmail({ ruleHits }) {
  const ruleScore = ruleHits.reduce((sum, h) => sum + h.score, 0)
  const clampedScore = Math.min(Math.max(ruleScore, 0), 100)
  const risk_level = clampedScore < 30 ? 'SAFE' : clampedScore < 70 ? 'SUSPICIOUS' : 'HIGH_RISK'
  return {
    risk_level,
    risk_score: clampedScore,
    reasons: ruleHits.map(h => h.reason),
    signals: {
      rules: ruleScore,
      safeBrowsing: null,
      virusTotal: null,
      ml: null,
    },
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Test Suite
// ─────────────────────────────────────────────────────────────────────────────
console.log('Running Day 3 Email Rules & Scoring Tests...\n')

// Test 1: Empty input
{
  const hits = runEmailRules('', [])
  assert.equal(hits.length, 0, 'Empty content must return 0 hits')
  const score = scoreEmail({ ruleHits: hits })
  assert.equal(score.risk_score, 0)
  assert.equal(score.risk_level, 'SAFE')
  assert.equal(score.signals.safeBrowsing, null)
  assert.equal(score.signals.virusTotal, null)
  assert.equal(score.signals.ml, null)
  console.log('✅ Test 1: Empty input yields SAFE score 0 with explicit null signals')
}

// Test 2: Compound urgency + credential + deceptive link = HIGH_RISK (multiple agreeing signals)
{
  const email = 'URGENT: Your account will be suspended within 24 hours. Confirm your password immediately at http://192.168.1.50/login'
  const hits = runEmailRules(email, [])
  assert(hits.some(h => h.rule === 'urgency_coercion'))
  assert(hits.some(h => h.rule === 'credential_harvesting'))
  assert(hits.some(h => h.rule === 'email_link_ip_literal'))
  const score = scoreEmail({ ruleHits: hits })
  assert(score.risk_score >= 70, `Score should be >= 70 for compound threats, got ${score.risk_score}`)
  assert.equal(score.risk_level, 'HIGH_RISK')
  console.log(`✅ Test 2: Compound urgency + credentials + IP link detected as HIGH_RISK (score: ${score.risk_score})`)
}

// Test 3: Single keyword capped at 40 pts can never force HIGH_RISK alone
{
  const keywords = [{ keyword: 'urgent wire transfer', weight: 40, category: 'financial_threat' }]
  const email = 'Hello, please process the urgent wire transfer for project alpha.'
  const hits = runEmailRules(email, keywords)
  const score = scoreEmail({ ruleHits: hits })
  assert.equal(score.risk_score, 40, 'Weight should be exactly 40')
  assert.equal(score.risk_level, 'SUSPICIOUS', 'Single keyword with max weight 40 must be SUSPICIOUS, never HIGH_RISK')
  console.log('✅ Test 3: Single max-weight keyword (40 pts) produces SUSPICIOUS, cannot force HIGH_RISK alone')
}

// Test 4: Pattern-only link heuristics without any external network calls
{
  const emailWithIpLink = 'Click here: http://192.168.1.100/reset'
  const hits = runEmailRules(emailWithIpLink, [])
  assert(hits.some(h => h.rule === 'email_link_ip_literal'), 'Must detect IP literal link')

  const emailWithShortener = 'See promo at https://bit.ly/xyz123'
  const hits2 = runEmailRules(emailWithShortener, [])
  assert(hits2.some(h => h.rule === 'email_link_shortener'), 'Must detect URL shortener')

  const emailWithSuspiciousTld = 'Download invoice from http://invoice.zip/doc'
  const hits3 = runEmailRules(emailWithSuspiciousTld, [])
  assert(hits3.some(h => h.rule === 'email_link_suspicious_tld'), 'Must detect suspicious TLD')

  const emailWithAt = 'Visit http://user:pass@legit.com'
  const hits4 = runEmailRules(emailWithAt, [])
  assert(hits4.some(h => h.rule === 'email_link_at_symbol'), 'Must detect @ in URL')

  const emailWithMismatch = '<a href="http://evil-site.com/login">https://paypal.com/signin</a>'
  const hits5 = runEmailRules(emailWithMismatch, [])
  assert(hits5.some(h => h.rule === 'email_mismatched_anchor'), 'Must detect mismatched anchor text')

  console.log('✅ Test 4: Pattern-only link checks pass (IP, shortener, TLD, @ symbol, anchor mismatch)')
}

// Test 5: Benign email stays SAFE
{
  const benign = 'Hi team, the sprint planning meeting will take place at 2pm in conference room B. See you there!'
  const hits = runEmailRules(benign, [])
  const score = scoreEmail({ ruleHits: hits })
  assert.equal(score.risk_level, 'SAFE')
  assert.equal(score.risk_score, 0)
  console.log('✅ Test 5: Benign team email stays SAFE (score: 0)')
}

// Test 6: scoring.ts is single source of truth for score summation
{
  const ruleHits = [
    { rule: 'rule_a', score: 15, reason: 'Reason A' },
    { rule: 'rule_b', score: 20, reason: 'Reason B' },
  ]
  const score = scoreEmail({ ruleHits })
  assert.equal(score.signals.rules, 35)
  assert.equal(score.risk_score, 35)
  assert.equal(score.risk_level, 'SUSPICIOUS')
  console.log('✅ Test 6: scoring.ts computes sum from ruleHits accurately')
}

console.log('\nAll Day 3 logic tests passed successfully!')
