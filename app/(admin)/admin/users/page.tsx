/**
 * Admin Users page — Server Component
 *
 * Verifies admin role server-side before rendering.
 * Displays all registered users, roles, and scan counts.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseClient'

interface UserSummary {
  id: string
  email: string
  role: string
  scan_count: number
  created_at?: string
}

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

  // Fetch profiles + scan count aggregations + auth users email
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('id, role, created_at')
    .order('created_at', { ascending: false })

  const { data: scanCounts } = await serviceClient
    .from('scans')
    .select('user_id')

  const countByUser: Record<string, number> = {}
  for (const { user_id } of (scanCounts ?? [])) {
    countByUser[user_id] = (countByUser[user_id] ?? 0) + 1
  }

  let emailById: Record<string, string> = {}
  try {
    const { data: authData } = await serviceClient.auth.admin.listUsers({ perPage: 1000 })
    for (const u of authData?.users ?? []) {
      emailById[u.id] = u.email ?? '(no email)'
    }
  } catch (err) {
    console.warn('[admin/users] Could not fetch auth.users email list:', err)
  }

  const users: UserSummary[] = (profiles ?? []).map((p) => ({
    id: p.id,
    email: emailById[p.id] ?? '(unknown)',
    role: p.role,
    scan_count: countByUser[p.id] ?? 0,
    created_at: p.created_at,
  }))

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link href="/dashboard" className="hover:text-slate-200">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-200">Admin</span>
              <span>/</span>
              <span className="text-blue-400">Users</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Registered Users</h1>
            <p className="text-slate-400 text-sm mt-1">
              All platform accounts, assigned roles, and scan activity volumes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white">
              Users
            </span>
            <Link
              href="/admin/scans"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              All Scans
            </Link>
            <Link
              href="/admin/keywords"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              Keywords
            </Link>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">User Directory</h2>
            <span className="text-xs text-slate-400">Total Users: {users.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Scans Performed</th>
                  <th className="py-3 px-3 text-right">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5 transition">
                    <td className="py-3 px-3 font-medium text-white">
                      {/* React safely escapes text preventing XSS */}
                      {u.email}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-white/10 text-slate-300 border border-white/10'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-semibold text-blue-400">{u.scan_count}</span>
                    </td>
                    <td className="py-3 px-3 text-right text-xs text-slate-400 whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}
