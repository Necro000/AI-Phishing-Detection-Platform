/**
 * Admin Scans page ("Reports" view) — Server Component
 *
 * Per Context.md §4: Reports = admin query over scans table, not a separate table.
 * Role verified server-side before rendering.
 * Edge-Cases.md: Admin browser is NOT a trusted context — raw user inputs are safely escaped.
 * Edge-Cases.md: Paginated view for large scan volume.
 *
 * v2 (SOC Upgrade): Added KPI telemetry cards, multi-dimensional server-side
 * filtering (q, verdict, type), and forensic investigation drawer via
 * AdminScansTable + AdminThreatDrawer client components.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { Navbar } from '@/components/Navbar'
import AdminThreatKpis from '@/components/AdminThreatKpis'
import AdminScansTable from '@/components/AdminScansTable'
import AdminScansFilterBar from '@/components/AdminScansFilterBar'
import { ScanActivityChart, DailyActivityPoint } from '@/components/ScanActivityChart'
import { CyberShieldIcon, CyberTerminalIcon, CyberRadarIcon } from '@/components/icons/CyberIcons'

interface Props {
  searchParams: Promise<{ page?: string; q?: string; verdict?: string; type?: string }>
}

interface ScanRow {
  id: string
  user_id: string
  scan_type: 'url' | 'email'
  input: string
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  risk_score: number
  reasons: string[]
  signals: {
    rules?: number | null
    safeBrowsing?: boolean | null
    virusTotal?: boolean | null
    vtVendors?: number | null
    ml?: number | null
  }
  created_at: string
}

const PAGE_SIZE = 25

/** Returns an ISO timestamp 24h ago. Server-only helper (not a hook or client render fn). */
function get24hAgoISO() {
  return new Date(Date.now() - 86400000).toISOString()
}

/** Returns an ISO timestamp 7 days ago. Server-only helper. */
function get7DaysAgoISO() {
  return new Date(Date.now() - 7 * 86400000).toISOString()
}

interface RawTimelineScan {
  created_at: string
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
}

function build7DayActivity(scans: RawTimelineScan[]): DailyActivityPoint[] {
  const points: DailyActivityPoint[] = []
  const now = new Date()

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000)
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-US', { weekday: 'short' })

    const matching = scans.filter((s) => s.created_at.startsWith(dateStr))
    const safe = matching.filter((s) => s.risk_level === 'SAFE').length
    const suspicious = matching.filter((s) => s.risk_level === 'SUSPICIOUS').length
    const highRisk = matching.filter((s) => s.risk_level === 'HIGH_RISK').length

    points.push({
      date: dateStr,
      label,
      safe,
      suspicious,
      highRisk,
      total: matching.length,
    })
  }

  return points
}

