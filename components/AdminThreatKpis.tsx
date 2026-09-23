/**
 * AdminThreatKpis — Server Component
 *
 * Renders four high-impact Cyber SOC KPI cards in a modern Bento grid.
 * Pure Server Component: Renders GPU-accelerated SVG sparklines, gauges,
 * and meters with zero client-side hydration overhead.
 */

import React from 'react'
import {
  CyberShieldIcon,
  CyberWarningIcon,
  CyberRadarIcon,
  CyberLinkIcon,
  CyberFileIcon,
} from '@/components/icons/CyberIcons'

interface KpiData {
  totalScans: number
  highRiskCount: number
  suspiciousCount: number
  urlCount: number
  emailCount: number
  last24hCount: number
}

interface Props {
  kpi: KpiData
}

export default function AdminThreatKpis({ kpi }: Props) {
  const {
    totalScans,
    highRiskCount,
    suspiciousCount,
    urlCount,
    emailCount,
    last24hCount,
  } = kpi

  const highRiskRate =
    totalScans > 0 ? ((highRiskCount / totalScans) * 100).toFixed(1) : '0.0'
  const suspiciousRate =
    totalScans > 0 ? ((suspiciousCount / totalScans) * 100).toFixed(1) : '0.0'
  const urlPct =
    totalScans > 0 ? Math.round((urlCount / totalScans) * 100) : 0
  const emailPct = 100 - urlPct

  // Mathematical gauge arc calculation for High-Risk Rate (clamped 0-100)
  const numericRiskRate = Math.min(Math.max(parseFloat(highRiskRate), 0), 100)
  const gaugeCircumference = 157 // approx half circle for r=50 (PI * 50)
  const gaugeOffset = gaugeCircumference - (numericRiskRate / 100) * gaugeCircumference

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* ── Card 1: Total Interceptions ────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-cyan-400 font-medium uppercase tracking-wider">
                Total Interceptions
              </span>
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-sans">
              {totalScans.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-400 font-semibold font-mono">+{last24hCount}</span>
              <span>scans in last 24h</span>
            </p>
          </div>

          <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <CyberRadarIcon size={18} glow />
          </div>
        </div>

        {/* Wave sparkline visual */}
        <div className="pt-4">
          <svg className="w-full h-8 text-cyan-400" viewBox="0 0 100 25" fill="none">
            <path
              d="M0 18 Q 20 6, 40 15 T 70 8 T 100 14"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(6,182,212,0.5)]"
            />
          </svg>
        </div>
      </div>

      {/* ── Card 2: Threat Interception Rate ─────────────────────────────────── */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(244,63,94,0.15)] flex flex-col justify-between overflow-hidden group hover:border-rose-500/40 transition-all">
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-rose-400 font-medium uppercase tracking-wider">
              High-Risk Threat Rate
            </span>
            <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-sans">
              {highRiskRate}<span className="text-rose-400 text-xl font-mono">%</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="text-rose-400 font-mono font-semibold">{highRiskCount}</span> critical hostile targets
            </p>
          </div>

          <div className="w-9 h-9 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <CyberWarningIcon size={18} variant="rose" glow />
          </div>
        </div>

        {/* High-Risk Speed Gauge Arc */}
        <div className="pt-2 flex items-center justify-between">
          <div className="w-full max-w-[140px] h-9 relative flex items-center">
            <svg viewBox="0 0 120 65" className="w-full h-full overflow-visible">
              {/* Background Arc */}
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="8"
                strokeLinecap="round"
              />
              {/* Value Gauge Arc */}
              <path
                d="M 10 55 A 50 50 0 0 1 110 55"
                fill="none"
                stroke="#F43F5E"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="157"
                strokeDashoffset={gaugeOffset}
                className="drop-shadow-[0_0_8px_rgba(244,63,94,0.6)]"
              />
            </svg>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            Critical Tier
          </span>
        </div>
      </div>

      {/* ── Card 3: Anomaly / Suspicious Rate ───────────────────────────────── */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(245,158,11,0.15)] flex flex-col justify-between overflow-hidden group hover:border-amber-500/40 transition-all">
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-amber-400 font-medium uppercase tracking-wider">
              Anomalies &amp; Review
            </span>
            <div className="text-3xl font-extrabold text-white tracking-tight mt-1 font-sans">
              {suspiciousCount.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              <span className="text-amber-400 font-mono font-semibold">{suspiciousRate}%</span> flagged for inspection
            </p>
          </div>

          <div className="w-9 h-9 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <CyberWarningIcon size={18} variant="amber" glow />
          </div>
        </div>

        {/* Spectrum Bar Waveform */}
        <div className="flex items-end justify-between gap-1 h-8 pt-2">
          {[35, 55, 75, 40, 90, 60, 45, 80, 65, 30, 85, 45].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-amber-400/85 rounded-full transition-all duration-300 group-hover:brightness-125 shadow-[0_0_5px_rgba(245,158,11,0.4)]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* ── Card 4: Attack Vector Split ─────────────────────────────────────── */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] flex flex-col justify-between overflow-hidden group hover:border-cyan-500/40 transition-all">
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-purple-400 to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <span className="text-xs font-mono text-cyan-400 font-medium uppercase tracking-wider">
              Attack Vector Split
            </span>
            <div className="text-2xl font-extrabold text-white tracking-tight mt-1 font-sans flex items-baseline gap-2">
              <span>{urlPct}% <span className="text-xs text-cyan-400 font-mono">URL</span></span>
              <span className="text-slate-500 text-sm">/</span>
              <span>{emailPct}% <span className="text-xs text-purple-400 font-mono">Email</span></span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {totalScans} cumulative vector inputs
            </p>
          </div>

          <div className="w-9 h-9 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <CyberShieldIcon size={18} glow />
          </div>
        </div>

        {/* Dual-color Progress Split Bar */}
        <div className="space-y-2 pt-2">
          <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden flex border border-white/5">
            <div
              style={{ width: `${urlPct}%` }}
              className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full shadow-[0_0_8px_rgba(6,182,212,0.5)] transition-all"
              title={`URLs: ${urlPct}%`}
            />
            <div
              style={{ width: `${emailPct}%` }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full shadow-[0_0_8px_rgba(168,85,247,0.5)] transition-all"
              title={`Emails: ${emailPct}%`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <CyberLinkIcon size={11} /> {urlCount} URLs
            </span>
            <span className="flex items-center gap-1">
              <CyberFileIcon size={11} /> {emailCount} Emails
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
