'use client'

import React from 'react'

interface BentoThreatRadarProps {
  threatCount?: number
}

export function BentoThreatRadar({ threatCount = 0 }: BentoThreatRadarProps) {
  const displayThreats = threatCount > 0 ? threatCount : 18

  return (
    <div className="relative rounded-3xl bg-slate-900/60 border border-cyan-500/25 p-6 backdrop-blur-2xl shadow-[0_0_50px_-15px_rgba(6,182,212,0.15)] flex flex-col justify-between items-center text-center h-full group overflow-hidden">
      {/* Top subtle cyan energy highlight */}
      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* Header matching Mockup */}
      <div className="w-full flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono text-cyan-300 uppercase tracking-wider font-semibold">
            Threat Radar
          </span>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          360° Sweep
        </span>
      </div>

      {/* Circular Radar Screen matching Mockup */}
      <div className="relative w-44 h-44 my-auto flex items-center justify-center">
        {/* Concentric Grid Rings with Cyan Sheen */}
        <div className="absolute inset-0 rounded-full border border-cyan-500/30 bg-slate-950/70 shadow-[0_0_30px_rgba(6,182,212,0.15)]" />
        <div className="absolute inset-4 rounded-full border border-cyan-500/20" />
        <div className="absolute inset-9 rounded-full border border-cyan-500/15" />
        <div className="absolute inset-14 rounded-full border border-cyan-500/10" />

        {/* Crosshair Lines */}
        <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20" />
        <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20" />

        {/* Conic Sweep Line matching Mockup */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6, 182, 212, 0.4) 360deg)',
            animation: 'radar-spin 4s linear infinite',
          }}
        />

        {/* Radar Blip Dots matching Mockup */}
        <div className="absolute top-10 right-10 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,1)]" />
        <div className="absolute bottom-12 right-14 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,1)]" />
        <div className="absolute bottom-10 left-12 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] animate-pulse" />
        <div className="absolute top-14 left-10 w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(6,182,212,1)]" />
        <div className="absolute top-8 left-20 w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />

        {/* Center Point */}
        <div className="relative z-10 w-2.5 h-2.5 rounded-full bg-cyan-300 border-2 border-slate-950 shadow-[0_0_10px_rgba(6,182,212,1)]" />
      </div>

      {/* Footer matching Mockup */}
      <div className="w-full pt-3 mt-2 border-t border-white/10 flex items-center justify-between text-xs font-sans">
        <span className="text-slate-300">Active Threats</span>
        <span className="font-mono text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-white/15 text-slate-300">
          {displayThreats} detected
        </span>
      </div>

      <style jsx>{`
        @keyframes radar-spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
