'use client'

import React from 'react'

interface RiskGaugeProps {
  score: number
  level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  size?: number
}

const LEVEL_COLORS = {
  SAFE: {
    stroke: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
    text: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    label: 'Safe',
  },
  SUSPICIOUS: {
    stroke: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.4)',
    text: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    label: 'Suspicious',
  },
  HIGH_RISK: {
    stroke: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
    text: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    label: 'High Risk',
  },
}

export function RiskGauge({ score, level, size = 160 }: RiskGaugeProps) {
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.max(0, Math.min(100, score))
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference
  const config = LEVEL_COLORS[level] || LEVEL_COLORS.SAFE

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
          {/* Background track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            className="text-slate-800"
            strokeWidth="10"
            stroke="currentColor"
            fill="transparent"
          />

          {/* Glowing indicator track */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            stroke={config.stroke}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 8px ${config.glow})`,
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>

        {/* Center score readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold font-mono tracking-tight text-white leading-none">
            {clampedScore}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 mt-1">
            Threat Score
          </span>
        </div>
      </div>

      <div
        className={`mt-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border flex items-center gap-1.5 ${config.bg} ${config.border} ${config.text}`}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: config.stroke, boxShadow: `0 0 6px ${config.stroke}` }}
        />
        <span>{config.label}</span>
      </div>
    </div>
  )
}
