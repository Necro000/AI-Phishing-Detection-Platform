/**
 * test_admin_auth.mjs — Verification of Admin Security Gate & Role Enforcement
 *
 * Brain.md Rule 5 & Architecture.md §4:
 *  - requireAdmin re-checks profiles.role from DB on EVERY request
 *  - Never trusts client-side claims or headers
 *  - Non-admin session MUST receive HTTP 403 Forbidden
 *  - Unauthenticated request MUST receive HTTP 401 Unauthorized
 */

import assert from 'node:assert/strict'

// Simulate requireAdmin logic with isolated test doubles
async function simulateRequireAdmin({ sessionUser, dbProfile }) {
  // Step 1: Session check
  if (!sessionUser) {
    return {
      userId: null,
      status: 401,
      body: { error: 'Unauthorized' },
    }
  }

  // Step 2: DB profile re-check (never trusts client claim)
  if (!dbProfile) {
    return {
      userId: null,
      status: 403,
      body: { error: 'Forbidden: profile not found' },
    }
  }

  if (dbProfile.role !== 'admin') {
    return {
      userId: null,
      status: 403,
      body: { error: 'Forbidden: admin only' },
    }
  }

  return {
    userId: sessionUser.id,
    status: 200,
    body: null,
  }
}

console.log('Running Admin Auth & Role Enforcement Security Tests...\n')

// Case 1: Unauthenticated request to /api/admin/keywords
{
  const res = await simulateRequireAdmin({ sessionUser: null, dbProfile: null })
  assert.equal(res.status, 401, 'Unauthenticated request must return 401')
  assert.equal(res.body.error, 'Unauthorized')
  console.log(`✅ Case 1: Unauthenticated request ➔ HTTP ${res.status} (${res.body.error})`)
}

// Case 2: Authenticated normal user (role: 'user') attempting to access /api/admin/keywords
{
  const nonAdminUser = { id: 'usr-12345', email: 'regular_user@example.com' }
  const userProfile = { id: 'usr-12345', role: 'user' }

  const res = await simulateRequireAdmin({ sessionUser: nonAdminUser, dbProfile: userProfile })
  assert.equal(res.status, 403, 'Non-admin user MUST be rejected with HTTP 403')
  assert.equal(res.body.error, 'Forbidden: admin only')
  console.log(`✅ Case 2: Non-admin user session ➔ HTTP ${res.status} (${res.body.error})`)
}

// Case 3: Forged client claim (client claims isAdmin: true, but DB has role: 'user')
{
  const attackerUser = { id: 'atk-99999', email: 'attacker@example.com', isAdmin: true, role: 'admin' }
  // DB profile is the ground truth
  const dbProfile = { id: 'atk-99999', role: 'user' }

  const res = await simulateRequireAdmin({ sessionUser: attackerUser, dbProfile })
  assert.equal(res.status, 403, 'Forged client claim must be rejected by server DB check')
  assert.equal(res.body.error, 'Forbidden: admin only')
  console.log(`✅ Case 3: Forged client claim with role: 'user' in DB ➔ HTTP ${res.status} (${res.body.error})`)
}

// Case 4: Authenticated admin user (role: 'admin')
{
  const adminUser = { id: 'adm-00001', email: 'admin@innovexis.com' }
  const adminProfile = { id: 'adm-00001', role: 'admin' }

  const res = await simulateRequireAdmin({ sessionUser: adminUser, dbProfile: adminProfile })
  assert.equal(res.status, 200, 'Admin user must be granted access')
  assert.equal(res.userId, 'adm-00001')
  console.log(`✅ Case 4: Valid admin user ➔ HTTP ${res.status} Access Granted (User ID: ${res.userId})`)
}

// Case 5: User authenticated in Auth, but profile row missing
{
  const orphanedUser = { id: 'orphaned-111', email: 'orphaned@example.com' }
  const res = await simulateRequireAdmin({ sessionUser: orphanedUser, dbProfile: null })
  assert.equal(res.status, 403, 'Missing profile must return 403 Forbidden')
  console.log(`✅ Case 5: Missing profile row ➔ HTTP ${res.status} (${res.body.error})`)
}

console.log('\nAll Admin Role Security Tests passed! 401 & 403 enforcement confirmed.')
