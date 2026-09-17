'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { ScanResult } from '@/lib/ruleEngine/scoring'

type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'

const RISK_CONFIG: Record<
  RiskLevel,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  SAFE: {
    label: 'Safe',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    icon: '✅',
  },
  SUSPICIOUS: {
    label: 'Suspicious',
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    icon: '⚠️',
  },
  HIGH_RISK: {
    label: 'High Risk',
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    icon: '🚨',
  },
}

const SAMPLE_EMAILS = [
  {
    title: 'Urgent Account Suspension',
    category: 'Phishing Sample',
    body: `Dear customer,\n\nWe detected unauthorized access to your account. Within 24 hours your account will be suspended unless you confirm your password immediately.\n\nPlease verify your account now at http://192.168.1.50/login to prevent permanent termination.\n\nSecurity Team`,
  },
  {
    title: 'Overdue Gift Card Invoice',
    category: 'Extortion / Scam',
    body: `URGENT NOTICE:\n\nYour recent billing failure requires immediate action. Pay the invoice overdue via Apple gift card or wire transfer urgently to prevent legal proceedings.\n\nDo not ignore this message.`,
  },
  {
    title: 'Legitimate Team Update',
    category: 'Benign Sample',
    body: `Hi team,\n\nHere is the summary of our weekly sprint planning. Please review the updated roadmap before tomorrow's standup.\n\nHave a great afternoon!\nAlex`,
  },
]

export default function ScanEmailPage() {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [submittedText, setSubmittedText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setResult(null)

    const trimmed = content.trim()
    if (!trimmed) {
      setError('Please paste or type email content to analyze.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/scan/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: trimmed }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed. Please try again.')
      } else {
        setResult(data as ScanResult)
        setSubmittedText(trimmed)
      }
    } catch {
      setError('Network error — please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setContent('')
    setSubmittedText(null)
    setError(null)
  }

  const riskConfig = result ? RISK_CONFIG[result.risk_level as RiskLevel] : null

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-slate-400 hover:text-slate-300 text-sm flex items-center gap-1 mb-4"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-3xl">📧</span>
            <div>
              <h1 className="text-3xl font-bold text-white">Email & Message Analyzer</h1>
              <p className="text-slate-400 mt-1">
                Detect credential harvesting, coercion, financial fraud, and deceptive link heuristics
              </p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        {!result && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 backdrop-blur-sm">
            <form onSubmit={handleScan}>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="email-input" className="block text-sm font-medium text-slate-300">
                  Paste Email or Message Content
                </label>
                <span className="text-xs text-slate-400">
                  {content.length.toLocaleString()} / 10,000 chars
                </span>
              </div>

              <textarea
                id="email-input"
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste the full email body, subject line, or message text here..."
                disabled={loading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-y font-sans transition"
              />

              {error && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  English content analyzed via heuristic language and link pattern rules
                </div>
                <button
                  id="scan-email-submit"
                  type="submit"
                  disabled={loading || !content.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Content...
                    </>
                  ) : (
                    'Analyze Threat Level'
                  )}
                </button>
              </div>
            </form>

            {/* Quick Sample Presets */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Or try a sample message:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {SAMPLE_EMAILS.map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setContent(sample.body)
                      setError(null)
                    }}
                    className="p-3 text-left bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition group"
                  >
                    <div className="text-xs font-medium text-white group-hover:text-blue-300">
                      {sample.title}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">{sample.category}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results View */}
        {result && riskConfig && (
          <div className="space-y-6">
            {/* Main Verdict Card */}
            <div
              className={`p-6 rounded-2xl border ${riskConfig.bg} ${riskConfig.border} backdrop-blur-sm`}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{riskConfig.icon}</span>
                  <div>
                    <div className={`text-2xl font-bold ${riskConfig.color}`}>
                      {riskConfig.label}
                    </div>
                    <div className="text-sm text-slate-400">
                      Risk Score:{' '}
                      <span className="font-semibold text-white">{result.risk_score} / 100</span>
                      <span className="text-xs text-slate-400 ml-2">
                        ({result.risk_score < 30 ? '0–29 Safe' : result.risk_score < 70 ? '30–69 Suspicious' : '70–100 High Risk'})
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 text-sm transition"
                >
                  Analyze Another Message
                </button>
              </div>

              {/* Score Bar */}
              <div className="mt-6">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      result.risk_score < 30
                        ? 'bg-emerald-500'
                        : result.risk_score < 70
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${Math.max(result.risk_score, 3)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Signal Architecture Breakdown */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-4">Signal Architecture Breakdown</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-blue-400">{result.signals.rules} pts</div>
                  <div className="text-xs text-slate-400 mt-1">Rule Engine</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-slate-500">N/A</div>
                  <div className="text-xs text-slate-400 mt-1">Safe Browsing (URL only)</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-slate-500">N/A</div>
                  <div className="text-xs text-slate-400 mt-1">VirusTotal (URL only)</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                  <div className="text-sm font-semibold text-slate-500">N/A</div>
                  <div className="text-xs text-slate-400 mt-1">ML Model (URL only)</div>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3">
                Per Architecture.md §5: Email scans are scored purely through heuristic language rules,
                suspicious pattern recognition, and link structure analysis. External API lookups and URL ML
                are not invoked.
              </p>
            </div>

            {/* Reasons List */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-white mb-3">Detection Findings</h2>
              {result.reasons.length > 0 ? (
                <ul className="space-y-2">
                  {result.reasons.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-400">No suspicious indicators detected.</p>
              )}
            </div>

            {/* Sanitized Content Preview (Never dangerouslySetInnerHTML) */}
            {submittedText && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <h2 className="text-sm font-semibold text-white mb-2">Analyzed Message Content</h2>
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl max-h-48 overflow-y-auto">
                  {/* React safely escapes text inside standard elements preventing XSS */}
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans break-words">
                    {submittedText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
