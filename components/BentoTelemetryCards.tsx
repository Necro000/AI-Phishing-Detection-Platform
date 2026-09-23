'use client'

import React from 'react'
import { CyberCpuIcon, CyberZapIcon } from '@/components/icons/CyberIcons'

export function BentoTelemetryCards() {
  return (
    <div className="flex flex-col gap-4 h-full justify-between">
      {/* Precision Card matching Mockup */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.1)] flex flex-col justify-between overflow-hidden flex-1 group">
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold font-sans text-white tracking-tight">
              99.4<span className="text-cyan-400 text-xl">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">ML Detection Precision</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center">
            <CyberCpuIcon size={18} glow />
          </div>
        </div>

        {/* Glowing Wave SVG matching Mockup */}
        <div className="pt-2">
          <svg className="w-full h-9 text-cyan-400" viewBox="0 0 100 25" fill="none">
            <path
              d="M0 16 Q 15 4, 30 14 T 60 12 T 85 6 T 100 10"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
            />
          </svg>
        </div>
      </div>

      {/* Latency Card matching Mockup */}
      <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-5 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.1)] flex flex-col justify-between overflow-hidden flex-1 group">
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl font-bold font-sans text-white tracking-tight">
              142<span className="text-cyan-400 text-xl">ms</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Response Latency</p>
          </div>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center">
            <CyberZapIcon size={18} glow />
          </div>
        </div>

        {/* Sound / Frequency Waveform Bars matching Mockup */}
        <div className="flex items-end justify-between gap-1 h-7 pt-1">
          {[20, 35, 60, 45, 90, 75, 40, 65, 85, 95, 70, 50, 80, 40, 20].map((height, i) => (
            <div
              key={i}
              className="flex-1 bg-cyan-400 rounded-full transition-all duration-500 group-hover:brightness-125 shadow-[0_0_6px_rgba(6,182,212,0.4)]"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
