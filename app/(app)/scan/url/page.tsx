'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ScanResult } from '@/lib/ruleEngine/scoring'

type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string; border: string; icon: string }> = {
  SAFE:      { label: 'Safe',      color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', icon: '✅' },
  SUSPICIOUS:{ label: 'Suspicious',color: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   icon: '⚠️' },
  HIGH_RISK: { label: 'High Risk', color: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/30',     icon: '🚨' },
}

interface Signals {
  rules: number
  safeBrowsing: boolean | null
  virusTotal: boolean | null
  ml: number | null
}

// Extended result shape including degraded flags surfaced from the API
interface FullScanResult extends ScanResult {
  degraded?: {
    safeBrowsing?: boolean
    virusTotal?: boolean
  }
}

function SignalBadge({ label, value, degraded }: { label: string; value: boolean | null | number | string; degraded?: boolean }) {
  let display = '—'
  let color = 'text-slate-400'
  let pill = ''

  if (degraded) {
    display = 'Degraded'
    color = 'text-orange-400'
    pill = 'border-orange-500/30'
  } else if (value === null) {
    display = 'N/A'
    color = 'text-slate-500'
    pill = ''
  } else if (typeof value === 'boolean') {
    display = value ? 'Flagged' : 'Clean'
    color = value ? 'text-red-400' : 'text-emerald-400'
  } else if (typeof value === 'number') {
    display = String(value)
    color = 'text-blue-400'
  } else {
    display = value
    color = 'text-blue-400'
  }

  return (
    <div className={`bg-white/5 border rounded-xl p-3 text-center ${pill || 'border-white/10'}`}>
      <div className={`text-sm font-semibold ${color}`}>{display}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function ScanUrlPage() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<FullScanResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const trimmed = url.trim()
    if (!trimmed) {
      setError('Please enter a URL to scan.')
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
        setError(data.error ?? 'Scan failed. Please try again.')
      } else {
        setResult(data as FullScanResult)
      }
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const riskConfig = result ? RISK_CONFIG[result.risk_level as RiskLevel] : null
  const signals = result?.signals as Signals | undefined

  // Detect degraded state from reasons[] (server appends notes when degraded)
  const sbDegraded = result?.reasons?.some(r => r.includes('Safe Browsing') && r.includes('unavailable'))
  const vtDegraded = result?.reasons?.some(r => r.includes('VirusTotal') && r.includes('unavailable'))
  const bothDegraded = result?.reasons?.some(r => r.includes('Both Safe Browsing and VirusTotal are unavailable'))

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1 mb-4">
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">URL Scanner</h1>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Analyze any link for phishing signals across 4 independent sources
          </p>
        </div>

        {/* Scan form */}
        <form onSubmit={handleScan} className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              id="url-input"
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com or paste any link"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm sm:text-base"
            />
            <button
              id="scan-url-btn"
              type="submit"
              disabled={loading || !url.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors whitespace-nowrap shadow-lg shadow-blue-500/20 text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Scanning…
                </span>
              ) : 'Scan URL'}
            </button>
          </div>
          {error && (
            <p role="alert" className="mt-3 text-red-400 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Result */}
        {result && riskConfig && signals && (
          <div id="scan-result" className="space-y-4">
            {/* Degraded Signal Banner — Edge-Cases.md: Combined quota exhaustion */}
            {bothDegraded && (
              <div
                role="alert"
                className="flex items-start gap-3 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-sm"
              >
                <span className="text-orange-400 text-lg mt-0.5 shrink-0">⚠️</span>
                <div>
                  <div className="font-semibold text-orange-300">Reduced Confidence — External APIs Unavailable</div>
                  <div className="text-orange-200/70 mt-1">
                    Both Google Safe Browsing and VirusTotal are currently degraded or rate-limited.
                    This result is based on heuristic rules and the ML model only.
                    Treat SAFE verdicts with extra caution.
                  </div>
                </div>
              </div>
            )}

            {/* Single API degraded (not both) */}
            {!bothDegraded && (sbDegraded || vtDegraded) && (
              <div
                role="alert"
                className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-sm"
              >
                <span className="text-amber-400 text-lg mt-0.5 shrink-0">⚡</span>
                <div>
                  <div className="font-semibold text-amber-300">Partial Signal Degradation</div>
                  <div className="text-amber-200/70 mt-1">
                    {sbDegraded && 'Google Safe Browsing is currently unavailable. '}
                    {vtDegraded && 'VirusTotal lookup is currently unavailable. '}
                    The remaining signals are still active.
                  </div>
                </div>
              </div>
            )}

            {/* Main verdict card */}
            <div className={`rounded-2xl border p-5 sm:p-6 ${riskConfig.bg} ${riskConfig.border}`}>
              {/* Verdict header */}
              <div className="flex items-center gap-3 sm:gap-4 mb-5">
                <span className="text-3xl sm:text-4xl">{riskConfig.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-xl sm:text-2xl font-bold ${riskConfig.color}`}>
                    {riskConfig.label}
                  </div>
                  <div className="text-slate-300 text-sm mt-0.5">
                    Risk score: <span className="font-semibold">{result.risk_score}/100</span>
                    <span className="text-slate-500 ml-2 text-xs">
                      ({result.risk_score < 30 ? '0–29 Safe' : result.risk_score < 70 ? '30–69 Suspicious' : '70–100 High Risk'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Score bar */}
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mb-5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    result.risk_score < 30 ? 'bg-emerald-500' : result.risk_score < 70 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.max(result.risk_score, 2)}%` }}
                />
              </div>

              {/* Signal breakdown */}
              <div className="mb-5">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Signal Breakdown
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <SignalBadge label="Rule Engine" value={signals.rules} />
                  <SignalBadge
                    label="Safe Browsing"
                    value={signals.safeBrowsing}
                    degraded={sbDegraded}
                  />
                  <SignalBadge
                    label="VirusTotal"
                    value={signals.virusTotal}
                    degraded={vtDegraded}
                  />
                  <SignalBadge
                    label="ML Signal"
                    value={signals.ml !== null ? `${Math.round(signals.ml * 100)}%` : null}
                  />
                </div>
              </div>

              {/* Reasons */}
              {result.reasons.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Detection Details ({result.reasons.length})
                  </h2>
                  <ul className="space-y-2">
                    {result.reasons.map((reason, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm text-slate-200 bg-white/5 rounded-lg px-3 py-2"
                      >
                        <span className="mt-0.5 shrink-0 text-blue-400">•</span>
                        {/* Sanitized — reason strings come from our own rule engine, not user input */}
                        <span className="break-words min-w-0">{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.reasons.length === 0 && (
                <p className="text-slate-400 text-sm">
                  No specific threat signals detected. Always exercise caution with unknown links.
                </p>
              )}

              {/* Scan again */}
              <div className="mt-5 pt-4 border-t border-white/10">
                <button
                  id="scan-again-btn"
                  onClick={() => { setResult(null); setUrl(''); setError(null) }}
                  className="text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  ← Scan another URL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
