'use client'

import React from 'react'
import { KeywordItem } from '@/components/KeywordManager'
import { CyberShieldIcon, CyberZapIcon, CyberRadarIcon, CyberCpuIcon } from '@/components/icons/CyberIcons'

interface KeywordKpisProps {
  keywords: KeywordItem[]
}

export default function KeywordKpis({ keywords }: KeywordKpisProps) {
  const totalKeywords = keywords.length

  // Average weight calculation (clamped against div-by-zero)
  const avgWeight = totalKeywords === 0
    ? 0
    : Math.round((keywords.reduce((sum, k) => sum + k.weight, 0) / totalKeywords) * 10) / 10

  // Category distribution calculation
  const categoryCounts: Record<string, number> = {}
  keywords.forEach((k) => {
    categoryCounts[k.category] = (categoryCounts[k.category] || 0) + 1
  })

  const topCategoryEntry = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]
  const topCategoryName = topCategoryEntry ? topCategoryEntry[0].replace(/_/g, ' ') : 'None'
  const topCategoryPct = totalKeywords === 0 ? 0 : Math.round((topCategoryEntry[1] / totalKeywords) * 100)

  // Engine sensitivity index calculation (based on average heuristic weight)
  // Avg 1-15: Balanced (low false-positive profile)
  // Avg 16-25: Guarded (standard SOC posture)
  // Avg 26-40: Aggressive (high interception threshold)
  let sensitivityLabel = 'BALANCED'
  let sensitivityColor = 'text-cyan-400'
  let gaugePct = 35 // default arc fill %

  if (avgWeight >= 26) {
    sensitivityLabel = 'AGGRESSIVE'
    sensitivityColor = 'text-rose-400'
    gaugePct = 85
  } else if (avgWeight >= 16) {
    sensitivityLabel = 'ELEVATED'
    sensitivityColor = 'text-amber-400'
    gaugePct = 60
  }

  // Speed arc calculation for SVG gauge
  const radius = 34
  const circumference = Math.PI * radius // semicircle
  const strokeDashoffset = circumference - (circumference * (gaugePct / 100))

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* KPI 1: Active Detection Signatures */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-cyan-500/20 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-400/80">
            SIGNATURES CATALOG
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
            <CyberShieldIcon className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {totalKeywords}
          </span>
          <span className="text-xs text-cyan-400/80 font-medium">active rules</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-medium">REAL-TIME IN MEMORY</span>
          </div>
          <span className="font-mono text-slate-500">URL & Email</span>
        </div>
      </div>

      {/* KPI 2: Heuristic Weight Density */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-blue-500/20 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-blue-400/80">
            AVG HEURISTIC WEIGHT
          </span>
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/25">
            <CyberZapIcon className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold font-mono tracking-tight text-white">
            {avgWeight}
          </span>
          <span className="text-xs text-slate-400 font-mono">/ 40 max pts</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-3">
          <span className="text-slate-400">Impact Profile:</span>
          <span className="font-mono text-blue-400 font-semibold">
            {avgWeight < 16 ? 'Conservative' : avgWeight < 26 ? 'Balanced' : 'High Impact'}
          </span>
        </div>
      </div>

      {/* KPI 3: Threat Category Distribution */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-purple-500/20 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-purple-500/40 hover:shadow-[0_0_25px_rgba(168,85,247,0.15)]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-purple-400/80">
            PRIMARY VECTOR
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25">
            <CyberRadarIcon className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono capitalize tracking-tight text-white truncate max-w-[170px]">
            {topCategoryName}
          </span>
          <span className="text-xs text-purple-400 font-semibold font-mono">{topCategoryPct}%</span>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-3">
          <span className="text-slate-400">Total Categories:</span>
          <span className="font-mono text-purple-300 font-semibold">
            {Object.keys(categoryCounts).length} vectors
          </span>
        </div>
      </div>

      {/* KPI 4: Engine Sensitivity Index */}
      <div className="relative group overflow-hidden rounded-2xl bg-slate-900/60 border border-cyan-500/20 p-5 backdrop-blur-2xl transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono tracking-wider uppercase text-cyan-400/80">
            ENGINE SENSITIVITY
          </span>
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
            <CyberCpuIcon className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-2">
          <div>
            <span className={`text-xl font-bold font-mono tracking-tight ${sensitivityColor}`}>
              {sensitivityLabel}
            </span>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Threshold Posture</p>
          </div>

          {/* SVG Semicircle Gauge */}
          <div className="relative w-16 h-10 flex items-center justify-center">
            <svg viewBox="0 0 80 45" className="w-full h-full overflow-visible">
              <path
                d="M 6 40 A 34 34 0 0 1 74 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-800"
                strokeLinecap="round"
              />
              <path
                d="M 6 40 A 34 34 0 0 1 74 40"
                fill="none"
                stroke="url(#sensitivityGradient)"
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
              <defs>
                <linearGradient id="sensitivityGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="60%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#f43f5e" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2.5">
          <span className="text-slate-500 text-[10px] font-mono">Max Hit: 40 pts</span>
          <span className="text-[10px] font-mono text-emerald-400">SAFE BAND &lt; 30</span>
        </div>
      </div>
    </div>
  )
}
