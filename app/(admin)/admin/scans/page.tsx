/**
 * Admin Scans page ("Reports" view) — Server Component
 *
 * Per Context.md §4: Reports = admin query over scans table, not a separate table.
 * Role verified server-side before rendering.
 * Edge-Cases.md: Admin browser is NOT a trusted context — raw user inputs are safely escaped.
 * Edge-Cases.md: Paginated view for large scan volume.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseServiceClient'

interface Props {
  searchParams: Promise<{ page?: string }>
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

const PAGE_SIZE = 25

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

  // Pagination calculation
  const params = await searchParams
  const currentPage = Math.max(1, parseInt(params.page ?? '1', 10) || 1)
  const offset = (currentPage - 1) * PAGE_SIZE

  // Fetch paginated scans for all users
  const { data: scansData, count } = await serviceClient
    .from('scans')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const scans = (scansData ?? []) as ScanRow[]
  const totalCount = count ?? 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Fetch user emails for this page
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link href="/dashboard" className="hover:text-slate-200">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-200">Admin</span>
              <span>/</span>
              <span className="text-blue-400">All Scans</span>
            </div>
            <h1 className="text-3xl font-bold text-white">All Platform Scans</h1>
            <p className="text-slate-400 text-sm mt-1">
              Global threat reports across all users (Context.md §4 Reports view)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              Users
            </Link>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white">
              All Scans
            </span>
            <Link
              href="/admin/keywords"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              Keywords
            </Link>
          </div>
        </div>

        {/* Scans Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Scans Audit Log</h2>
            <span className="text-xs text-slate-400">Total Scans: {totalCount}</span>
          </div>

          {scans.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
              <p className="text-sm text-slate-400">No scans recorded across the platform yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="py-3 px-3">User</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Target / Payload</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3">Score</th>
                    <th className="py-3 px-3">Signals</th>
                    <th className="py-3 px-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {scans.map((scan) => {
                    const badge = RISK_BADGE[scan.risk_level] ?? RISK_BADGE.SUSPICIOUS
                    const userEmail = emailById[scan.user_id] ?? scan.user_id.slice(0, 8) + '...'
                    return (
                      <tr key={scan.id} className="hover:bg-white/5 transition">
                        <td className="py-3 px-3 text-xs text-slate-300 font-mono whitespace-nowrap">
                          {/* Safe React text-escaping */}
                          {userEmail}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10">
                            {scan.scan_type === 'url' ? '🔗 URL' : '📧 Email'}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs truncate font-mono text-xs text-slate-200">
                          {/* Safe React text escaping — never dangerouslySetInnerHTML */}
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
                        <td className="py-3 px-3 whitespace-nowrap text-xs text-slate-400">
                          {scan.scan_type === 'url' ? (
                            <span>
                              R:{scan.signals?.rules ?? 0} | SB:{scan.signals?.safeBrowsing ? '🚨' : '—'} | VT:{scan.signals?.virusTotal ? '🚨' : '—'} | ML:{scan.signals?.ml !== null ? `${Math.round((scan.signals?.ml ?? 0) * 100)}%` : '—'}
                            </span>
                          ) : (
                            <span>R:{scan.signals?.rules ?? 0} (Rules Only)</span>
                          )}
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-4">
              <div className="text-xs text-slate-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                {currentPage > 1 ? (
                  <Link
                    href={`/admin/scans?page=${currentPage - 1}`}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-slate-600 cursor-not-allowed">
                    Previous
                  </span>
                )}
                {currentPage < totalPages ? (
                  <Link
                    href={`/admin/scans?page=${currentPage + 1}`}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-slate-300"
                  >
                    Next
                  </Link>
                ) : (
                  <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-xs text-slate-600 cursor-not-allowed">
                    Next
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
