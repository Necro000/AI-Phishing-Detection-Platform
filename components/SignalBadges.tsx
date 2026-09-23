import React from 'react'

export interface SignalBadgesProps {
  scanType?: 'url' | 'email'
  rules?: number | null
  safeBrowsing?: boolean | null
  virusTotal?: boolean | null
  vtVendors?: number | null
  ml?: number | null
  className?: string
}

export function SignalBadges({
  scanType = 'url',
  rules = 0,
  safeBrowsing,
  virusTotal,
  vtVendors,
  ml,
  className = '',
}: SignalBadgesProps) {
  if (scanType === 'email') {
    const rulesScore = rules ?? 0
    return (
      <div className={`flex flex-wrap items-center gap-1.5 font-mono text-[10px] ${className}`}>
        <span
          className={`px-1.5 py-0.5 rounded border ${
            rulesScore > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}
          title={`Email heuristic score: ${rulesScore}`}
        >
          Rules: {rulesScore > 0 ? `+${rulesScore}` : '0'}
        </span>
        <span
          className="px-1.5 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
          title="Zero external API consumption"
        >
          Heuristic Only
        </span>
      </div>
    )
  }

  const rulesScore = rules ?? 0

  return (
    <div className={`flex flex-wrap items-center gap-1 font-mono text-[10px] ${className}`}>
      {/* 1. Rules Badge */}
      <span
        className={`px-1.5 py-0.5 rounded border transition-colors ${
          rulesScore > 0
            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
            : 'bg-white/5 border-white/10 text-slate-400'
        }`}
        title={`Lexical heuristic rules score: ${rulesScore}`}
      >
        R:{rulesScore > 0 ? `+${rulesScore}` : '0'}
      </span>

      {/* 2. Google Safe Browsing Badge */}
      {safeBrowsing === true ? (
        <span
          className="px-1.5 py-0.5 rounded border bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold"
          title="Google Safe Browsing flagged malicious"
        >
          SB:Threat
        </span>
      ) : safeBrowsing === false ? (
        <span
          className="px-1.5 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          title="Safe Browsing verified clean"
        >
          SB:Clean
        </span>
      ) : (
        <span
          className="px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-slate-500"
          title="Safe Browsing not queried or bypassed"
        >
          SB:—
        </span>
      )}

      {/* 3. VirusTotal Badge */}
      {virusTotal === true ? (
        <span
          className="px-1.5 py-0.5 rounded border bg-rose-500/15 border-rose-500/40 text-rose-300 font-bold"
          title={`VirusTotal flagged malicious${vtVendors ? ` by ${vtVendors} engines` : ''}`}
        >
          VT:{vtVendors ? `${vtVendors} hit` : 'Threat'}
        </span>
      ) : virusTotal === false ? (
        <span
          className="px-1.5 py-0.5 rounded border bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          title="VirusTotal engines found clean"
        >
          VT:Clean
        </span>
      ) : (
        <span
          className="px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-slate-500"
          title="VirusTotal not queried or cached"
        >
          VT:—
        </span>
      )}

      {/* 4. PhiUSIIL ML Model Badge */}
      {ml !== null && ml !== undefined ? (
        <span
          className={`px-1.5 py-0.5 rounded border font-semibold ${
            ml >= 0.7
              ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
              : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-300'
          }`}
          title={`ML Confidence: ${(ml * 100).toFixed(1)}%`}
        >
          ML:{(ml * 100).toFixed(0)}%
        </span>
      ) : (
        <span
          className="px-1.5 py-0.5 rounded border bg-white/5 border-white/10 text-slate-500"
          title="ML score unavailable"
        >
          ML:—
        </span>
      )}
    </div>
  )
}
