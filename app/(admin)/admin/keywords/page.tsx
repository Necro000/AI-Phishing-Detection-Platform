/**
 * Admin Keywords page — Server Component
 *
 * Checks session and re-verifies admin role server-side from DB before fetching keywords.
 * Passes keywords to KeywordManager component.
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import KeywordManager, { KeywordItem } from '@/components/KeywordManager'

export default async function AdminKeywordsPage() {
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

  // Fetch all keywords ordered by weight descending
  const { data: keywordsData } = await serviceClient
    .from('keywords')
    .select('id, keyword, weight, category, created_at')
    .order('weight', { ascending: false })

  const keywords = (keywordsData ?? []) as KeywordItem[]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
              <Link href="/dashboard" className="hover:text-slate-200">Dashboard</Link>
              <span>/</span>
              <span className="text-slate-200">Admin</span>
              <span>/</span>
              <span className="text-blue-400">Keywords</span>
            </div>
            <h1 className="text-3xl font-bold text-white">Detection Keywords</h1>
            <p className="text-slate-400 text-sm mt-1">
              Configure rule engine trigger words, categories, and risk weights (1–40 pts)
            </p>
          </div>

          {/* Admin Nav tabs */}
          <div className="flex items-center gap-2">
            <Link
              href="/admin/users"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              Users
            </Link>
            <Link
              href="/admin/scans"
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition"
            >
              All Scans
            </Link>
            <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 text-white">
              Keywords
            </span>
          </div>
        </div>

        {/* Client Keyword Manager */}
        <KeywordManager initialKeywords={keywords} />
      </div>
    </main>
  )
}
