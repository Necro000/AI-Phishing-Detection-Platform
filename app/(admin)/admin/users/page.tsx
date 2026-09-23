/**
 * Admin Users page — Server Component
 *
 * Verifies admin role server-side from DB before rendering.
 * Aggregates user accounts, sole root admin status, threat vectors, and recent scans.
 * Upgraded to Zero Trust User Threat Console with interactive slide-out drawer.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { Navbar } from '@/components/Navbar'
import AdminUsersConsole from '@/components/admin/users/AdminUsersConsole'
import { EnrichedUser, UserScanSummary } from '@/components/admin/users/UserThreatDrawer'
import { CyberTerminalIcon, CyberShieldIcon, CyberRadarIcon, CyberUserIcon } from '@/components/icons/CyberIcons'

export default async function AdminUsersPage() {
  const cookieStore = await cookies()

  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch { /* ignore */ }
        },
      },
    }
  )

  const { data: { user } } = await sessionClient.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  // Fetch profiles + scans in parallel
  const [
    { data: profilesData },
    { data: scansData },
  ] = await Promise.all([
    serviceClient
      .from('profiles')
      .select('id, role, created_at')
      .order('created_at', { ascending: false }),
    serviceClient
      .from('scans')
      .select('id, user_id, input, scan_type, risk_level, risk_score, created_at')
      .order('created_at', { ascending: false }),
  ])

  // Fetch user emails from auth admin
  const emailById: Record<string, string> = {}
  try {
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authData?.users ?? []) {
      emailById[u.id] = u.email ?? '(no email)'
    }
  } catch (err) {
    console.warn('[admin/users] Could not fetch auth.users email list:', err)
  }

  // Precompute scan aggregations per user
  const userScansMap: Record<string, UserScanSummary[]> = {}
  const safeCountMap: Record<string, number> = {}
  const suspiciousCountMap: Record<string, number> = {}
  const highRiskCountMap: Record<string, number> = {}

  for (const scan of scansData ?? []) {
    const uid = scan.user_id
    if (!userScansMap[uid]) userScansMap[uid] = []
    if (userScansMap[uid].length < 5) {
      userScansMap[uid].push({
        id: scan.id,
        input: scan.input,
        scan_type: scan.scan_type,
        risk_level: scan.risk_level,
        risk_score: scan.risk_score,
        created_at: scan.created_at,
      })
    }

    if (scan.risk_level === 'SAFE') {
      safeCountMap[uid] = (safeCountMap[uid] ?? 0) + 1
    } else if (scan.risk_level === 'SUSPICIOUS') {
      suspiciousCountMap[uid] = (suspiciousCountMap[uid] ?? 0) + 1
    } else if (scan.risk_level === 'HIGH_RISK') {
      highRiskCountMap[uid] = (highRiskCountMap[uid] ?? 0) + 1
    }
  }

  const enrichedUsers: EnrichedUser[] = (profilesData ?? []).map((p) => {
    const safeCount = safeCountMap[p.id] ?? 0
    const suspiciousCount = suspiciousCountMap[p.id] ?? 0
    const highRiskCount = highRiskCountMap[p.id] ?? 0
    const totalCount = safeCount + suspiciousCount + highRiskCount

    return {
      id: p.id,
      email: emailById[p.id] ?? '(unknown)',
      role: p.role as string,
      created_at: p.created_at,
      scan_count: totalCount,
      safe_count: safeCount,
      suspicious_count: suspiciousCount,
      high_risk_count: highRiskCount,
      recent_scans: userScansMap[p.id] ?? [],
    }
  })

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl"
      />

      {/* Global Navbar */}
      <Navbar userEmail={user.email} role="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        {/* ── Navigation Header ──────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1.5">
              <Link href="/dashboard" className="hover:text-cyan-400 transition">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-400">Admin</span>
              <span>/</span>
              <span className="text-cyan-400 flex items-center gap-1">
                <CyberTerminalIcon size={12} />
                User Identities
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Cyber SOC — User Directory &amp; Threat Profiles</span>
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-purple-300">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span>ROOT AUTHORITY: SOHIT@GMAIL.COM // 1 ADMIN</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Zero Trust user registry, privilege tiering, and individual threat exposure audit
            </p>
          </div>

          {/* Sub-navigation tabs */}
          <div className="inline-flex p-1 rounded-full bg-slate-900/90 border border-white/10 text-xs font-semibold backdrop-blur-xl">
            <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5">
              <CyberUserIcon size={13} />
              Users
            </span>
            <Link
              href="/admin/scans"
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              <CyberRadarIcon size={13} />
              All Scans
            </Link>
            <Link
              href="/admin/keywords"
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              <CyberShieldIcon size={13} />
              Keywords &amp; IOCs
            </Link>
          </div>
        </div>

        {/* Client User Directory & Threat Inspector Console */}
        <AdminUsersConsole initialUsers={enrichedUsers} />
      </main>
    </div>
  )
}
