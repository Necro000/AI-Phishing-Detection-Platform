'use client'

import React from 'react'
import type { ScanRow } from '@/components/DashboardHistoryTable'
import { CyberLockIcon, CyberWarningIcon } from '@/components/icons/CyberIcons'

interface BentoRecentThreatsProps {
  scans: ScanRow[]
}

export function BentoRecentThreats({ scans }: BentoRecentThreatsProps) {
  const threats = scans.filter((s) => s.risk_level === 'HIGH_RISK' || s.risk_level === 'SUSPICIOUS')
  const firstThreat = threats[0]
  const secondThreat = threats[1]

  function formatRelativeTime(isoDate?: string, fallback = '2m ago'): string {
    if (!isoDate) return fallback
    const diffMs = Date.now() - new Date(isoDate).getTime()
    const diffMin = Math.max(1, Math.round(diffMs / 60000))
    if (diffMin < 60) return `${diffMin}m ago`
    const diffH = Math.round(diffMin / 60)
    if (diffH < 24) return `${diffH}h ago`
    return `${Math.round(diffH / 24)}d ago`
  }

  return (
    <div className="flex flex-col gap-4 h-full justify-between">
      {/* Card 1: Credential Harvester */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.1)] flex flex-col justify-between overflow-hidden group flex-1 transition-all duration-300 hover:border-cyan-500/40">
        {/* Top cyan energy highlight */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-inner">
                <CyberLockIcon size={22} variant="rose" glow />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Credential Harvester
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400">Phishing attempt</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30">
              Interception
            </span>
          </div>

          {/* Target telemetry card */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Target
              </span>
              <span className="font-mono text-[10px] text-cyan-400/90">
                {firstThreat?.scan_type?.toUpperCase() ?? 'URL'}
              </span>
            </div>
            <p className="font-mono text-xs text-slate-200 truncate" title={firstThreat?.input ?? 'http://192.168.1.1/paypal/login.php'}>
              {firstThreat ? firstThreat.input : 'http://192.168.1.1/paypal/login.php'}
            </p>
            {/* Detection signature badge */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Vector:</span>
              <span className="text-[10px] text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 truncate max-w-[200px]">
                {firstThreat?.reasons?.[0] ?? 'Fake OAuth & Credentials harvest pattern'}
              </span>
            </div>
          </div>
        </div>

        {/* Severity Footer */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">Severity:</span>
            <span className="text-rose-400 font-bold font-mono uppercase text-xs tracking-wider">
              {firstThreat?.risk_level === 'HIGH_RISK' ? 'HIGH' : firstThreat?.risk_level ?? 'HIGH'}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
            Blocked: {formatRelativeTime(firstThreat?.created_at, '2m ago')}
          </span>
        </div>
      </div>

      {/* Card 2: Typosquatting */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.1)] flex flex-col justify-between overflow-hidden group flex-1 transition-all duration-300 hover:border-cyan-500/40">
        {/* Top cyan energy highlight */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <CyberWarningIcon size={22} variant="amber" glow />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  Typosquatting
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                </h3>
                <p className="text-xs text-slate-400">User redirect</p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Spoof Match
            </span>
          </div>

          {/* Target telemetry card */}
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/5 space-y-2 mb-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 flex items-center gap-1">
                <svg className="w-3 h-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                </svg>
                Domain
              </span>
              <span className="font-mono text-[10px] text-amber-400/90">
                PUNYCODE
              </span>
            </div>
            <p className="font-mono text-xs text-slate-200 truncate" title={secondThreat?.input ?? 'g00gle.com'}>
              {secondThreat ? secondThreat.input : 'g00gle.com'}
            </p>
            {/* Detection signature badge */}
            <div className="flex items-center gap-1.5 pt-1">
              <span className="text-[10px] text-slate-400">Vector:</span>
              <span className="text-[10px] text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 truncate max-w-[200px]">
                {secondThreat?.reasons?.[0] ?? 'Lookalike domain & homoglyph character spoof'}
              </span>
            </div>
          </div>
        </div>

        {/* Severity Footer */}
        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">Severity:</span>
            <span className="text-amber-400 font-bold font-mono uppercase text-xs tracking-wider">
              {secondThreat?.risk_level === 'SUSPICIOUS' ? 'MEDIUM' : secondThreat?.risk_level ?? 'MEDIUM'}
            </span>
          </div>
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-slate-500" />
            Blocked: {formatRelativeTime(secondThreat?.created_at, '9m ago')}
          </span>
        </div>
      </div>
    </div>
  )
}
