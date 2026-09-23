'use client'

/**
 * AdminScansTable — Client Component
 *
 * Interactive Cyber SOC scans table.
 * Manages `selectedScan` state and opens AdminThreatDrawer on row click or Inspect action.
 * Cyber Bento styling matching the CrowdStrike / SentinelOne design system.
 *
 * Responsive: Desktop (md+) renders a high-density data table.
 *             Mobile (< md) renders touch-friendly stacked cards.
 */

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { DrawerScan } from './AdminThreatDrawer'
import { SignalBadges } from './SignalBadges'
import { CyberLinkIcon, CyberFileIcon, CyberRadarIcon } from '@/components/icons/CyberIcons'

// Lazy-load the drawer to keep the initial server-rendered HTML lighter
const AdminThreatDrawer = dynamic(() => import('./AdminThreatDrawer'), { ssr: false })

interface ScanRow {
  id: string
  user_id: string
  user_email: string
  scan_type: 'url' | 'email'
  input: string
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  risk_score: number
  reasons: string[]
  signals: {
    rules?: number | null
    safeBrowsing?: boolean | null
    virusTotal?: boolean | null
    vtVendors?: number | null
    ml?: number | null
  }
  created_at: string
}

interface Props {
  scans: ScanRow[]
}

export default function AdminScansTable({ scans }: Props) {
  const [selectedScan, setSelectedScan] = useState<DrawerScan | null>(null)

  const handleRowClick = useCallback((scan: ScanRow) => {
    setSelectedScan({
      id: scan.id,
      user_id: scan.user_id,
      user_email: scan.user_email,
      scan_type: scan.scan_type,
      input: scan.input,
      risk_level: scan.risk_level,
      risk_score: scan.risk_score,
      reasons: scan.reasons,
      signals: scan.signals,
      created_at: scan.created_at,
    })
  }, [])

  const handleClose = useCallback(() => {
    setSelectedScan(null)
  }, [])

  if (scans.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl bg-slate-950/40">
        <p className="text-sm font-medium text-slate-300">No telemetry records match current filters.</p>
        <p className="text-xs text-slate-500 mt-1">Adjust search terms or reset the verdict filter above.</p>
      </div>
    )
  }

  return (
    <>
      {/* ── Desktop table (md+) ──────────────────────────────────────────────── */}
      <div className="hidden md:block overflow-x-auto" role="region" aria-label="Scans audit log table">
        <table className="w-full text-left text-xs text-slate-300" aria-label="Platform scans">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-sans text-xs uppercase tracking-wider">
              <th scope="col" className="py-3 px-3.5 font-medium">User</th>
              <th scope="col" className="py-3 px-3.5 font-medium">Type</th>
              <th scope="col" className="py-3 px-3.5 font-medium">Target / Payload</th>
              <th scope="col" className="py-3 px-3.5 font-medium">Risk Verdict</th>
              <th scope="col" className="py-3 px-3.5 font-medium">Score</th>
              <th scope="col" className="py-3 px-3.5 font-medium">Multi-Vendor Signals</th>
              <th scope="col" className="py-3 px-3.5 text-right font-medium">Timestamp</th>
              <th scope="col" className="py-3 px-3.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-sans">
            {scans.map((scan) => {
              const isHigh = scan.risk_level === 'HIGH_RISK'
              const isSuspicious = scan.risk_level === 'SUSPICIOUS'
              const isSelected = selectedScan?.id === scan.id
              const userInit = scan.user_email ? scan.user_email.charAt(0).toUpperCase() : 'U'

              return (
                <tr
                  key={scan.id}
                  onClick={() => handleRowClick(scan)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleRowClick(scan)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Investigate ${scan.scan_type} scan from ${scan.user_email}`}
                  aria-pressed={isSelected}
                  className={`cursor-pointer transition-all duration-150 group ${
                    isSelected
                      ? 'bg-cyan-500/10 border-l-2 border-cyan-400'
                      : 'hover:bg-white/[0.03] border-l-2 border-transparent'
                  }`}
                >
                  {/* User Column */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-[10px] font-bold text-cyan-300">
                        {userInit}
                      </div>
                      <span className="text-slate-200 font-mono text-[11px] truncate max-w-[150px]">
                        {scan.user_email}
                      </span>
                    </div>
                  </td>

                  {/* Type Column */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-slate-950/80 border border-white/10 text-cyan-400">
                      {scan.scan_type === 'url' ? <CyberLinkIcon size={12} /> : <CyberFileIcon size={12} />}
                      <span>{scan.scan_type.toUpperCase()}</span>
                    </span>
                  </td>

                  {/* Target Column */}
                  <td className="py-3 px-3.5 max-w-[180px] sm:max-w-xs truncate font-mono text-xs text-slate-200" title={scan.input}>
                    {scan.input}
                  </td>

                  {/* Verdict Column */}
                  <td className="py-3 px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        isHigh
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : isSuspicious
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isHigh ? 'bg-rose-400 animate-pulse' : isSuspicious ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                      />
                      <span>{isHigh ? 'Malicious' : isSuspicious ? 'Suspicious' : 'Safe'}</span>
                    </span>
                  </td>

                  {/* Score Column */}
                  <td className="py-3 px-3.5 whitespace-nowrap font-medium text-white font-mono">
                    <span className={isHigh ? 'text-rose-400 font-bold' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'}>
                      {scan.risk_score}
                    </span>
                    <span className="text-[10px] text-slate-500">/100</span>
                  </td>

                  {/* Signals Column */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-xs text-slate-400">
                    <SignalBadges
                      scanType={scan.scan_type}
                      rules={scan.signals?.rules}
                      safeBrowsing={scan.signals?.safeBrowsing}
                      virusTotal={scan.signals?.virusTotal}
                      vtVendors={scan.signals?.vtVendors}
                      ml={scan.signals?.ml}
                    />
                  </td>

                  {/* Timestamp Column */}
                  <td suppressHydrationWarning className="py-3 px-3.5 whitespace-nowrap text-right text-xs font-mono text-slate-400">
                    {new Date(scan.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Actions Column */}
                  <td className="py-3 px-3.5 whitespace-nowrap text-right">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRowClick(scan)
                      }}
                      className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/30 transition-all font-mono text-[11px] cursor-pointer inline-flex items-center gap-1"
                    >
                      <CyberRadarIcon size={12} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile stacked cards (< md) ──────────────────────────────────────── */}
      <div className="block md:hidden space-y-2" role="list" aria-label="Scans audit log">
        {scans.map((scan) => {
          const isHigh = scan.risk_level === 'HIGH_RISK'
          const isSuspicious = scan.risk_level === 'SUSPICIOUS'
          const isSelected = selectedScan?.id === scan.id

          return (
            <button
              key={scan.id}
              type="button"
              role="listitem"
              onClick={() => handleRowClick(scan)}
              aria-label={`Investigate ${scan.scan_type} scan — ${scan.risk_level}`}
              className={`w-full text-left p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                isHigh
                  ? 'border-rose-500/40 bg-rose-500/5'
                  : isSuspicious
                  ? 'border-amber-500/30 bg-amber-500/5'
                  : 'border-white/10 bg-slate-900/60'
              } ${isSelected ? 'ring-1 ring-cyan-400' : ''}`}
            >
              {/* Row 1: verdict badge + timestamp */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border ${
                    isHigh
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : isSuspicious
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    isHigh ? 'bg-rose-400' : isSuspicious ? 'bg-amber-400' : 'bg-emerald-400'
                  }`} />
                  {isHigh ? 'HIGH RISK' : isSuspicious ? 'SUSPICIOUS' : 'SAFE'}
                </span>
                <span suppressHydrationWarning className="text-[11px] font-mono text-slate-500">
                  {new Date(scan.created_at).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              {/* Row 2: target / payload */}
              <p className="font-mono text-xs text-slate-200 truncate mb-2">
                {scan.input}
              </p>

              {/* Row 3: type pill, score, forensics caret */}
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 font-mono text-cyan-400">
                    {scan.scan_type === 'url' ? <CyberLinkIcon size={10} /> : <CyberFileIcon size={10} />}
                    <span>{scan.scan_type.toUpperCase()}</span>
                  </span>
                  <span
                    className={`font-mono font-bold ${
                      isHigh ? 'text-rose-400' : isSuspicious ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {scan.risk_score}/100
                  </span>
                </div>
                <span className="text-cyan-400 font-medium font-mono">Forensics →</span>
              </div>
            </button>
          )
        })}
      </div>

      <AdminThreatDrawer scan={selectedScan} onClose={handleClose} />
    </>
  )
}
