'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useToast } from '@/components/ToastProvider'

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
  }
  created_at: string
}

const RISK_BADGE: Record<
  string,
  { label: string; text: string; bg: string; border: string; dot: string }
> = {
  SAFE: {
    label: 'Safe',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-400',
  },
  SUSPICIOUS: {
    label: 'Suspicious',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    dot: 'bg-amber-400',
  },
  HIGH_RISK: {
    label: 'High Risk',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    dot: 'bg-red-400 animate-pulse',
  },
}

export function DashboardHistoryTable({ initialScans }: { initialScans: ScanRow[] }) {
  const toast = useToast()
  const [scans, setScans] = useState<ScanRow[]>(initialScans)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clearingAll, setClearingAll] = useState(false)

  async function handleDeleteScan(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) {
        toast.error('Deletion Failed', data.error ?? 'Could not delete scan record.')
      } else {
        setScans((prev) => prev.filter((s) => s.id !== id))
        toast.success('Record Removed', 'Scan record has been deleted from your personal history.')
      }
    } catch {
      toast.error('Network Error', 'Failed to connect to server.')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleClearAll() {
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

  return (
    <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Recent Scan Logs</span>
            <span className="text-xs font-normal text-slate-400 font-mono">({scans.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Your telemetry and threat investigation record
          </p>
        </div>

        <div className="flex items-center gap-2">
          {scans.length > 0 && (
            <button
              onClick={handleClearAll}
              disabled={clearingAll}
              className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {clearingAll ? (
                <span>Clearing…</span>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Clear All History</span>
                </>
              )}
            </button>
          )}

          <Link
            href="/scan/url"
            className="text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 ml-2"
          >
            <span>+ New Scan</span>
          </Link>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <span className="text-2xl block mb-2 opacity-50">🛡️</span>
          <p className="text-sm text-slate-300 font-medium">No scan history recorded</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Scan a link or email above to begin monitoring potential phishing attacks in real time.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                <th className="pb-3 pr-4">Type</th>
                <th className="pb-3 pr-4">Target / Content</th>
                <th className="pb-3 pr-4">Verdict</th>
                <th className="pb-3 pr-4">Score</th>
                <th className="pb-3 pr-4">Signals</th>
                <th className="pb-3 pr-4">Timestamp</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {scans.map((scan) => {
                const badge = RISK_BADGE[scan.risk_level] ?? RISK_BADGE.SAFE
                const isDeleting = deletingId === scan.id

                return (
                  <tr
                    key={scan.id}
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isDeleting ? 'opacity-40 pointer-events-none' : ''
                    }`}
                  >
                    <td className="py-3.5 pr-4">
                      <span className="px-2 py-0.5 rounded uppercase text-[10px] font-bold bg-white/5 border border-white/10 text-slate-300">
                        {scan.scan_type}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 max-w-xs truncate text-slate-200 font-sans">
                      {scan.input}
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.bg} ${badge.border} ${badge.text}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4 text-white font-bold">{scan.risk_score}</td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-1 text-[10px]">
                        <span
                          className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400"
                          title="Rule Engine"
                        >
                          R:{scan.signals?.rules ?? 0}
                        </span>
                        {scan.signals?.ml !== null && scan.signals?.ml !== undefined && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300"
                            title="ML Model"
                          >
                            ML:{scan.signals.ml}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-400 text-[11px] font-sans whitespace-nowrap">
                      {new Date(scan.created_at).toLocaleString([], {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteScan(scan.id)}
                        disabled={isDeleting}
                        title="Delete scan record"
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
