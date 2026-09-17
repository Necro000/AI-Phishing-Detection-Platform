/**
 * Admin Users page — Server Component
 * Verifies admin role server-side before rendering anything.
 * Data population wired in Day 2, Track B.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabaseClient'

export default async function AdminUsersPage() {
  const cookieStore = await cookies()

  // Step 1: get session user
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

  // Step 2: re-check role from DB — never trust client claim
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/dashboard')

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Admin — Users</h1>
        <p className="text-slate-400 mb-8">All registered users and their scan counts.</p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">
            User table wired in Day 2, Track B — /api/admin/users
          </p>
        </div>
      </div>
    </main>
  )
}
