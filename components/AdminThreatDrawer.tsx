'use client'

/**
 * AdminThreatDrawer — Client Component
 *
 * A slide-over forensic investigation panel.
 * Displays full technical telemetry for a selected scan row.
 * Enables one-click JSON incident dossier export.
 */

import { useEffect, useRef } from 'react'

interface Signals {
  rules?: number | null
  safeBrowsing?: boolean | null
  virusTotal?: boolean | null
  vtVendors?: number | null
  ml?: number | null
}

export interface DrawerScan {
  id: string
  user_id: string
  user_email: string
  scan_type: 'url' | 'email'
  input: string
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  risk_score: number
  reasons: string[]
  signals: Signals
  created_at: string
}

interface Props {
  scan: DrawerScan | null
  onClose: () => void
}

const RISK_COLOR: Record<string, string> = {
  SAFE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  SUSPICIOUS: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  HIGH_RISK: 'text-red-400 bg-red-500/10 border-red-500/30',
}

const RISK_LABEL: Record<string, string> = {
  SAFE: '🟢 SAFE',
  SUSPICIOUS: '🟡 SUSPICIOUS',
  HIGH_RISK: '🔴 HIGH RISK',
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const copy = () => {
    navigator.clipboard.writeText(text).catch(() => {})
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      title={`Copy ${label}`}
      className="ml-2 p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/10 transition"
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
      </svg>
    </button>
  )
}

function SignalRow({ label, value, status }: { label: string; value: string; status: 'ok' | 'warn' | 'neutral' }) {
  const dot =
    status === 'ok' ? 'bg-emerald-400' :
    status === 'warn' ? 'bg-red-400' :
    'bg-slate-600'
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
      <span className="flex items-center gap-2 text-xs text-slate-400">
        <span className={`w-2 h-2 rounded-full ${dot} flex-shrink-0`} aria-hidden="true" />
        {label}
      </span>
      <span className="text-xs font-mono text-slate-200">{value}</span>
    </div>
  )
}

export default function AdminThreatDrawer({ scan, onClose }: Props) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  // Focus trap — focus drawer on open
  useEffect(() => {
    if (scan) drawerRef.current?.focus()
  }, [scan])

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = scan ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [scan])

  function exportJSON() {
    if (!scan) return
    const blob = new Blob([JSON.stringify(scan, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `incident-${scan.id.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const isOpen = scan !== null

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Threat forensic investigation drawer"
        tabIndex={-1}
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-lg bg-slate-900/95 border-l border-white/10 backdrop-blur-xl shadow-2xl flex flex-col transition-transform duration-300 ease-in-out outline-none ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-base font-bold text-white">Threat Investigation</h2>
            {scan && (
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                ID: {scan.id.slice(0, 8)}…
                <CopyButton text={scan.id} label="scan ID" />
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close investigation drawer"
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content (scrollable) */}
        {scan && (
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* Verdict & Score */}
            <section aria-labelledby="verdict-section">
              <h3 id="verdict-section" className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-3">Verdict</h3>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${RISK_COLOR[scan.risk_level] ?? RISK_COLOR.SUSPICIOUS}`}>
                  {RISK_LABEL[scan.risk_level] ?? scan.risk_level}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Risk Score</span>
                    <span className="font-mono font-bold text-white">{scan.risk_score}/100</span>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${scan.risk_score >= 70 ? 'bg-red-500' : scan.risk_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${scan.risk_score}%` }}
                      aria-valuenow={scan.risk_score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      role="progressbar"
                      aria-label={`Risk score ${scan.risk_score} out of 100`}
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Target Input */}
            <section aria-labelledby="target-section">
              <h3 id="target-section" className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Target / Payload</h3>
              <div className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl p-3">
                <span className="flex-shrink-0 text-slate-400 mt-0.5">
                  {scan.scan_type === 'url' ? '🔗' : '📧'}
                </span>
                <p className="text-xs font-mono text-slate-200 break-all flex-1">{scan.input}</p>
                <CopyButton text={scan.input} label="target input" />
              </div>
            </section>

            {/* Multi-Signal Breakdown */}
            <section aria-labelledby="signals-section">
              <h3 id="signals-section" className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Signal Breakdown</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <SignalRow
                  label="Rule Engine Triggers (R)"
                  value={`${scan.signals?.rules ?? 0} rules fired`}
                  status={(scan.signals?.rules ?? 0) > 0 ? 'warn' : 'ok'}
                />
                {scan.scan_type === 'url' && (
                  <>
                    <SignalRow
                      label="Google Safe Browsing"
                      value={scan.signals?.safeBrowsing === true ? '🚨 FLAGGED' : scan.signals?.safeBrowsing === false ? 'Clear' : 'Not checked'}
                      status={scan.signals?.safeBrowsing === true ? 'warn' : scan.signals?.safeBrowsing === false ? 'ok' : 'neutral'}
                    />
                    <SignalRow
                      label="VirusTotal Vendors"
                      value={
                        scan.signals?.virusTotal === true
                          ? `🚨 ${scan.signals?.vtVendors ?? '?'} vendor(s) flagged`
                          : scan.signals?.virusTotal === false
                          ? 'All clear'
                          : 'Not checked'
                      }
                      status={scan.signals?.virusTotal === true ? 'warn' : scan.signals?.virusTotal === false ? 'ok' : 'neutral'}
                    />
                    <SignalRow
                      label="ML Inference Probability"
                      value={scan.signals?.ml !== null && scan.signals?.ml !== undefined ? `${Math.round(scan.signals.ml * 100)}% phishing` : '—'}
                      status={scan.signals?.ml !== null && scan.signals?.ml !== undefined && scan.signals.ml > 0.5 ? 'warn' : scan.signals?.ml !== null && scan.signals?.ml !== undefined ? 'ok' : 'neutral'}
                    />
                  </>
                )}
              </div>
            </section>

            {/* Triggered Reasons */}
            {scan.reasons.length > 0 && (
              <section aria-labelledby="reasons-section">
                <h3 id="reasons-section" className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">
                  Forensic Indicators ({scan.reasons.length})
                </h3>
                <ul className="space-y-1.5" role="list">
                  {scan.reasons.map((reason, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-xs text-slate-300 bg-white/5 border border-white/8 rounded-lg px-3 py-2"
                    >
                      <span className="text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true">⚑</span>
                      {reason}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Submitter Metadata */}
            <section aria-labelledby="submitter-section">
              <h3 id="submitter-section" className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-2">Submitter Metadata</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">User Email</span>
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-slate-200">{scan.user_email}</span>
                    <CopyButton text={scan.user_email} label="user email" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">User ID</span>
                  <div className="flex items-center">
                    <span className="text-xs font-mono text-slate-500">{scan.user_id.slice(0, 12)}…</span>
                    <CopyButton text={scan.user_id} label="user ID" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Timestamp (ISO)</span>
                  <span className="text-xs font-mono text-slate-300">{new Date(scan.created_at).toISOString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Attack Vector</span>
                  <span className="text-xs font-mono text-slate-300">{scan.scan_type === 'url' ? '🔗 URL' : '📧 Email'}</span>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Footer Actions */}
        {scan && (
          <div className="px-6 py-4 border-t border-white/10 flex gap-3">
            <button
              type="button"
              id="drawer-export-json"
              onClick={exportJSON}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-sm font-medium text-blue-300 transition active:scale-95"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export JSON Dossier
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </>
  )
}
