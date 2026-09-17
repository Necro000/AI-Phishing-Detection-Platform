/**
 * Admin Scans page ("Reports" view) — Server Component
 * Per Context.md §4: Reports = admin query over scans table, not a separate table.
 * Role verified server-side before rendering.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabaseClient'

export default async function AdminScansPage() {
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

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">Admin — All Scans</h1>
        <p className="text-slate-400 mb-8">
          All users&apos; scan history (Reports view — Context.md §4).
        </p>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <p className="text-slate-500 text-sm">
            Scans table wired in Day 2, Track B — /api/admin/scans
          </p>
        </div>
      </div>
    </main>
  )
}
