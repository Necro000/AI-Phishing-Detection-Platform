import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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
            // Server Components can't set cookies after streaming starts; safe to ignore
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Middleware should catch this, but double-guard as defence-in-depth
  if (!user) redirect('/login')

  async function signOut() {
    'use server'
    const cookieStore2 = await cookies()
    const supabase2 = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore2.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore2.set(name, value, options)
            })
          },
        },
      }
    )
    await supabase2.auth.signOut()
    redirect('/login')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400 mt-1">Signed in as {user.email}</p>
          </div>
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

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <Link
            href="/scan/url"
            id="nav-scan-url"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="text-2xl mb-2">🔗</div>
            <h2 className="text-lg font-semibold text-white">Scan URL</h2>
            <p className="text-slate-400 text-sm mt-1">
              Check a link for phishing signals
            </p>
          </Link>
          <Link
            href="/scan/email"
            id="nav-scan-email"
            className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors"
          >
            <div className="text-2xl mb-2">📧</div>
            <h2 className="text-lg font-semibold text-white">Analyze Email</h2>
            <p className="text-slate-400 text-sm mt-1">
              Paste email content for threat analysis
            </p>
          </Link>
        </div>

        {/* Scan history placeholder — wired in Day 3 */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Scans</h2>
          <p className="text-slate-500 text-sm">
            Scan history will appear here. (Wired in Day 3 — /api/history)
          </p>
        </div>
      </div>
    </main>
  )
}
