/**
 * test_rules.mjs — Day 2 VERIFY
 * Tests rule engine and scoring logic end-to-end as pure functions.
 * No Supabase, no API keys needed.
 */

// Inline the core logic from urlRules and scoring for Node.js testing without tsx

// ── SSRF guard test ────────────────────────────────────────────────────────────
const PRIVATE_IP_PATTERNS = [
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^127\.\d+\.\d+\.\d+$/,
  /^::1$/,
  /^localhost$/i,
  /^0\.0\.0\.0$/,
]

function isPrivateOrLoopback(hostname) {
  return PRIVATE_IP_PATTERNS.some(pat => pat.test(hostname))
}

// ── URL normalization ──────────────────────────────────────────────────────────
function normalizeUrl(raw) {
  const t = raw.trim()
  if (t.startsWith('http://') || t.startsWith('https://') || t.startsWith('ftp://')) return t
  return 'https://' + t
}

// ── Score bands ────────────────────────────────────────────────────────────────
function scoreToLevel(score) {
  if (score <= 29) return 'SAFE'
  if (score <= 69) return 'SUSPICIOUS'
  return 'HIGH_RISK'
}

let pass = 0, fail = 0

function assert(desc, condition) {
  if (condition) {
    console.log(`[PASS] ${desc}`)
    pass++
  } else {
    console.error(`[FAIL] ${desc}`)
    fail++
  }
}

console.log('\n=== URL Rule Engine + Scoring Tests ===\n')

// ── SSRF guard ────────────────────────────────────────────────────────────────
assert('Private IP 192.168.1.1 detected as private',   isPrivateOrLoopback('192.168.1.1'))
assert('Private IP 10.0.0.1 detected as private',      isPrivateOrLoopback('10.0.0.1'))
assert('Loopback 127.0.0.1 detected as private',       isPrivateOrLoopback('127.0.0.1'))
assert('localhost detected as private',                 isPrivateOrLoopback('localhost'))
assert('google.com NOT private',                       !isPrivateOrLoopback('google.com'))
assert('evil.com NOT private',                         !isPrivateOrLoopback('evil.com'))

// ── URL normalization ─────────────────────────────────────────────────────────
assert('No-scheme URL gets https://',       normalizeUrl('google.com') === 'https://google.com')
assert('http:// URL preserved',             normalizeUrl('http://evil.com') === 'http://evil.com')
assert('https:// URL preserved',            normalizeUrl('https://safe.com') === 'https://safe.com')

// ── Score bands ───────────────────────────────────────────────────────────────
assert('Score 0 → SAFE',           scoreToLevel(0)   === 'SAFE')
assert('Score 29 → SAFE',          scoreToLevel(29)  === 'SAFE')
assert('Score 30 → SUSPICIOUS',    scoreToLevel(30)  === 'SUSPICIOUS')
assert('Score 69 → SUSPICIOUS',    scoreToLevel(69)  === 'SUSPICIOUS')
assert('Score 70 → HIGH_RISK',     scoreToLevel(70)  === 'HIGH_RISK')
assert('Score 100 → HIGH_RISK',    scoreToLevel(100) === 'HIGH_RISK')

// ── Safe Browsing override logic ───────────────────────────────────────────────
function applyOverrides(ruleScore, sbFlagged, sbDegraded, vtFlagged, vtDegraded, mlProb) {
  if (sbFlagged && !sbDegraded) return { score: 95, level: 'HIGH_RISK' }
  if (vtFlagged && !vtDegraded) return { score: 90, level: 'HIGH_RISK' }
  const mlContrib = mlProb !== null ? Math.min(Math.round(mlProb * 25), 25) : 0
  const combined = Math.max(0, Math.min(100, ruleScore + mlContrib))
  return { score: combined, level: scoreToLevel(combined) }
}

// SB flagged → always HIGH_RISK 95
const sbOverride = applyOverrides(10, true, false, false, false, 0)
assert('SB flagged → score=95, HIGH_RISK',  sbOverride.score === 95 && sbOverride.level === 'HIGH_RISK')

// VT flagged → HIGH_RISK 90
const vtOverride = applyOverrides(10, false, false, true, false, 0)
assert('VT flagged → score=90, HIGH_RISK',  vtOverride.score === 90 && vtOverride.level === 'HIGH_RISK')

// SB degraded should NOT override
const sbDegraded = applyOverrides(10, true, true, false, false, 0)
assert('SB degraded does NOT override',     sbDegraded.score !== 95)

// ML cap: probability 1.0 → contributes exactly 25 points max
const mlMax = applyOverrides(0, false, true, false, true, 1.0)
assert('ML probability 1.0 contributes exactly 25 pts', mlMax.score === 25)

// ML cap: probability 0.5 → 13 pts (round(0.5*25) = 13)
const mlHalf = applyOverrides(0, false, true, false, true, 0.5)
assert('ML probability 0.5 contributes 13 pts', mlHalf.score === 13)

// Combined: rules=50 + ML=25 = 75 → HIGH_RISK
const combined = applyOverrides(50, false, true, false, true, 1.0)
assert('Rules=50 + ML=25 → HIGH_RISK', combined.score === 75 && combined.level === 'HIGH_RISK')

// Both degraded: only rules count
const bothDegraded = applyOverrides(40, false, true, false, true, null)
assert('Both degraded, rules=40 → SUSPICIOUS', bothDegraded.score === 40 && bothDegraded.level === 'SUSPICIOUS')

// ── URL validation edge cases ─────────────────────────────────────────────────
function validateUrl(raw) {
  const norm = normalizeUrl(raw)
  try { new URL(norm); return true } catch { return false }
}

assert('Empty string → invalid',                    !validateUrl(''))
assert('Plain text → invalid after normalization',   !validateUrl('not a url at all !!!'))
assert('google.com → valid (normalized)',             validateUrl('google.com'))
assert('http://evil.com → valid',                    validateUrl('http://evil.com'))
assert('192.168.1.1 → valid URL (SSRF guard is separate)', validateUrl('192.168.1.1'))

console.log(`\n${ fail === 0 ? '[ALL PASS]' : `[${fail} FAILURES]` } ${pass} passed, ${fail} failed\n`)
process.exit(fail > 0 ? 1 : 0)
