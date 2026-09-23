import Link from 'next/link'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { StatsBar } from '@/components/landing/StatsBar'
import { FeatureBentoCards } from '@/components/landing/FeatureBentoCards'
import { SiteFooter } from '@/components/landing/SiteFooter'

export const metadata: Metadata = {
  title: 'AI Phishing Detection Platform · Enterprise Multi-Signal Cyber Defense',
  description:
    'Detect deceptive URLs and hostile email phishing attacks using rule heuristics, Google Safe Browsing, VirusTotal multi-scanner, and trained PhiUSIIL ML models.',
}

export default async function HomePage() {
  const headersList = await headers()
  const host = headersList.get('host') || ''

  // When deployed on Render (Backend Service), redirect root URL immediately to pure API JSON
  if (host.includes('onrender.com') || process.env.RENDER === 'true') {
    redirect('/api')
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
      {/* Background ambient lighting effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/15 via-cyan-500/10 to-transparent blur-3xl" />
        <div className="absolute top-96 left-1/4 w-[500px] h-[300px] bg-purple-600/10 blur-[120px]" />
      </div>

      {/* Top Announcement Bar */}
      <div className="relative z-10 pt-8 flex justify-center px-4">
        <Link
          href="/scan/url"
          className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-950/40 hover:bg-blue-900/50 backdrop-blur-xl text-xs font-mono text-blue-300 hover:text-blue-200 transition-all shadow-lg shadow-blue-500/10 hover:border-blue-400"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-white">Live Threat Engine</span>
          <span className="text-slate-400">·</span>
          <span>4 Signal Sources Active</span>
          <span className="group-hover:translate-x-0.5 transition-transform text-blue-400">→</span>
        </Link>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-4 pt-8 pb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 shadow-xl shadow-blue-500/20 mb-6">
          <span className="text-3xl" aria-hidden="true">🛡️</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl leading-[1.1]">
          AI Phishing Detection{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-400">
            Engineered for Precision
          </span>
        </h1>

        <p className="text-base sm:text-xl text-slate-300 mt-6 max-w-2xl leading-relaxed">
          Evaluate any URL or suspicious email in under 3 seconds. Four independent forensic signals combine rule heuristics, Google Safe Browsing, VirusTotal, and trained machine learning.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-sm sm:max-w-none">
          <Link
            href="/signup"
            id="cta-signup"
            className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-blue-600/30 hover:shadow-blue-500/50 hover:scale-[1.02] text-center"
          >
            Start Scanning Free
          </Link>
          <Link
            href="/login"
            id="cta-login"
            className="px-8 py-3.5 bg-white/5 hover:bg-white/10 text-slate-200 hover:text-white font-semibold rounded-xl border border-white/10 hover:border-white/25 transition-all duration-200 text-center backdrop-blur-sm"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Product In Hero: Live High-Fidelity Scan Mockup (Resend style) */}
        <div className="mt-14 w-full max-w-4xl mx-auto text-left">
          <div className="rounded-3xl border border-white/15 bg-slate-900/85 backdrop-blur-2xl shadow-2xl shadow-blue-950/80 overflow-hidden ring-1 ring-white/10">
            {/* Window bar */}
            <div className="px-5 py-3.5 bg-slate-950/70 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-xs font-mono text-slate-400 ml-3">
                  ai-phishing-defense://inspector/v2
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
                  ● Scan Completed in 2.1s
                </span>
              </div>
            </div>

            {/* Target input row */}
            <div className="p-6 border-b border-white/10 bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 font-mono text-xs font-bold">
                  URL
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs text-slate-400 font-mono">Target Analyzed:</div>
                  <div className="text-sm sm:text-base font-mono font-medium text-rose-300 truncate">
                    https://paypa1-security-auth.top/login/index.php
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold text-xs">
                  HIGH_RISK · 92 / 100
                </span>
              </div>
            </div>

            {/* Forensic Grid */}
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/40">
              {/* Signal 1: Heuristics */}
              <div className="p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-300 font-semibold">
                    1. Lexical Rules
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold">+35 pts</span>
                </div>
                <div className="text-xs text-slate-300 mt-2 font-medium">
                  Typosquatting &amp; Hyphen Abuse
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Matches known brand spoofing pattern targeting PayPal.
                </p>
              </div>

              {/* Signal 2: Safe Browsing */}
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-rose-300 font-semibold">
                    2. Safe Browsing
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    MATCH
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-2 font-medium">
                  Social Engineering Flag
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Google threat feed verified malicious phishing target.
                </p>
              </div>

              {/* Signal 3: VirusTotal */}
              <div className="p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-rose-300 font-semibold">
                    3. VirusTotal
                  </span>
                  <span className="text-xs font-mono text-rose-400 font-bold">18 / 89</span>
                </div>
                <div className="text-xs text-slate-300 mt-2 font-medium">
                  Multi-Vendor Detections
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Kaspersky, Fortinet, Sophos flag host as phishing.
                </p>
              </div>

              {/* Signal 4: PhiUSIIL ML */}
              <div className="p-4 rounded-2xl border border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-purple-300 font-semibold">
                    4. PhiUSIIL ML
                  </span>
                  <span className="text-xs font-mono text-purple-400 font-bold">96.4%</span>
                </div>
                <div className="text-xs text-slate-300 mt-2 font-medium">
                  Probability Inference
                </div>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                  Logistic model confidence capped at +25 safe limit.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsBar />

      {/* Feature Bento Grid */}
      <FeatureBentoCards />

      {/* Bottom CTA Banner */}
      <section className="px-4 py-16 max-w-5xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-blue-900/30 via-slate-900/80 to-slate-950 p-8 sm:p-12 text-center backdrop-blur-xl shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Ready to verify hostile targets?
            </h3>
            <p className="text-slate-300 text-sm sm:text-base mt-3 leading-relaxed">
              Experience deterministic forensic security without false assumptions. Free for internal security teams and individual developers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 hover:scale-[1.02] transition-all"
              >
                Create Free Account
              </Link>
              <Link
                href="/scan/url"
                className="px-8 py-3.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl border border-white/15 transition-all"
              >
                Launch Threat Scanner
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 blur-3xl pointer-events-none rounded-full"
          />
        </div>
      </section>

      {/* Modern Multi-Column Footer */}
      <SiteFooter />
    </main>
  )
}
