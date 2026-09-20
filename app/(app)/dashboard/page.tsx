import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { Navbar } from '@/components/Navbar'

interface ScanRow {
  id: string
  user_id: string
  scan_type: 'url' | 'email'
  input: string
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  risk_score: number
  reasons: string[]
  signals: {
    rules: number
    safeBrowsing: boolean | null
    virusTotal: boolean | null
    ml: number | null
  }
  created_at: string
}

const RISK_BADGE: Record<
  string,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  SAFE: {
    label: 'Safe',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  SUSPICIOUS: {
    label: 'Suspicious',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    dot: 'bg-amber-400',
  },
  HIGH_RISK: {
    label: 'High Risk',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    dot: 'bg-red-400',
  },
}

export default async function DashboardPage() {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Server component cookie sync guard
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Check if current user is admin for quick navigation link
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'user'
  const isAdmin = userRole === 'admin'

  // Fetch recent scans for this user
  const { data: scansData } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const scans = (scansData ?? []) as ScanRow[]

  const totalScans = scans.length
  const safeCount = scans.filter((s) => s.risk_level === 'SAFE').length
  const suspiciousCount = scans.filter((s) => s.risk_level === 'SUSPICIOUS').length
  const highRiskCount = scans.filter((s) => s.risk_level === 'HIGH_RISK').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar userEmail={user.email} role={userRole} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300">
                Active Session
              </span>
              {isAdmin && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/25 text-purple-300">
                  Admin Privileged
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Threat Intelligence Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-slate-200 font-medium">{user.email}</span>. Monitor threats and run real-time scans.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/profile"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2"
            >
              <span>👤</span>
              <span>Security Center</span>
            </Link>
            {isAdmin && (
              <Link
                href="/admin/scans"
                className="px-4 py-2.5 rounded-xl border border-purple-500/30 bg-purple-600/20 hover:bg-purple-600/30 text-xs font-medium text-purple-200 transition-colors flex items-center gap-2"
              >
                <span>⚙️</span>
                <span>Admin Audit</span>
              </Link>
            )}
          </div>
        </div>

        {/* Bento Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 bg-slate-900/60 border border-white/10 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="text-slate-400 text-xs uppercase font-mono tracking-wider">Total Scans</div>
            <div className="text-3xl font-bold font-mono text-white mt-2">{totalScans}</div>
            <div className="text-[11px] text-slate-500 mt-1">Lifetime user activity</div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-red-500/20 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="text-red-300 text-xs uppercase font-mono tracking-wider">Hostile Threats</div>
            <div className="text-3xl font-bold font-mono text-red-400 mt-2">{highRiskCount}</div>
            <div className="text-[11px] text-red-300/70 mt-1">High-risk flagged links/emails</div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-amber-500/20 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="text-amber-300 text-xs uppercase font-mono tracking-wider">Suspicious</div>
            <div className="text-3xl font-bold font-mono text-amber-400 mt-2">{suspiciousCount}</div>
            <div className="text-[11px] text-amber-300/70 mt-1">Anomalous heuristics</div>
          </div>

          <div className="p-5 bg-slate-900/60 border border-emerald-500/20 rounded-2xl backdrop-blur-xl shadow-lg relative overflow-hidden">
            <div className="text-emerald-300 text-xs uppercase font-mono tracking-wider">Clean / Safe</div>
            <div className="text-3xl font-bold font-mono text-emerald-400 mt-2">{safeCount}</div>
            <div className="text-[11px] text-emerald-300/70 mt-1">Zero threat indicators</div>
          </div>
        </div>

        {/* Quick Launchers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Link
            href="/scan/url"
            className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl hover:border-blue-500/50 hover:bg-slate-900/80 transition-all group backdrop-blur-xl shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                🔗
              </div>
              <span className="text-xs text-blue-400 group-hover:translate-x-1 transition-transform font-mono">
                Launch Scanner &rarr;
              </span>
            </div>
            <h2 className="text-base font-bold text-white group-hover:text-blue-300 transition-colors">
              Multi-Signal URL Scanner
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Scan links with 20+ heuristic rules, ML model inference, Google Safe Browsing, and VirusTotal AV feeds.
            </p>
          </Link>

          <Link
            href="/scan/email"
            className="p-6 bg-slate-900/60 border border-white/10 rounded-2xl hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group backdrop-blur-xl shadow-xl relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                📧
              </div>
              <span className="text-xs text-cyan-400 group-hover:translate-x-1 transition-transform font-mono">
                Launch Analyzer &rarr;
              </span>
            </div>
            <h2 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
              Email & File Phishing Analyzer
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              Drag and drop .eml or text files to inspect coercive urgency, credential theft, and spoofed domains.
            </p>
          </Link>
        </div>

        {/* Scan History Table */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Recent Threat Inspections</h2>
              <p className="text-xs text-slate-400 mt-0.5">Audit log of your last 20 inspection queries</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{scans.length} records</span>
          </div>

          {scans.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <span className="text-3xl">🛡️</span>
              <p className="text-sm font-semibold text-slate-300 mt-2">No scans executed yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Start inspecting URLs or email files above to populate your threat intelligence history.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                    <th className="pb-3 pr-4">Type</th>
                    <th className="pb-3 pr-4">Target / Content</th>
                    <th className="pb-3 pr-4">Verdict</th>
                    <th className="pb-3 pr-4">Score</th>
                    <th className="pb-3 pr-4">Signals</th>
                    <th className="pb-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono">
                  {scans.map((scan) => {
                    const badge = RISK_BADGE[scan.risk_level] ?? RISK_BADGE.SAFE
                    return (
                      <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 pr-4">
                          <span className="px-2 py-0.5 rounded uppercase text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">
                            {scan.scan_type}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 max-w-xs truncate text-slate-200 font-sans">
                          {scan.input}
                        </td>
                        <td className="py-3.5 pr-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-white font-bold">{scan.risk_score}</td>
                        <td className="py-3.5 pr-4">
                          <div className="flex items-center gap-1 text-[10px]">
                            <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400" title="Rule Engine">
                              R:{scan.signals?.rules ?? 0}
                            </span>
                            {scan.signals?.ml !== null && scan.signals?.ml !== undefined && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300" title="ML Model">
                                ML:{scan.signals.ml}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 text-slate-400 text-[11px] font-sans">
                          {new Date(scan.created_at).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
