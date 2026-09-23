import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServiceClient } from '@/lib/supabaseServiceClient'
import { Navbar } from '@/components/Navbar'
import { DashboardHistoryTable } from '@/components/DashboardHistoryTable'
import { BentoQuickScanner } from '@/components/BentoQuickScanner'
import { BentoThreatRadar } from '@/components/BentoThreatRadar'
import { BentoTelemetryCards } from '@/components/BentoTelemetryCards'
import { BentoRecentThreats } from '@/components/BentoRecentThreats'

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

  // Check role
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'user'

  // Fetch recent scans
  const { data: scansData } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const scans = (scansData ?? []) as ScanRow[]
  const highRiskCount = scans.filter((s) => s.risk_level === 'HIGH_RISK').length

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col relative overflow-hidden">
      {/* Ambient Deep Space Cyber Mesh with Subtle Scatter Dots */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#030712] to-[#030712] pointer-events-none" />
      <div className="absolute top-10 left-1/3 w-[600px] h-[350px] bg-cyan-500/[0.04] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[350px] bg-blue-600/[0.04] rounded-full blur-[150px] pointer-events-none" />

      {/* Global Top Navbar */}
      <Navbar userEmail={user.email} role={userRole} />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative z-10">
        {/* Sub-Header matching Mockup */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-white/10 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px] truncate max-w-[160px] sm:max-w-none">{user.email}</span>
            </div>
          </div>
        </div>

        {/* Bento Row 1: Quick Scanner (5 cols) + Telemetry Stack (3 cols) + Threat Radar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Top-Left: Instant In-Place Scanner */}
          <div className="lg:col-span-5 flex flex-col">
            <BentoQuickScanner />
          </div>

          {/* Top-Middle: 99.4% Precision & 142ms Latency Stack */}
          <div className="lg:col-span-3 flex flex-col">
            <BentoTelemetryCards />
          </div>

          {/* Top-Right: Circular Threat Radar */}
          <div className="lg:col-span-4 flex flex-col">
            <BentoThreatRadar threatCount={highRiskCount} />
          </div>
        </div>

        {/* Bento Row 2: Recent Threat Callouts (4 cols) + Scan History Table (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Bottom-Left: Credential Harvester & Typosquatting Stack */}
          <div className="lg:col-span-4 flex flex-col">
            <BentoRecentThreats scans={scans} />
          </div>

          {/* Bottom-Right: Scan History Table */}
          <div className="lg:col-span-8 flex flex-col">
            <DashboardHistoryTable initialScans={scans} />
          </div>
        </div>
      </main>
    </div>
  )
}
