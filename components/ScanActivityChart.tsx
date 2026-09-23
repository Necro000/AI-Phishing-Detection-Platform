'use client'

import React, { useState } from 'react'

export interface DailyActivityPoint {
  date: string // e.g. "2026-09-20"
  label: string // e.g. "Sun"
  safe: number
  suspicious: number
  highRisk: number
  total: number
}

interface ScanActivityChartProps {
  data: DailyActivityPoint[]
  className?: string
}

export function ScanActivityChart({ data, className = '' }: ScanActivityChartProps) {
  const [activeDay, setActiveDay] = useState<DailyActivityPoint | null>(null)

  // Aggregates
  const totalWeekly = data.reduce((acc, d) => acc + d.total, 0)
  const highRiskWeekly = data.reduce((acc, d) => acc + d.highRisk, 0)
  const suspiciousWeekly = data.reduce((acc, d) => acc + d.suspicious, 0)
  const safeWeekly = data.reduce((acc, d) => acc + d.safe, 0)
  const threatRate = totalWeekly > 0 ? Math.round((highRiskWeekly / totalWeekly) * 100) : 0

  // Chart dimensions & calculations
  const chartHeight = 160
  const maxVal = Math.max(...data.map((d) => d.total), 5)

  // Generate SVG area and stroke path coordinates across the 7 days (width 700, height 140)
  const pointsCount = data.length || 7
  const stepX = pointsCount > 1 ? 700 / (pointsCount - 1) : 700
  const baselineY = 135

  const getY = (val: number) => {
    const ratio = maxVal > 0 ? Math.min(val / maxVal, 1) : 0
    return baselineY - ratio * (baselineY - 15)
  }

  // Generate smooth cubic bezier SVG path string
  function generateCurvePath(getYValue: (d: DailyActivityPoint) => number): string {
    if (data.length === 0) return `M 0 ${baselineY} L 700 ${baselineY}`
    const pts = data.map((d, i) => ({ x: i * stepX, y: getYValue(d) }))
    let dStr = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i]
      const p1 = pts[i + 1]
      const cp1x = p0.x + (p1.x - p0.x) / 2
      const cp1y = p0.y
      const cp2x = p0.x + (p1.x - p0.x) / 2
      const cp2y = p1.y
      dStr += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`
    }
    return dStr
  }

  // Paths for Safe, Suspicious, HighRisk
  const totalCurve = generateCurvePath((d) => getY(d.total))
  const totalArea = `${totalCurve} L 700 ${baselineY} L 0 ${baselineY} Z`

  const highRiskCurve = generateCurvePath((d) => getY(d.highRisk))
  const highRiskArea = `${highRiskCurve} L 700 ${baselineY} L 0 ${baselineY} Z`

  const suspCurve = generateCurvePath((d) => getY(d.suspicious + d.highRisk))
  const suspArea = `${suspCurve} L 700 ${baselineY} L 0 ${baselineY} Z`

  return (
    <div
      className={`relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-6 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] overflow-hidden ${className}`}
    >
      {/* Top energy highlight */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <h3 className="text-base font-bold text-white tracking-tight font-sans">
              Threat Activity Timeline
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              Live Streamgraph
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            7-day multi-tone rolling incident volume categorized by threat level
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]" />
            <span className="text-slate-300 text-[11px]">Safe ({safeWeekly})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
            <span className="text-slate-300 text-[11px]">Suspicious ({suspiciousWeekly})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
            <span className="text-slate-300 text-[11px]">High Risk ({highRiskWeekly})</span>
          </div>
        </div>
      </div>

      {/* Modern Multi-Tone Area Streamgraph Visualization */}
      <div className="relative pt-2">
        <svg
          viewBox="0 0 700 150"
          className="w-full h-36 sm:h-44 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Safe / Total Area Gradient (Cyan / Emerald) */}
            <linearGradient id="totalAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
            </linearGradient>

            {/* Suspicious Area Gradient (Amber) */}
            <linearGradient id="suspAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
            </linearGradient>

            {/* High-Risk Area Gradient (Rose) */}
            <linearGradient id="roseAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.0" />
            </linearGradient>

            <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22D3EE" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#818CF8" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1="35" x2="700" y2="35" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="0" y1="85" x2="700" y2="85" stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
          <line x1="0" y1={baselineY} x2="700" y2={baselineY} stroke="rgba(255,255,255,0.1)" />

          {/* Area Fills */}
          <path d={totalArea} fill="url(#totalAreaGrad)" />
          <path d={suspArea} fill="url(#suspAreaGrad)" />
          <path d={highRiskArea} fill="url(#roseAreaGrad)" />

          {/* Wave Curves */}
          <path
            d={totalCurve}
            fill="none"
            stroke="url(#cyanLineGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
          />
          {highRiskWeekly > 0 && (
            <path
              d={highRiskCurve}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(244,63,94,0.7)]"
            />
          )}

          {/* Daily Data Nodes */}
          {data.map((d, idx) => {
            const x = idx * stepX
            const y = getY(d.total)
            const isHigh = d.highRisk > 0
            const isSusp = d.suspicious > 0
            const nodeColor = isHigh ? '#F43F5E' : isSusp ? '#F59E0B' : '#22D3EE'

            return (
              <g key={d.date}>
                <circle cx={x} cy={y} r="4" fill="#090E17" stroke={nodeColor} strokeWidth="2.25" />
                {d.total > 0 && (
                  <circle cx={x} cy={y} r="2" fill={nodeColor} />
                )}
              </g>
            )
          })}
        </svg>

        {/* Interactive Column Hover Hitboxes */}
        <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end absolute inset-0 pt-4">
          {data.map((day) => {
            return (
              <div
                key={day.date}
                onMouseEnter={() => setActiveDay(day)}
                onMouseLeave={() => setActiveDay(null)}
                className="flex flex-col items-center justify-end h-full relative cursor-pointer group"
              >
                {/* Floating Tooltip */}
                <div className="absolute -top-16 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30 bg-slate-950/95 border border-cyan-500/30 rounded-xl px-3 py-2 shadow-2xl text-[11px] font-mono whitespace-nowrap text-slate-200 backdrop-blur-xl">
                  <div className="font-bold text-white border-b border-white/10 pb-1 mb-1 flex items-center justify-between gap-3">
                    <span>{day.date}</span>
                    <span className="text-cyan-400">{day.total} total</span>
                  </div>
                  <div className="flex items-center gap-3 text-[10px]">
                    <span className="text-emerald-400">Safe: {day.safe}</span>
                    <span className="text-amber-400">Susp: {day.suspicious}</span>
                    <span className="text-rose-400">High: {day.highRisk}</span>
                  </div>
                </div>

                {/* Subtle vertical hover guide beam */}
                <div className="w-full max-w-[40px] h-full bg-cyan-500/0 group-hover:bg-cyan-500/10 rounded-xl transition-colors border-x border-transparent group-hover:border-cyan-500/20 pointer-events-none" />
              </div>
            )
          })}
        </div>

        {/* Date Labels below chart */}
        <div className="grid grid-cols-7 text-center pt-3 border-t border-white/5 font-mono text-[11px] text-slate-400">
          {data.map((d) => (
            <div key={d.date} className="hover:text-cyan-400 transition-colors">
              <span className="font-bold">{d.label}</span>
              <span className="block text-[9px] text-slate-500">{d.total}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Forensic Telemetry Strip */}
      <div className="mt-4 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-slate-400 gap-2">
        <div className="flex items-center gap-3">
          <span>7-Day Rolling Volume: <strong className="text-white">{totalWeekly} Scans</strong></span>
          <span className="text-slate-600">|</span>
          <span>Threat Interceptions: <strong className="text-rose-400">{highRiskWeekly} Critical</strong></span>
        </div>
        <div>
          <span>Incident Escalation Rate: <strong className={threatRate > 0 ? 'text-rose-400' : 'text-emerald-400'}>{threatRate}%</strong></span>
        </div>
      </div>
    </div>
  )
}
