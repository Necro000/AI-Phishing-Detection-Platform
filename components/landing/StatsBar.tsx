import React from 'react'

interface StatItem {
  value: string
  label: string
  detail: string
  color: string
  glowColor: string
}

const STATS: StatItem[] = [
  {
    value: '91.06%',
    label: 'ML Accuracy',
    detail: 'Trained on PhiUSIIL dataset',
    color: 'text-emerald-400',
    glowColor: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
  },
  {
    value: '235,000+',
    label: 'Dataset URLs',
    detail: 'Validated malicious & benign samples',
    color: 'text-blue-400',
    glowColor: 'from-blue-500/10 via-blue-500/5 to-transparent',
  },
  {
    value: '4 Parallel',
    label: 'Signal Sources',
    detail: 'Rules, Safe Browsing, VT, ML',
    color: 'text-violet-400',
    glowColor: 'from-violet-500/10 via-violet-500/5 to-transparent',
  },
  {
    value: '< 3.0s',
    label: 'Detection Speed',
    detail: 'Asynchronous multi-engine latency',
    color: 'text-cyan-400',
    glowColor: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
  },
]

export function StatsBar() {
  return (
    <section className="px-4 py-12 max-w-7xl mx-auto w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b ${stat.glowColor} bg-slate-900/60 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:scale-[1.02] group`}
          >
            <div className="relative z-10">
              <div className={`text-3xl sm:text-4xl font-black tracking-tight ${stat.color} font-mono`}>
                {stat.value}
              </div>
              <div className="text-sm font-semibold text-white mt-1">
                {stat.label}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {stat.detail}
              </div>
            </div>

            {/* Subtle background corner ambient light */}
            <div
              aria-hidden="true"
              className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-white/5 blur-2xl group-hover:bg-white/10 transition-colors pointer-events-none"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
