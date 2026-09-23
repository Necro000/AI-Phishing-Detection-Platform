/**
 * Admin Keywords page — Server Component
 *
 * Checks session and re-verifies admin role server-side from DB before fetching keywords.
 * Passes keywords to KeywordManager component.
 *
 * Upgraded to Unified SOC Bento Matrix (Option 1 + Option 2 Hybrid):
 * Telemetry KPIs + Cyber Rule Forge + Live Sandbox Simulator + Full-Width Catalog
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { Navbar } from '@/components/Navbar'
import KeywordManager, { KeywordItem } from '@/components/KeywordManager'
import { CyberTerminalIcon, CyberShieldIcon, CyberRadarIcon, CyberUserIcon } from '@/components/icons/CyberIcons'

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
                Detection Signatures
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <span>Cyber SOC — Detection Signatures &amp; IOC Matrix</span>
              </h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>STATUS: ARMED // ENGINE ACTIVE</span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure heuristic rule weights (1–40 pts), threat vectors, and test payloads in live sandbox
            </p>
          </div>

          {/* Sub-navigation tabs */}
          <div className="inline-flex p-1 rounded-full bg-slate-900/90 border border-white/10 text-xs font-semibold backdrop-blur-xl">
            <Link
              href="/admin/users"
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              <CyberUserIcon size={13} />
              Users
            </Link>
            <Link
              href="/admin/scans"
              className="px-3.5 py-1.5 rounded-full text-slate-400 hover:text-white transition flex items-center gap-1.5"
            >
              <CyberRadarIcon size={13} />
              All Scans
            </Link>
            <span className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20 flex items-center gap-1.5">
              <CyberShieldIcon size={13} />
              Keywords &amp; IOCs
            </span>
          </div>
        </div>

        {/* Client Keyword Manager (Unified SOC Bento Matrix) */}
        <KeywordManager initialKeywords={keywords} />
      </main>
    </div>
  )
}
