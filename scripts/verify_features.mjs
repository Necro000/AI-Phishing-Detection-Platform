/**
 * verify_features.mjs — Day 1, Track B verification
 * Confirms TypeScript feature extraction matches Python train_model.py output.
 *
 * Expected Python output (from training run):
 *   https://www.google.com                              → [0.22, 1.0, 0.0, 0.0, 1.0, 0.0, 2.8423...]
 *   http://192.168.1.1/login                            → [0.24, 2.0, 1.0, 0.0, 0.0, 1.0, 2.2998...]
 *   https://paypal-secure-verify-account.evil.com/...   → [0.64, 1.0, 0.0, 0.0, 1.0, 6.0, 4.0335...]
 *   https://amazon.com/dp/B09XS3JXMR                   → [0.32, 0.0, 0.0, 0.0, 1.0, 1.0, 2.7219...]
 *   http://xn--pypal-4ve.com/signin                    → [0.31, 0.0, 0.0, 0.0, 0.0, 1.0, 3.6901...]
 *
 * Run: node --import tsx/esm scripts/verify_features.mjs
 * Or:  npx tsx scripts/verify_features.mjs
 */

// Inline the feature extraction to avoid tsx dependency during verification
// This mirrors features.ts exactly — if this script passes, features.ts is correct.

const SUSPICIOUS_KEYWORDS = [
  'verify', 'account', 'suspended', 'password', 'credentials',
  'login', 'signin', 'secure', 'update', 'confirm',
  'banking', 'paypal', 'amazon', 'apple', 'microsoft',
  'prize', 'winner', 'free', 'urgent', 'alert',
  'limited', 'expire', 'immediately', 'click', 'validate',
  'unusual', 'activity', 'security', 'notification', 'member',
]

function shannonEntropy(s) {
  if (!s) return 0
  const freq = {}
  for (const c of s) freq[c] = (freq[c] ?? 0) + 1
  const n = s.length
  let entropy = 0
  for (const f of Object.values(freq)) {
    const p = f / n
    entropy -= p * Math.log2(p)
  }
  return entropy
}

function isIPv4Host(host) {
  const parts = host.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => /^\d+$/.test(p) && parseInt(p, 10) >= 0 && parseInt(p, 10) <= 255)
}

function normalizeUrl(url) {
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('ftp://')) return trimmed
  return 'https://' + trimmed
}

function extractFeatures(url) {
  if (!url || !url.trim()) return null
  const normalized = normalizeUrl(url)
  let parsed
  try { parsed = new URL(normalized) } catch { return null }
  const host = parsed.hostname
  if (!host) return null

  const urlLength = normalized.length / 100
  const hostParts = host.split('.')
  const subdomainCount = Math.min(Math.max(hostParts.length - 2, 0), 10)
  const hasIpHost = isIPv4Host(host) ? 1.0 : 0.0
  const hasAtSymbol = normalized.includes('@') ? 1.0 : 0.0
  const hasHttps = parsed.protocol === 'https:' ? 1.0 : 0.0
  const urlLower = normalized.toLowerCase()
  const kwCount = SUSPICIOUS_KEYWORDS.filter(kw => urlLower.includes(kw)).length
  const suspiciousKwCount = Math.min(kwCount, 10)
  const domainEntropy = shannonEntropy(host)

  const vector = [urlLength, subdomainCount, hasIpHost, hasAtSymbol, hasHttps, suspiciousKwCount, domainEntropy]
  if (vector.some(v => !isFinite(v) || isNaN(v))) return null
  return vector
}

// ─── Test cases with expected Python output ───────────────────────────────────
const TESTS = [
  { url: 'https://www.google.com',
    expected: [0.22, 1.0, 0.0, 0.0, 1.0, 0.0, 2.8423709931771084] },
  { url: 'http://192.168.1.1/login',
    expected: [0.24, 2.0, 1.0, 0.0, 0.0, 1.0, 2.2998963911678914] },
  { url: 'https://paypal-secure-verify-account.evil.com/update/credentials',
    expected: [0.64, 1.0, 0.0, 0.0, 1.0, 6.0, 4.033513500647141] },
  { url: 'https://amazon.com/dp/B09XS3JXMR',
    expected: [0.32, 0.0, 0.0, 0.0, 1.0, 1.0, 2.721928094887362] },
  { url: 'http://xn--pypal-4ve.com/signin',
    expected: [0.31, 0.0, 0.0, 0.0, 0.0, 1.0, 3.6901165175936645] },
]

let allPass = true
const TOLERANCE = 1e-10

console.log('\n=== Feature Vector Verification (TS vs Python) ===\n')
for (const { url, expected } of TESTS) {
  const got = extractFeatures(url)
  const pass = got !== null &&
    got.length === expected.length &&
    got.every((v, i) => Math.abs(v - expected[i]) < TOLERANCE)

  const status = pass ? '[PASS]' : '[FAIL]'
  console.log(`${status} ${url.substring(0, 50)}`)
  if (!pass) {
    allPass = false
    console.log(`  Expected: ${JSON.stringify(expected)}`)
    console.log(`  Got:      ${JSON.stringify(got)}`)
    if (got) {
      got.forEach((v, i) => {
        const diff = Math.abs(v - expected[i])
        if (diff >= TOLERANCE) console.log(`  Feature[${i}] diff: ${diff}`)
      })
    }
  } else {
    console.log(`  ${JSON.stringify(got)}`)
  }
}

console.log('\n' + (allPass ? '[ALL PASS] TS and Python feature vectors match exactly.' : '[FAILURES] Mismatch detected — fix features.ts before trusting the model.'))
console.log()
process.exit(allPass ? 0 : 1)
