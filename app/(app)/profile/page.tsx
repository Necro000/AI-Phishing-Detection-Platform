import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { Navbar } from '@/components/Navbar'
import { ProfileSecurityForm } from './ProfileSecurityForm'
import { CyberShieldIcon } from '@/components/icons/CyberIcons'
import Link from 'next/link'

export const metadata = {
  title: 'Profile & Security Center | AI Phishing Defense',
  description: 'Manage account security, inspect role credentials, and update access passwords.',
}

export default async function ProfilePage() {
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
            // Safe guard
          }
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirectTo=/profile')
  }

  const serviceClient = createServiceClient()

  // Fetch user role from profiles table
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role, created_at')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'user'
  const accountCreatedAt = profile?.created_at || user.created_at

  // Fetch user scan metrics
  const { data: scans } = await serviceClient
    .from('scans')
    .select('id, risk_level')
    .eq('user_id', user.id)

  const totalScans = scans?.length ?? 0
  const highRiskCount = scans?.filter((s) => s.risk_level === 'HIGH_RISK').length ?? 0
  const suspiciousCount = scans?.filter((s) => s.risk_level === 'SUSPICIOUS').length ?? 0
  const safeCount = scans?.filter((s) => s.risk_level === 'SAFE').length ?? 0
  const threatsDetected = highRiskCount + suspiciousCount

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar userEmail={user.email} role={userRole} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-300 mb-2">
            <CyberShieldIcon size={14} glow />
            <span>Identity & Access Management</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Security Center & Profile</h1>
          <p className="text-sm text-slate-400 mt-1">
            Review security clearance, account credentials, and authentication settings.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Identity & Role Credentials */}
          <div className="lg:col-span-1 space-y-6">
            {/* Identity Card */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-transparent" />

              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-xl font-bold text-white shadow-lg shadow-blue-600/30">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-white truncate">{user.email}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                        userRole === 'admin'
                          ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                          : 'bg-blue-500/15 border-blue-500/30 text-blue-300'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {userRole.toUpperCase()} CLEARANCE
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 text-xs font-mono border-t border-white/10 pt-4">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Account UUID</span>
                  <span className="text-slate-300 select-all break-all">{user.id}</span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Registered Since</span>
                  <span suppressHydrationWarning className="text-slate-300">
                    {accountCreatedAt ? new Date(accountCreatedAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Database Security</span>
                  <span className="text-emerald-400 flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Row-Level Security (RLS) Active
                  </span>
                </div>
              </div>
            </div>

            {/* Scan Metrics Card */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
                <span>Lifetime Threat Activity</span>
                <Link href="/dashboard" className="text-blue-400 hover:text-blue-300 text-[11px] font-mono">
                  View Scans &rarr;
                </Link>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                  <span className="text-slate-400 text-[11px] block">Total Scans</span>
                  <span className="text-2xl font-bold font-mono text-white mt-1 block">{totalScans}</span>
                </div>

                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <span className="text-red-300 text-[11px] block">Threats Found</span>
                  <span className="text-2xl font-bold font-mono text-red-400 mt-1 block">
                    {threatsDetected}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                  <span className="text-emerald-300 text-[11px] block">Clean URLs</span>
                  <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">{safeCount}</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <span className="text-amber-300 text-[11px] block">Suspicious</span>
                  <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
                    {suspiciousCount}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Security Controls & Password Change */}
          <div className="lg:col-span-2">
            <ProfileSecurityForm userEmail={user.email ?? ''} />
          </div>
        </div>
      </main>
    </div>
  )
}
