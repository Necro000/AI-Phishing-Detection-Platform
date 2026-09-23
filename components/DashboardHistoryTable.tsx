'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'
import { CyberTrashIcon, CyberLinkIcon, CyberFileIcon } from '@/components/icons/CyberIcons'
import { AccessibleRiskBadge } from '@/components/AccessibleRiskBadge'

export interface ScanRow {
  id: string
  scan_type: 'url' | 'email'
  input: string
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  risk_score: number
  reasons: string[]
  signals?: {
    rules?: number
    ml?: number | null
    safeBrowsing?: boolean | null
    virusTotal?: boolean | null
    vtVendors?: number | null
  }
  created_at: string
}

type FilterTab = 'ALL' | 'URL' | 'FILE' | 'EMAIL'

const MOCK_ROWS: ScanRow[] = [
  {
    id: 'mock-1',
    scan_type: 'url',
    input: 'hxxps://bit.ly/3x8f',
    risk_level: 'SUSPICIOUS',
    risk_score: 65,
    reasons: ['Suspicious URL redirect'],
    created_at: new Date(Date.now() - 60 * 1000).toISOString(),
  },
  {
    id: 'mock-2',
    scan_type: 'email',
    input: 'malicious.eml',
    risk_level: 'HIGH_RISK',
    risk_score: 95,
    reasons: ['Malware attachment detected'],
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-3',
    scan_type: 'url',
    input: 'bank-login.com',
    risk_level: 'HIGH_RISK',
    risk_score: 90,
    reasons: ['Brand impersonation / phishing portal'],
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'mock-4',
    scan_type: 'email',
    input: 'report.doc',
    risk_level: 'SAFE',
    risk_score: 0,
    reasons: ['Clean document'],
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
]

export function DashboardHistoryTable({ initialScans }: { initialScans: ScanRow[] }) {
  const toast = useToast()
  const [scans, setScans] = useState<ScanRow[]>(initialScans)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL')

  React.useEffect(() => {
    setScans(initialScans)
  }, [initialScans])

  // If user has no scans yet, use the mockup display rows for a pristine day-1 look
  const displayScans = scans.length > 0 ? scans : MOCK_ROWS
  const isMock = scans.length === 0

  const filteredScans = useMemo(() => {
    return displayScans.filter((scan) => {
      if (activeTab === 'URL' && scan.scan_type !== 'url') return false
      if (activeTab === 'FILE' && scan.scan_type !== 'email') return false
      if (activeTab === 'EMAIL' && scan.scan_type !== 'email') return false
      return true
    })
  }, [displayScans, activeTab])

  async function handleDeleteScan(id: string) {
    if (isMock) {
      toast.info('Notice', 'Sample telemetry rows cannot be deleted.')
      return
    }
    setDeletingId(id)
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error('Deletion Failed', data.error ?? 'Could not delete scan record.')
      } else {
        setScans((prev) => prev.filter((s) => s.id !== id))
        toast.success('Record Removed', 'Scan record deleted.')
      }
    } catch {
      toast.error('Network Error', 'Failed to connect to server.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleClearAll() {
    if (isMock) {
      toast.info('Notice', 'Sample telemetry rows cannot be cleared.')
      return
    }

    if (!confirm('Are you sure you want to delete your entire scan history? This action cannot be undone.')) {
      return
    }

    setClearingAll(true)
    try {
      const res = await fetch('/api/history?all=true', { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error('Clear Failed', data.error ?? 'Could not clear history.')
      } else {
        setScans([])
        toast.success('History Cleared', 'All personal scan records have been deleted.')
      }
    } catch {
      toast.error('Network Error', 'Failed to connect to server.')
    } finally {
      setClearingAll(false)
    }
  }

  function formatRelativeTime(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime()
    const diffMin = Math.max(1, Math.round(diffMs / 60000))
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.round(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return `${Math.round(diffH / 24)}d ago`
  }

  return (
    <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-6 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] flex flex-col h-full overflow-hidden">
      {/* Top subtle cyan energy highlight */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* Header matching Mockup */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight font-sans">
          Scan History
        </h2>

        {/* Filter Pills & Clear All */}
        <div className="flex items-center gap-2">
          <div className="inline-flex p-1 rounded-full bg-slate-950/80 border border-white/10 text-xs">
            {(['ALL', 'URL', 'FILE', 'EMAIL'] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'URL' ? 'URLs' : tab === 'FILE' ? 'Files' : 'Emails'}
              </button>
            ))}
          </div>

          {scans.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearingAll}
              className="px-2.5 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Clear all scan history"
            >
              <CyberTrashIcon size={13} glow />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Desktop table (md+) ──────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-sans text-xs">
              <th className="pb-3 pr-4 font-normal">Type</th>
              <th className="pb-3 pr-4 font-normal">Target</th>
              <th className="pb-3 pr-4 font-normal">Verdict</th>
              <th className="pb-3 pr-4 font-normal">Detection</th>
              <th className="pb-3 pr-4 font-normal">Time</th>
              <th className="pb-3 text-right font-normal">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {filteredScans.map((scan) => {
              const isDeleting = deletingId === scan.id
              const isHigh = scan.risk_level === 'HIGH_RISK'
              const isSuspicious = scan.risk_level === 'SUSPICIOUS'

              const typeBadge = scan.scan_type === 'url' ? 'URL' : 'File'
              const detectionLabel = isHigh
                ? scan.scan_type === 'url'
                  ? 'Blocked - Phishing'
                  : 'Quarantined'
                : isSuspicious
                ? 'Blocked'
                : 'Safe'

              return (
                <tr
                  key={scan.id}
                  className={`hover:bg-white/[0.02] transition-colors ${
                    isDeleting ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  {/* Type Column */}
                  <td className="py-3.5 pr-4">
                    <span className="text-cyan-400 font-medium flex items-center gap-1.5">
                      {scan.scan_type === 'url' ? (
                        <CyberLinkIcon size={13} />
                      ) : (
                        <CyberFileIcon size={13} />
                      )}
                      <span>{typeBadge}</span>
                    </span>
                  </td>

                  {/* Target Column */}
                  <td className="py-3.5 pr-4 max-w-[180px] sm:max-w-xs truncate text-slate-200 font-mono text-xs">
                    {scan.input}
                  </td>

                  {/* Verdict Column */}
                  <td className="py-3.5 pr-4">
                    <AccessibleRiskBadge
                      level={scan.risk_level}
                      score={scan.risk_score}
                      size="sm"
                      showScore
                    />
                  </td>

                  {/* Detection Column */}
                  <td className="py-3.5 pr-4">
                    <span
                      className={`font-medium ${
                        isHigh
                          ? 'text-rose-400'
                          : isSuspicious
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {detectionLabel}
                    </span>
                  </td>

                  {/* Time Column */}
                  <td className="py-3.5 pr-4 text-slate-400 text-xs whitespace-nowrap">
                    {formatRelativeTime(scan.created_at)}
                  </td>

                  {/* Action Column */}
                  <td className="py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDeleteScan(scan.id)}
                      disabled={isDeleting}
                      title="Delete scan record"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40"
                    >
                      {isDeleting ? (
                        <svg className="w-3.5 h-3.5 animate-spin text-rose-400" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                      ) : (
                        <CyberTrashIcon size={15} glow />
                      )}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile stacked cards (< md) ──────────────────────────────────────── */}
      <div className="block md:hidden space-y-2.5" role="list" aria-label="Personal scan history">
        {filteredScans.map((scan) => {
          const isDeleting = deletingId === scan.id
          const isHigh = scan.risk_level === 'HIGH_RISK'
          const isSuspicious = scan.risk_level === 'SUSPICIOUS'

          const typeBadge = scan.scan_type === 'url' ? 'URL' : 'File'
          const detectionLabel = isHigh
            ? scan.scan_type === 'url'
              ? 'Blocked - Phishing'
              : 'Quarantined'
            : isSuspicious
            ? 'Blocked'
            : 'Safe'

          return (
            <div
              key={scan.id}
              role="listitem"
              className={`p-3.5 rounded-2xl border transition-all ${
                isHigh
                  ? 'border-rose-500/30 bg-rose-500/5'
                  : isSuspicious
                  ? 'border-amber-500/25 bg-amber-500/5'
                  : 'border-white/10 bg-slate-950/60'
              } ${isDeleting ? 'opacity-40 pointer-events-none' : ''}`}
            >
              {/* Row 1: Type + Verdict + Delete */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 border border-white/10 text-[11px] font-mono text-cyan-400">
                    {scan.scan_type === 'url' ? <CyberLinkIcon size={11} /> : <CyberFileIcon size={11} />}
                    <span>{typeBadge}</span>
                  </span>
                  <AccessibleRiskBadge
                    level={scan.risk_level}
                    score={scan.risk_score}
                    size="sm"
                    showScore
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleDeleteScan(scan.id)}
                  disabled={isDeleting}
                  title="Delete scan record"
                  className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer disabled:opacity-40"
                >
                  {isDeleting ? (
                    <svg className="w-3.5 h-3.5 animate-spin text-rose-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  ) : (
                    <CyberTrashIcon size={14} glow />
                  )}
                </button>
              </div>

              {/* Row 2: Target payload */}
              <p className="font-mono text-xs text-slate-200 break-all mb-2">
                {scan.input}
              </p>

              {/* Row 3: Detection status + Time */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/5">
                <span
                  className={`font-medium ${
                    isHigh ? 'text-rose-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {detectionLabel}
                </span>
                <span className="font-mono text-slate-500">
                  {formatRelativeTime(scan.created_at)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