export default async function AdminScansPage({ searchParams }: Props) {
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

  // ── Parse search params ──────────────────────────────────────────────────────
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE
  const q = (params.q ?? '').trim()
  const verdict = params.verdict ?? ''
  const type = params.type ?? ''

  // ── Parallel: KPI aggregation + paginated filtered scans + 7-day timeline ─────
  const [
    { count: totalScans },
    { count: highRiskCount },
    { count: suspiciousCount },
    { count: urlCount },
    { count: emailCount },
    { count: last24hCount },
    { data: weeklyScansData },
  ] = await Promise.all([
    serviceClient.from('scans').select('*', { count: 'exact', head: true }),
    serviceClient.from('scans').select('*', { count: 'exact', head: true }).eq('risk_level', 'HIGH_RISK'),
    serviceClient.from('scans').select('*', { count: 'exact', head: true }).eq('risk_level', 'SUSPICIOUS'),
    serviceClient.from('scans').select('*', { count: 'exact', head: true }).eq('scan_type', 'url'),
    serviceClient.from('scans').select('*', { count: 'exact', head: true }).eq('scan_type', 'email'),
    serviceClient.from('scans').select('*', { count: 'exact', head: true })
      .gte('created_at', get24hAgoISO()),
    serviceClient.from('scans').select('created_at, risk_level')
      .gte('created_at', get7DaysAgoISO())
      .order('created_at', { ascending: true }),
  ])

  const weeklyActivity = build7DayActivity((weeklyScansData ?? []) as RawTimelineScan[])

  // ── Build filtered scans query ───────────────────────────────────────────────
  let filteredQuery = serviceClient
    .from('scans')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (q) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q)
    if (isUuid) {
      filteredQuery = filteredQuery.or(`id.eq.${q},user_id.eq.${q}`)
    } else {
      let matchedUserIds: string[] = []
      try {
        const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
        const qLower = q.toLowerCase()
        matchedUserIds = (authData?.users ?? [])
          .filter((u) => u.email?.toLowerCase().includes(qLower))
          .map((u) => u.id)
      } catch {
        // Fall back gracefully to input search only
      }

      if (matchedUserIds.length > 0) {
        filteredQuery = filteredQuery.or(
          `input.ilike.%${q}%,user_id.in.(${matchedUserIds.slice(0, 50).join(',')})`
        )
      } else {
        filteredQuery = filteredQuery.ilike('input', `%${q}%`)
      }
    }
  }
  if (verdict) filteredQuery = filteredQuery.eq('risk_level', verdict)
  if (type) filteredQuery = filteredQuery.eq('scan_type', type)

  const { data: scansData, count: filteredCount } = await filteredQuery.range(offset, offset + PAGE_SIZE - 1)

  const scans = (scansData ?? []) as ScanRow[]
  const totalFilteredCount = filteredCount ?? 0
  const totalPages = Math.ceil(totalFilteredCount / PAGE_SIZE)

  // ── Fetch user emails for scans on this page ─────────────────────────────────
  const userIds = [...new Set(scans.map((s) => s.user_id))]
  const emailById: Record<string, string> = {}
  if (userIds.length > 0) {
    try {
      const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
      for (const u of authData?.users ?? []) {
        if (userIds.includes(u.id)) {
          emailById[u.id] = u.email ?? '(no email)'
        }
      }
    } catch (err) {
      console.warn('[admin/scans] Could not fetch user emails:', err)
    }
  }

  // ── Enrich scan rows with user email ─────────────────────────────────────────
  const enrichedScans = scans.map((scan) => ({
    ...scan,
    user_email: emailById[scan.user_id] ?? (scan.user_id ? scan.user_id.slice(0, 8) + '…' : '(unknown)'),
  }))

  // ── Export rows (current filtered page for CSV) ───────────────────────────────
  const exportRows = enrichedScans.map((s) => ({
    id: s.id,
    user_email: s.user_email,
    scan_type: s.scan_type,
    input: s.input,
    risk_level: s.risk_level,
    risk_score: s.risk_score,
    created_at: s.created_at,
  }))

  // ── Build pagination href helper ─────────────────────────────────────────────
  function pageHref(p: number) {
    const sp = new URLSearchParams()
    sp.set('page', String(p))
    if (q) sp.set('q', q)
    if (verdict) sp.set('verdict', verdict)
    if (type) sp.set('type', type)
    return `/admin/scans?${sp.toString()}`
  }

  const hasActiveFilter = Boolean(q || verdict || type)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-cyan-500/10 via-blue-600/5 to-transparent blur-3xl"
      />

      {/* Global Navbar */}
      <Navbar userEmail={user.email} role="admin" />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-6">
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
                SOC Audit Log
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Cyber SOC — Threat Audit</span>
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>STATUS: ACTIVE // LIVE DATA</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Global threat telemetry &amp; forensic query inspector across all platform users
            </p>
          </div>

          {/* Sub-navigation tabs */}
          <div className="inline-flex p-1 rounded-full bg-slate-900/90 border border-white/10 text-xs font-semibold backdrop-blur-xl">
            <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5">
              <CyberRadarIcon size={13} />
              <span>All Scans</span>
            </span>
            <Link
              href="/admin/users"
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            >
              Users
            </Link>
            <Link
              href="/admin/keywords"
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            >
              Keywords
            </Link>
          </div>
        </div>

        {/* ── KPI Telemetry Cards ───────────────────────────────────────────── */}
        <AdminThreatKpis
          kpi={{
            totalScans: totalScans ?? 0,
            highRiskCount: highRiskCount ?? 0,
            suspiciousCount: suspiciousCount ?? 0,
            urlCount: urlCount ?? 0,
            emailCount: emailCount ?? 0,
            last24hCount: last24hCount ?? 0,
          }}
        />

        {/* ── 7-Day Timeline Chart ──────────────────────────────────────────── */}
        <ScanActivityChart data={weeklyActivity} />

        {/* ── Scans Table Bento Container ───────────────────────────────────── */}
        <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-6 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] overflow-hidden">
          {/* Top subtle cyan energy highlight */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>Scans Audit Log</span>
                <span className="text-xs font-mono font-normal text-slate-400">
                  ({hasActiveFilter ? `${totalFilteredCount} of ${totalScans ?? 0} records` : `${totalScans ?? 0} total records`})
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Interactive real-time incident records. Click any row to slide open full deep forensic details.
              </p>
            </div>

            {hasActiveFilter && (
              <Link
                href="/admin/scans"
                className="text-xs text-rose-400 hover:text-rose-300 transition flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 font-mono"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear All Filters
              </Link>
            )}
          </div>

          {/* Filter Bar (Client Component — needs Suspense for useSearchParams) */}
          <Suspense fallback={null}>
            <AdminScansFilterBar
              currentQ={q}
              currentVerdict={verdict}
              currentType={type}
              exportRows={exportRows}
            />
          </Suspense>

          {/* Interactive Table + Drawer */}
          <AdminScansTable scans={enrichedScans} />

          {/* ── Pagination Controls ─────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-6 font-mono text-xs text-slate-400">
              <div>
                Page <span className="text-white font-bold">{currentPage}</span> of {totalPages}
                <span className="ml-2 text-slate-500">({totalFilteredCount} records)</span>
              </div>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1)}
                    className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 rounded-xl text-xs text-slate-300 hover:text-white transition"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-600 cursor-not-allowed">
                    ← Previous
                  </span>
                )}
                {currentPage < totalPages ? (
                  <Link
                    href={pageHref(currentPage + 1)}
                    className="px-3 py-1.5 bg-slate-950/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-500/30 rounded-xl text-xs text-slate-300 hover:text-white transition"
                  >
                    Next →
                  </Link>
                ) : (
                  <span className="px-3 py-1.5 bg-slate-950/40 border border-white/5 rounded-xl text-xs text-slate-600 cursor-not-allowed">
                    Next →
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
