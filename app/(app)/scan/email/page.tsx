'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { ScanResult } from '@/lib/ruleEngine/scoring'
import { Navbar } from '@/components/Navbar'
import { DropZone } from '@/components/DropZone'
import { RiskGauge } from '@/components/RiskGauge'
import { useToast } from '@/components/ToastProvider'
import { createBrowserClient } from '@/lib/supabaseClient'
import type { ParsedEmailResult } from '@/lib/mimeParser'

type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'

const SAMPLE_EMAILS = [
  {
    title: 'Urgent Account Suspension',
    category: 'Phishing',
    body: `Dear customer,\n\nWe detected unauthorized access to your account. Within 24 hours your account will be suspended unless you confirm your password immediately.\n\nPlease verify your account now at http://192.168.1.50/login to prevent permanent termination.\n\nSecurity Team`,
  },
  {
    title: 'Executive Wire Transfer',
    category: 'BEC Scam',
    body: `URGENT CONFIDENTIAL:\n\nPlease initiate an urgent wire transfer for invoice #94012 today. Details attached. Ensure this is completed before 5 PM.\n\nSent from my iPhone`,
  },
  {
    title: 'Legitimate Engineering Standup',
    category: 'Benign',
    body: `Hi team,\n\nHere is the summary of our weekly sprint planning. Please review the updated documentation before tomorrow's standup.\n\nHave a great afternoon!\nEngineering Team`,
  },
]

export default function ScanEmailPage() {
  const toast = useToast()
  const [userEmail, setUserEmail] = useState<string | undefined>()
  const [userRole, setUserRole] = useState<string>('user')

  const [content, setContent] = useState('')
  const [parsedMetadata, setParsedMetadata] = useState<ParsedEmailResult | null>(null)
  const [sourceFileName, setSourceFileName] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [activeTab, setActiveTab] = useState<'text' | 'file'>('file')

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

  function handleFileParsed({ fileName, data }: { fileName: string; data: ParsedEmailResult }) {
    setSourceFileName(fileName)
    setParsedMetadata(data)
    setContent(data.bodyText)
    setResult(null)
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    const trimmed = content.trim()
    if (!trimmed) {
      toast.warning('Input Required', 'Please drop an email file or paste email content to analyze.')
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
        toast.error('Analysis Error', data.error ?? 'Email analysis failed.')
      } else {
        const scanResult = data as ScanResult
        setResult(scanResult)

        // Persistent threat notification if high risk detected
        if (scanResult.risk_level === 'HIGH_RISK') {
          toast.threat(
            'High-Risk Phishing Detected!',
            `Risk Score: ${scanResult.risk_score}/100. Critical deceptive patterns identified in message body.`
          )
        } else if (scanResult.risk_level === 'SUSPICIOUS') {
          toast.warning(
            'Suspicious Email Detected',
            `Risk Score: ${scanResult.risk_score}/100. Potential fraud or urgency language detected.`
          )
        } else {
          toast.success(
            'Scan Complete',
            'No hostile phishing or deceptive indicators identified in content.'
          )
        }
      }
    } catch {
      toast.error('Network Error', 'Unable to reach the analysis server. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setContent('')
    setParsedMetadata(null)
    setSourceFileName(null)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar userEmail={userEmail} role={userRole} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Breadcrumbs & Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mb-1">
              <Link href="/dashboard" className="hover:text-blue-400 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-cyan-400">Email Analyzer</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>📧 Email & File Phishing Analyzer</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Detect deceptive headers, credential harvesting, extortion, and spoofed URLs.
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

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input & Inspection Workspace (Col 1-7) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Input Selection Tabs */}
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-xl">
              <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'file'
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  📁 Drag & Drop File (.eml / .txt)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'text'
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ✏️ Paste Raw Text
                </button>
              </div>

              {activeTab === 'file' ? (
                <div className="space-y-4">
                  <DropZone onParsed={handleFileParsed} disabled={loading} />

                  {sourceFileName && parsedMetadata && (
                    <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 text-xs space-y-2 font-mono">
                      <div className="flex items-center justify-between text-cyan-400 font-semibold">
                        <span>Ingested: {sourceFileName}</span>
                        <span>{parsedMetadata.extractedUrls.length} Link(s)</span>
                      </div>
                      {parsedMetadata.subject && (
                        <div>
                          <span className="text-slate-500">Subject: </span>
                          <span className="text-slate-300">{parsedMetadata.subject}</span>
                        </div>
                      )}
                      {parsedMetadata.from && (
                        <div>
                          <span className="text-slate-500">From: </span>
                          <span className="text-slate-300">{parsedMetadata.from}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Text Input Area */}
              <form onSubmit={handleScan} className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="email-input-text"
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                  >
                    Message Body (Untrusted Plaintext)
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    {content.length} characters
                  </span>
                </div>

                <textarea
                  id="email-input-text"
                  rows={activeTab === 'file' ? 6 : 10}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Drop an .eml file above or paste email headers and body here…"
                  className="w-full px-4 py-3 bg-slate-950/70 border border-white/15 rounded-xl text-slate-200 placeholder-slate-600 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
                />

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Zero API quota consumed (Pure Pattern Engine)
                  </span>

                  <button
                    type="submit"
                    disabled={loading || !content.trim()}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        <span>Analyzing Patterns…</span>
                      </>
                    ) : (
                      'Analyze Email Threats'
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Quick Threat Test Samples */}
            <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-5 backdrop-blur-md">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Load Threat Test Samples
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {SAMPLE_EMAILS.map((sample) => (
                  <button
                    key={sample.title}
                    type="button"
                    onClick={() => {
                      setContent(sample.body)
                      setSourceFileName(null)
                      setParsedMetadata(null)
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
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Analysis Results & Threat Breakdown (Col 8-12) */}
          <div className="lg:col-span-5 space-y-6">
            {result ? (
              <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-6 flex items-center justify-between">
                  <span>Threat Intelligence Verdict</span>
                  <span className="text-[11px] font-mono text-cyan-400">
                    ID: {result.id ? result.id.slice(0, 8) : 'Real-time'}
                  </span>
                </h2>

                {/* Cyber Risk Gauge */}
                <div className="my-4">
                  <RiskGauge
                    score={result.risk_score}
                    level={result.risk_level as RiskLevel}
                    size={170}
                  />
                </div>

                {/* Threat Indicators & Heuristic Reasons */}
                <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Flagged Risk Factors ({result.reasons.length})
                  </h3>

                  {result.reasons.length === 0 ? (
                    <p className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                      <span>✅</span> Zero hostile keyword patterns detected.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {result.reasons.map((reason, idx) => (
                        <li
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/60 border border-white/10 text-xs text-slate-300 flex items-start gap-2.5 font-sans leading-relaxed"
                        >
                          <span className="text-amber-400 text-sm leading-none mt-0.5">⚠️</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Extracted URLs Preview with Strict Scheme Security */}
                {parsedMetadata && parsedMetadata.extractedUrls.length > 0 && (
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Extracted Links ({parsedMetadata.extractedUrls.length})
                    </h3>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {parsedMetadata.extractedUrls.map((link, idx) => (
                        <div
                          key={idx}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-950/80 border border-white/5 text-[11px] font-mono text-cyan-300 truncate"
                          title={link}
                        >
                          🔗 {link}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Empty Standby State */
              <div className="h-full min-h-[360px] bg-slate-900/30 border border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl text-slate-500 mb-3">
                  🛡️
                </div>
                <h3 className="text-sm font-semibold text-slate-300">Scanner on Standby</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Upload an .eml email file or paste message contents on the left to analyze threat heuristics.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
