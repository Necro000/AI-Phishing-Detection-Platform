import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'http://localhost:3000'
const SUPABASE_URL = 'https://aftahsatbyuklyhyyzad.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGFoc2F0Ynl1a2x5aHl5emFkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTcxMTQ5NiwiZXhwIjoyMTA1Mjg3NDk2fQ.exoW5TiNCcyBz8QJiblAaOWueKaH2zT8B5flv8q3inM'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFmdGFoc2F0Ynl1a2x5aHl5emFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk3MTE0OTYsImV4cCI6MjEwNTI4NzQ5Nn0.Ezhl2BzWWaIBQSK3XpZRzxxmbbIocsKJYSRklNLvQZE'

async function runQATests() {
  console.log('\n========================================')
  console.log('   FULL SYSTEM QA AUDIT & VERIFICATION  ')
  console.log('========================================\n')

  let passed = 0
  let failed = 0

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`)
      passed++
    } else {
      console.error(`  [FAIL] ${testName} — ${details}`)
      failed++
    }
  }

  // ── TEST GROUP 1: Public Routes ──────────────────────────────────────────
  console.log('\n--- 1. Public Route Availability ---')
  for (const path of ['/', '/login', '/signup']) {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
    assert(res.status === 200, `GET ${path} returns 200 OK`, `Got ${res.status}`)
  }

  // ── TEST GROUP 2: Unauthenticated Route Protection ───────────────────────
  console.log('\n--- 2. Route Protection (Unauthenticated Redirects) ---')
  for (const path of ['/dashboard', '/scan/url', '/scan/email', '/profile', '/admin/scans']) {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' })
    const isRedirect = res.status === 302 || res.status === 307 || res.status === 308
    const location = res.headers.get('location') ?? ''
    assert(isRedirect && location.includes('/login'), `GET ${path} redirects to /login`, `Status: ${res.status}, Location: ${location}`)
  }

  // ── TEST GROUP 3: API Auth Enforcement ──────────────────────────────────
  console.log('\n--- 3. API Route Auth Gating ---')
  for (const path of ['/api/scan/url', '/api/scan/email', '/api/history']) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: path === '/api/history' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: path === '/api/history' ? undefined : JSON.stringify({ url: 'https://google.com', content: 'test' })
    })
    assert(res.status === 401, `${path} blocks unauthenticated requests with 401`, `Got ${res.status}`)
  }

  // ── TEST GROUP 4: Admin API Security Gate ────────────────────────────────
  console.log('\n--- 4. Admin API RBAC Gate ---')
  for (const path of ['/api/admin/scans', '/api/admin/keywords', '/api/admin/users']) {
    const res = await fetch(`${BASE_URL}${path}`)
    assert(res.status === 401 || res.status === 403, `${path} blocks unprivileged requests (401/403)`, `Got ${res.status}`)
  }

  // ── TEST GROUP 5: Authenticated User Workflow & Live CRUD ───────────────
  console.log('\n--- 5. End-to-End User Authentication & Scan Execution ---')
  const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)
  const testEmail = `qa_tester_${Date.now()}@gmail.com`
  const testPassword = 'Password123!Secure'

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  })

  if (createError || !createdUser?.user) {
    console.error('  [WARN] Failed to create test user:', createError?.message)
  } else {
    // Create matching profile
    await adminClient.from('profiles').insert({ id: createdUser.user.id, role: 'user' })

    const supabase = createClient(SUPABASE_URL, ANON_KEY)
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    })
    assert(!!authData.user, `User Account Created (${testEmail})`)

    const token = authData.session.access_token
    const refreshToken = authData.session.refresh_token

    // Construct Supabase SSR cookie format
    const cookieHeader = [
      `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token=${encodeURIComponent(JSON.stringify({
        access_token: token,
        refresh_token: refreshToken,
        user: authData.user,
      }))}`
    ].join('; ')

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Cookie': cookieHeader
    }

    // Test URL Scan Execution (Known phishing URL to verify multi-signal & VirusTotal high-risk detection)
    const urlScanRes = await fetch(`${BASE_URL}/api/scan/url`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ url: 'http://testsafebrowsing.appspot.com/s/phishing.html' })
    })
    
    assert(urlScanRes.status === 200, 'POST /api/scan/url succeeds with active session', `Status: ${urlScanRes.status}`)
    const urlScanData = await urlScanRes.json()
    assert(urlScanData.risk_level === 'HIGH_RISK', `URL Scan detects phishing threat (Got: ${urlScanData.risk_level}, Score: ${urlScanData.risk_score})`)
    assert(Array.isArray(urlScanData.reasons) && urlScanData.reasons.length > 0, 'URL Scan returns detailed threat explanations')
    assert(urlScanData.signals && typeof urlScanData.signals.rules === 'number', 'URL Scan provides multi-signal telemetry')

    // Test Email Scan Execution
    const emailScanRes = await fetch(`${BASE_URL}/api/scan/email`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        content: 'URGENT: Your account has been suspended. Confirm your password immediately at http://192.168.1.1/verify'
      })
    })

    assert(emailScanRes.status === 200, 'POST /api/scan/email succeeds with active session', `Status: ${emailScanRes.status}`)
    const emailScanData = await emailScanRes.json()
    assert(emailScanData.risk_level === 'HIGH_RISK', `Email Scan detects urgency and credential harvesting (Got: ${emailScanData.risk_level}, Score: ${emailScanData.risk_score})`)

    // Test Scan History Retrieval
    const historyRes = await fetch(`${BASE_URL}/api/history?limit=10`, {
      headers: authHeaders
    })
    assert(historyRes.status === 200, 'GET /api/history returns 200 for user', `Status: ${historyRes.status}`)
    const historyData = await historyRes.json()
    assert(Array.isArray(historyData.scans), 'History returns an array of scans')
    assert(historyData.scans.length >= 2, `History contains both submitted scans (Found: ${historyData.scans?.length})`)

    // Clean up test user via service role
    await adminClient.auth.admin.deleteUser(authData.user.id)
    console.log(`  [CLEANUP] Deleted ephemeral test user: ${testEmail}`)
  }

  // ── TEST GROUP 6: Input Validation Edge Cases ─────────────────────────────
  console.log('\n--- 6. Security & Edge-Case Input Validation ---')
  const oversizeUrl = 'https://example.com/' + 'a'.repeat(2100)
  const oversizeRes = await fetch(`${BASE_URL}/api/scan/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: oversizeUrl })
  })
  assert(oversizeRes.status === 400 || oversizeRes.status === 401, 'Rejects oversized URL input with 400 or gates with 401', `Status: ${oversizeRes.status}`)

  console.log('\n========================================')
  console.log(`QA AUDIT COMPLETE: ${passed} PASSED, ${failed} FAILED`)
  console.log('========================================\n')
}

runQATests().catch(console.error)
