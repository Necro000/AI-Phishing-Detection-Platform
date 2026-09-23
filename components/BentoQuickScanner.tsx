'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import type { ScanResult } from '@/lib/ruleEngine/scoring'
import {
  CyberLinkIcon,
  CyberFileIcon,
  CyberRadarIcon,
  CyberShieldIcon,
  CyberWarningIcon,
} from '@/components/icons/CyberIcons'

interface QuickScanResult extends ScanResult {
  scan_type: 'url' | 'email'
  degraded?: {
    safeBrowsing?: boolean
    virusTotal?: boolean
  }
}

export function BentoQuickScanner() {
  const router = useRouter()
  const toast = useToast()

  const [scanType, setScanType] = useState<'url' | 'email'>('url')
  const [inputVal, setInputVal] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<QuickScanResult | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Structured email inspector state ───────────────────────────────
  const [emailMode, setEmailMode] = useState<'quick' | 'structured'>('quick')
  const [emailFrom, setEmailFrom] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')

  // Three realistic test lures for 1-click demo
  const TEST_LURES = [
    {
      label: '⚡ Banking Suspension',
      from: 'security-alert@bankofamerica-secure-update.com',
      subject: 'URGENT: Your account has been suspended',
      body: 'Dear Customer,\n\nWe have detected unusual activity on your account. Your account has been temporarily suspended. To restore access, please verify your credentials immediately by clicking the link below:\n\nhttps://bankofamerica-verify-secure.top/login\n\nFailure to act within 24 hours will result in permanent account closure.\n\nBank of America Security Team',
    },
    {
      label: '⚡ CEO Wire Transfer',
      from: 'ceo.james@company-corp.com',
      subject: 'Quick wire needed today',
      body: 'Hi Sarah,\n\nI need you to process a wire transfer of $48,500 to a new vendor before close of business today. This is time-sensitive and confidential — please do not discuss with anyone else until complete.\n\nSend to:\nAccount: 8821934520\nRouting: 021000089\n\nConfirm once sent.\n\nThanks,\nJames',
    },
    {
      label: '✅ Benign Team Sync',
      from: 'sarah.chen@yourcompany.com',
      subject: 'Re: Q4 roadmap sync — Thursday 3pm',
      body: 'Hi team,\n\nJust confirming our weekly sync is still on for Thursday at 3pm EST.\n\nAgenda:\n- Q4 sprint planning update\n- Design review for new dashboard\n- Any blockers\n\nMeet link: https://meet.google.com/abc-defg-hij\n\nSee you all then!\nSarah',
    },
  ]

  function applyLure(lure: (typeof TEST_LURES)[number]) {
    setEmailMode('structured')
    setEmailFrom(lure.from)
    setEmailSubject(lure.subject)
    setEmailBody(lure.body)
    setFile(null)
    setInputVal('')
    setResult(null)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      setScanType('email')
      setFile(droppedFile)
      setInputVal('')
      setResult(null)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setInputVal('')
      setResult(null)
    }
  }

  async function handleScan(e: React.FormEvent) {
    e.preventDefault()
    setResult(null)

    if (scanType === 'url') {
      const trimmed = inputVal.trim()
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
          setResult({ ...data, scan_type: 'url' })
          if (data.risk_level === 'HIGH_RISK') {
            toast.threat('Hostile Threat Detected', `High-risk URL flagged (${data.risk_score}/100)`)
          } else if (data.risk_level === 'SUSPICIOUS') {
            toast.warning('Suspicious Signals', `Moderate risk indicators found (${data.risk_score}/100)`)
          } else {
            toast.success('Scan Completed', 'Target link verified clean.')
          }
          router.refresh()
        }
      } catch {
        toast.error('Network Error', 'Failed to communicate with analysis engines.')
      } finally {
        setLoading(false)
      }
    } else {
      if (!file && !inputVal.trim()) {
        toast.warning('Input Required', 'Please drop a .eml file or paste email content to analyze.')
        return
      }

      setLoading(true)
      try {
        let content = inputVal.trim()
        if (file) {
          content = await file.text()
        }
        // Merge structured fields into a single analysable content string
        if (emailMode === 'structured') {
          content = [
            emailFrom ? `From: ${emailFrom}` : '',
            emailSubject ? `Subject: ${emailSubject}` : '',
            emailBody ? `\n${emailBody}` : '',
          ].filter(Boolean).join('\n').trim()
        }

        const res = await fetch('/api/scan/email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        })
        const data = await res.json()

        if (!res.ok) {
          toast.error('Analysis Error', data.error ?? 'Email analysis failed.')
        } else {
          setResult({ ...data, scan_type: 'email' })
          if (data.risk_level === 'HIGH_RISK') {
            toast.threat('Phishing Attack Detected', `Hostile email flagged (${data.risk_score}/100)`)
          } else if (data.risk_level === 'SUSPICIOUS') {
            toast.warning('Suspicious Content', `Heuristic anomalies detected (${data.risk_score}/100)`)
          } else {
            toast.success('Inspection Clean', 'No phishing heuristics detected.')
          }
          router.refresh()
        }
      } catch {
        toast.error('Network Error', 'Failed to connect to email analyzer.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-7 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] flex flex-col justify-between h-full group">
      {/* Top subtle cyan energy highlight */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      <div>
        {/* Header matching Mockup */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white font-sans">
              Instant In-Place Scanner
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Scan links or drop suspicious .eml email files
            </p>
          </div>

          {/* Mode Switcher Pills */}
          <div className="inline-flex p-1 rounded-full bg-slate-950/80 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={() => {
                setScanType('url')
                setFile(null)
                setResult(null)
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                scanType === 'url'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CyberLinkIcon size={13} />
              <span>URL</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setScanType('email')
                setInputVal('')
                setResult(null)
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                scanType === 'email'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CyberFileIcon size={13} />
              <span>File (.eml)</span>
            </button>
          </div>
        </div>

        {/* Input Bar matching Mockup */}
        <form onSubmit={handleScan} className="space-y-4">
          {scanType === 'url' ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className="relative flex items-center"
            >
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
              <input
                id="dashboard-url-input"
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Paste suspicious URL or drop file here..."
                className="w-full pl-11 pr-11 py-3.5 bg-slate-950/80 border border-white/10 rounded-2xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
              />
              <button
                type="button"
                onClick={() => {
                  setScanType('email')
                  fileInputRef.current?.click()
                }}
                title="Upload or drop .eml file"
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mode toggle: Quick Paste vs Structured Inspector */}
              <div className="flex items-center justify-between">
                <div className="inline-flex p-0.5 rounded-lg bg-slate-950/80 border border-white/10">
                  <button
                    type="button"
                    onClick={() => setEmailMode('quick')}
                    className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      emailMode === 'quick'
                        ? 'bg-cyan-600/80 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Quick Paste
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmailMode('structured')}
                    className={`px-3 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer ${
                      emailMode === 'structured'
                        ? 'bg-cyan-600/80 text-white shadow'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Inspector
                  </button>
                </div>

                {/* 1-click test lure chips */}
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {TEST_LURES.map((lure) => (
                    <button
                      key={lure.label}
                      type="button"
                      onClick={() => applyLure(lure)}
                      className="px-2 py-0.5 rounded-full border border-white/10 bg-slate-950/70 hover:border-cyan-500/40 hover:text-cyan-300 text-[10px] font-mono text-slate-400 transition-all cursor-pointer whitespace-nowrap"
                    >
                      {lure.label}
                    </button>
                  ))}
                </div>
              </div>

              {emailMode === 'quick' ? (
                /* Quick Paste: original drop-zone */
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl py-3 px-4 text-center transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isDragOver
                      ? 'border-cyan-400 bg-cyan-500/10'
                      : file
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-white/10 bg-slate-950/70 hover:border-cyan-500/40'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".eml,.msg,.txt"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2.5 text-left">
                    <span className="text-xl">{file ? '📄' : '📥'}</span>
                    <div>
                      <p className="text-xs font-semibold text-slate-200">
                        {file ? file.name : 'Drop .eml file here or click to browse'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : 'Email headers, phishing links, coercive triggers'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-cyan-400 font-mono underline">Browse</span>
                </div>
              ) : (
                /* Structured Inspector: Sender + Subject + Body */
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">From (Sender)</label>
                    <input
                      id="email-from-input"
                      type="text"
                      value={emailFrom}
                      onChange={(e) => setEmailFrom(e.target.value)}
                      placeholder="e.g. security-alert@paypal-verify-update.com"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Subject</label>
                    <input
                      id="email-subject-input"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g. URGENT: Your account will be suspended"
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition-all font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">Message Body</label>
                    <textarea
                      id="email-body-input"
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Paste the full email message body here…"
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-950/80 border border-white/10 rounded-xl text-slate-100 placeholder-slate-600 text-xs focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full-Width Action Button matching Mockup */}
          <button
            id="dashboard-scan-submit"
            type="submit"
            disabled={loading || (scanType === 'url' ? !inputVal.trim() : !file && !inputVal.trim())}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-2xl shadow-lg shadow-cyan-500/25 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer font-sans"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Analyzing Target…</span>
              </>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <CyberRadarIcon size={17} glow />
                <span>Analyze Target</span>
              </span>
            )}
          </button>
        </form>
      </div>

      {/* In-Place Scan Result Verdict Overlay */}
      {result && (
        <div className="mt-4 p-4 rounded-2xl bg-slate-950/90 border border-cyan-500/30 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono border flex items-center gap-1.5 ${
                  result.risk_level === 'HIGH_RISK'
                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    : result.risk_level === 'SUSPICIOUS'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {result.risk_level === 'HIGH_RISK' ? (
                  <>
                    <CyberWarningIcon size={13} variant="rose" glow />
                    <span>High Risk Hostile</span>
                  </>
                ) : result.risk_level === 'SUSPICIOUS' ? (
                  <>
                    <CyberWarningIcon size={13} variant="amber" glow />
                    <span>Suspicious Anomaly</span>
                  </>
                ) : (
                  <>
                    <CyberShieldIcon size={13} glow />
                    <span>Clean Verified</span>
                  </>
                )}
              </span>
              <span className="text-xs font-mono text-slate-300 font-bold">
                Score: {result.risk_score}/100
              </span>
            </div>

            <Link
              href={result.scan_type === 'url' ? '/scan/url' : '/scan/email'}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
            >
              <span>Full Forensics →</span>
            </Link>
          </div>

          {result.reasons && result.reasons.length > 0 && (
            <ul className="space-y-1 text-[11px] text-slate-300 pt-1 border-t border-white/5">
              {result.reasons.slice(0, 2).map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
