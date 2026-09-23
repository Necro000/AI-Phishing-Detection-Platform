import React from 'react'

export function ScanResultSkeleton() {
  return (
    <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden animate-pulse">
      {/* Top Cyber Scanner Line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 animate-pulse" />

      {/* Header Skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-3 w-32 bg-slate-800 rounded-md" />
        <div className="h-3 w-20 bg-slate-800/60 rounded-md" />
      </div>

      {/* Circular Gauge Skeleton */}
      <div className="flex flex-col items-center justify-center my-6">
        <div className="relative w-36 h-36 rounded-full border-4 border-dashed border-slate-800 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-slate-800/50 flex flex-col items-center justify-center gap-1">
            <div className="h-6 w-12 bg-slate-700/80 rounded" />
            <div className="h-2.5 w-16 bg-slate-700/50 rounded" />
          </div>
        </div>
        <div className="h-3 w-40 bg-slate-800 rounded mt-4" />
      </div>

      {/* Signal Matrix Skeleton */}
      <div className="mt-6 border-t border-white/10 pt-4">
        <div className="h-3 w-28 bg-slate-800 rounded mb-3" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
            <div className="h-2 w-16 bg-slate-800 rounded" />
            <div className="h-4 w-12 bg-cyan-900/40 rounded" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
            <div className="h-2 w-20 bg-slate-800 rounded" />
            <div className="h-4 w-12 bg-blue-900/40 rounded" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
            <div className="h-2 w-16 bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-800 rounded" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950/70 border border-white/5 space-y-2">
            <div className="h-2 w-20 bg-slate-800 rounded" />
            <div className="h-4 w-16 bg-slate-800 rounded" />
          </div>
        </div>
      </div>

      {/* Live Engine Activity Beacon */}
      <div className="mt-5 border-t border-white/10 pt-4 flex items-center gap-2 text-xs font-mono text-cyan-400">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        <span>Executing parallel multi-signal inference…</span>
      </div>
    </div>
  )
}
