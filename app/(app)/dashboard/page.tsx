import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseClient'

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
  { label: string; text: string; bg: string; border: string }
> = {
  SAFE: { label: 'Safe', text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  SUSPICIOUS: { label: 'Suspicious', text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  HIGH_RISK: { label: 'High Risk', text: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
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

  const isAdmin = profile?.role === 'admin'

  // Fetch recent scans and aggregate stats for this user
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

  async function signOut() {
    'use server'
    const cookieStore2 = await cookies()
    const supabase2 = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore2.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore2.set(name, value, options)
              })
            } catch { /* ignore */ }
          },
        },
      }
    )
    await supabase2.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
              {isAdmin && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Admin
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Signed in as <span className="text-slate-200">{user.email}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-xl border border-blue-500/30 transition-colors text-sm font-medium"
              >
                Admin Panel →
              </Link>
            )}
            <form action={signOut}>
              <button
                id="signout-btn"
                type="submit"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors text-sm"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/scan/url"
            id="nav-scan-url"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/40 transition group backdrop-blur-sm"
          >
            <div className="text-3xl mb-2">🔗</div>
            <h2 className="text-lg font-semibold text-white group-hover:text-blue-300 transition">
              Scan URL
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Analyze a web link with heuristic rules, Safe Browsing, VirusTotal, and ML
            </p>
          </Link>
          <Link
            href="/scan/email"
            id="nav-scan-email"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 hover:border-blue-500/40 transition group backdrop-blur-sm"
          >
            <div className="text-3xl mb-2">📧</div>
            <h2 className="text-lg font-semibold text-white group-hover:text-blue-300 transition">
              Analyze Email & Message
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Check email text for coercive urgency, credential harvesting, and suspicious patterns
            </p>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-2xl font-bold text-white">{totalScans}</div>
            <div className="text-xs text-slate-400 mt-1">Recent Scans</div>
          </div>
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl backdrop-blur-sm">
            <div className="text-2xl font-bold text-emerald-400">{safeCount}</div>
            <div className="text-xs text-slate-400 mt-1">Safe Verdicts</div>
          </div>
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl backdrop-blur-sm">
            <div className="text-2xl font-bold text-amber-400">{suspiciousCount}</div>
            <div className="text-xs text-slate-400 mt-1">Suspicious Verdicts</div>
          </div>
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl backdrop-blur-sm">
            <div className="text-2xl font-bold text-red-400">{highRiskCount}</div>
            <div className="text-xs text-slate-400 mt-1">High Risk Detected</div>
          </div>
        </div>

        {/* Recent Scans Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Scan History</h2>
            <span className="text-xs text-slate-400">Showing up to 20 recent items</span>
          </div>

          {scans.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <div className="text-4xl mb-3">🛡️</div>
              <h3 className="text-sm font-medium text-white mb-1">No scans yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                Your scan activity and threat reports will be recorded here automatically.
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  href="/scan/url"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition"
                >
                  Scan URL
                </Link>
                <Link
                  href="/scan/email"
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition"
                >
                  Analyze Email
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th scope="col" className="py-3 px-3">Type</th>
                    <th scope="col" className="py-3 px-3">Target / Preview</th>
                    <th scope="col" className="py-3 px-3">Verdict</th>
                    <th scope="col" className="py-3 px-3">Score</th>
                    <th scope="col" className="py-3 px-3 text-right">Scanned At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scans.map((scan) => {
                    const badge = RISK_BADGE[scan.risk_level] ?? RISK_BADGE.SUSPICIOUS
                    return (
                      <tr key={scan.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 border border-white/10">
                            {scan.scan_type === 'url' ? '🔗 URL' : '📧 Email'}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs sm:max-w-md truncate font-mono text-xs">
                          {/* Safe React text-escaping — never dangerously rendered */}
                          {scan.input}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {badge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap font-medium text-white">
                          {scan.risk_score} <span className="text-xs text-slate-500">/100</span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-right text-xs text-slate-400">
                          {new Date(scan.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
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
      </div>
    </main>
  )
}
