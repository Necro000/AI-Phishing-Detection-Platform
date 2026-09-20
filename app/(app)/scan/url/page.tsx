'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ScanResult } from '@/lib/ruleEngine/scoring'
import { Navbar } from '@/components/Navbar'
import { RiskGauge } from '@/components/RiskGauge'
import { useToast } from '@/components/ToastProvider'
import { createBrowserClient } from '@/lib/supabaseClient'

type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'

interface FullScanResult extends ScanResult {
  degraded?: {
    safeBrowsing?: boolean
    virusTotal?: boolean
  }
}

const SAMPLE_URLS = [
  {
    title: 'PayPal IP Spoof',
    category: 'Known Phishing',
    url: 'http://192.168.1.1/paypal/login.php',
  },
  {
    title: 'Apple ID Typosquat',
    category: 'Homograph/Phish',
    url: 'https://app1e-security-check.com/signin',
  },
  {
    title: 'Legitimate GitHub Domain',
    category: 'Benign Example',
    url: 'https://github.com/microsoft/vscode',
  },
]

export default function ScanUrlPage() {
  const toast = useToast()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [userRole, setUserRole] = useState<string>('user')

  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FullScanResult | null>(null)

  // Fetch session for Navbar
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserEmail(user.email)
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          if (profile?.role) setUserRole(profile.role)
        }
      } catch {
        // Fallback to default
      }
    }
    loadUser()
  }, [])

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    const trimmed = url.trim()
    if (!trimmed) {
      toast.warning('Input Required', 'Please enter a target URL to analyze.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/scan/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error('Scan Error', data.error ?? 'URL analysis failed.')
      } else {
        const scanResult = data as FullScanResult
        setResult(scanResult)

        if (scanResult.risk_level === 'HIGH_RISK') {
          toast.threat(
            'Hostile Phishing Threat Flagged!',
            `Risk Score: ${scanResult.risk_score}/100. High-probability malicious link detected.`
          )
        } else if (scanResult.risk_level === 'SUSPICIOUS') {
          toast.warning(
            'Suspicious Indicators Found',
            `Risk Score: ${scanResult.risk_score}/100. Potential brand spoofing or abnormal domain structure.`
          )
        } else {
          toast.success(
            'URL Verified Safe',
            `Risk Score: ${scanResult.risk_score}/100. No security threats detected.`
          )
        }
      }
    } catch {
      toast.error('Network Error', 'Unable to reach the scanning server. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setUrl('')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar userEmail={userEmail} role={userRole} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-cyan-400">URL Threat Inspector</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>🔗 Multi-Signal URL Phishing Scanner</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Real-time deep inference combining Rule Engine heuristics, ML classifier, Safe Browsing, and VirusTotal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
            >
              Clear Workspace
            </button>
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Scanner Input (Col 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-500/40 via-cyan-400/40 to-transparent" />

              <form onSubmit={handleScan} className="space-y-4">
                <label
                  htmlFor="url-input"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Target URL / Domain
                </label>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 text-sm">
                      🌐
                    </span>
                    <input
                      id="url-input"
                      type="text"
                      autoComplete="off"
                      autoFocus
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="e.g. https://account-update.verify-paypal.com/auth"
                      className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-white/15 rounded-xl text-white placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !url.trim()}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Scanning 4 Signals…</span>
                      </>
                    ) : (
                      'Inspect Threat'
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 pt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    ML Model (235k dataset)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    20+ Heuristic Rules
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    VirusTotal Multi-AV
                  </span>
                </div>
              </form>
            </div>

            {/* Quick Threat Test Samples */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Pre-Loaded Test Vectors
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_URLS.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => {
                      setUrl(sample.url)
                      setResult(null)
                    }}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/10 hover:border-blue-500/40 hover:bg-blue-950/20 text-left transition-all cursor-pointer group"
                  >
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-cyan-400 border border-white/10">
                      {sample.category}
                    </span>
                    <p className="text-xs font-medium text-slate-200 mt-1.5 group-hover:text-blue-300">
                      {sample.title}
                    </p>
                    <p className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      {sample.url}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Bento (Col 8-12) */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />

                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Analysis Breakdown
                  </h2>
                  <span className="text-[10px] font-mono text-slate-500 select-all">
                    Scan ID: {result.id ? result.id.slice(0, 8) : 'Real-time'}
                  </span>
                </div>

                {/* Risk Gauge */}
                <div className="my-3">
                  <RiskGauge
                    score={result.risk_score}
                    level={result.risk_level as RiskLevel}
                    size={170}
                  />
                </div>

                {/* Multi-Signal Matrix */}
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                    Signal Matrix
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10">
                      <span className="text-slate-500 text-[10px] block">ML Inference</span>
                      <span className="text-cyan-400 font-bold mt-0.5 block">
                        {result.signals.ml !== null ? `${result.signals.ml} pts` : 'Bypassed'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10">
                      <span className="text-slate-500 text-[10px] block">Heuristic Score</span>
                      <span className="text-blue-400 font-bold mt-0.5 block">
                        {result.signals.rules} pts
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10">
                      <span className="text-slate-500 text-[10px] block">VirusTotal</span>
                      <span
                        className={`font-bold mt-0.5 block ${
                          result.degraded?.virusTotal
                            ? 'text-amber-400'
                            : result.signals.virusTotal
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {result.degraded?.virusTotal
                          ? 'Degraded'
                          : result.signals.virusTotal
                          ? 'Malicious'
                          : 'Clean'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10">
                      <span className="text-slate-500 text-[10px] block">Safe Browsing</span>
                      <span
                        className={`font-bold mt-0.5 block ${
                          result.degraded?.safeBrowsing
                            ? 'text-slate-400'
                            : result.signals.safeBrowsing
                            ? 'text-red-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {result.degraded?.safeBrowsing
                          ? 'Degraded'
                          : result.signals.safeBrowsing
                          ? 'Blacklisted'
                          : 'Clean'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Threat Reasons */}
                <div className="mt-5 border-t border-white/10 pt-4 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Diagnostic Traces ({result.reasons.length})
                  </h3>
                  {result.reasons.length === 0 ? (
                    <p className="text-xs text-emerald-400 font-mono">
                      ✅ No anomalies detected across all heuristics.
                    </p>
                  ) : (
                    <ul className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {result.reasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="p-2.5 rounded-lg bg-slate-950/80 border border-white/5 text-xs text-slate-300 flex items-start gap-2 leading-relaxed"
                        >
                          <span className="text-amber-400">⚠️</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[360px] bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-slate-500 mb-3">
                  🌐
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Scanner on Standby</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Enter a target domain or test sample on the left to run cross-layer threat analysis.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
