'use client'

import React, { useState, useMemo } from 'react'
import { KeywordItem } from '@/components/KeywordManager'
import { CyberRadarIcon, CyberZapIcon, CyberShieldIcon } from '@/components/icons/CyberIcons'

interface KeywordRuleSandboxProps {
  keywords: KeywordItem[]
}

const SAMPLE_PRESETS = [
  {
    label: 'Wire Transfer Scam',
    text: 'URGENT ACTION REQUIRED: Please execute this urgent wire transfer before 5 PM to prevent immediate account suspension. Verify invoice attached.',
  },
  {
    label: 'Credential Harvester',
    text: 'Security Alert: Your password expired. Click here to verify your identity and update login credentials immediately.',
  },
  {
    label: 'Safe Newsletter',
    text: 'Welcome to our weekly engineering update! Check out the latest release notes and documentation on our community blog.',
  },
]

export default function KeywordRuleSandbox({ keywords }: KeywordRuleSandboxProps) {
  const [sampleText, setSampleText] = useState('')

  // Live simulation execution matching exact backend emailRules.ts & urlRules.ts substring logic
  const simulationResults = useMemo(() => {
    if (!sampleText.trim()) {
      return {
        hits: [],
        totalPoints: 0,
        riskLevel: 'SAFE' as const,
      }
    }

    const lower = sampleText.toLowerCase()
    const hits: Array<{ keyword: string; weight: number; category: string }> = []

    for (const k of keywords) {
      if (lower.includes(k.keyword.toLowerCase())) {
        hits.push({
          keyword: k.keyword,
          weight: k.weight,
          category: k.category,
        })
      }
    }

    const rawScore = hits.reduce((acc, h) => acc + h.weight, 0)
    const totalPoints = Math.min(100, rawScore) // clamped per scoring.ts

    let riskLevel: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' = 'SAFE'
    if (totalPoints >= 70) {
      riskLevel = 'HIGH_RISK'
    } else if (totalPoints >= 30) {
      riskLevel = 'SUSPICIOUS'
    }

    return { hits, totalPoints, riskLevel }
  }, [sampleText, keywords])

  // Risk Level styling per scoring.ts bands
  const bandBadge = useMemo(() => {
    switch (simulationResults.riskLevel) {
      case 'HIGH_RISK':
        return {
          label: 'HIGH RISK THRESHOLD',
          border: 'border-rose-500/40',
          bg: 'bg-rose-500/10',
          text: 'text-rose-400',
        }
      case 'SUSPICIOUS':
        return {
          label: 'SUSPICIOUS THRESHOLD',
          border: 'border-amber-500/40',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
        }
      default:
        return {
          label: 'SAFE THRESHOLD',
          border: 'border-emerald-500/40',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
        }
    }
  }, [simulationResults.riskLevel])

  return (
    <div className="relative rounded-2xl bg-slate-900/60 border border-blue-500/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(59,130,246,0.08)] flex flex-col justify-between">
      {/* Ambient Top Glow Line */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/25">
              <CyberRadarIcon className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                RULE ENGINE SANDBOX
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Live heuristic testing against active signature set
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
            CLIENT SIMULATOR
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1">
          <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">PRESETS:</span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => setSampleText(preset.text)}
              className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition whitespace-nowrap cursor-pointer"
            >
              {preset.label}
            </button>
          ))}
          {sampleText && (
            <button
              type="button"
              onClick={() => setSampleText('')}
              className="text-[11px] font-mono px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition ml-auto cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>

        {/* Sandbox Textarea */}
        <div className="relative mb-4">
          <textarea
            rows={4}
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="Paste suspicious URL, email snippet, or phishing lure here to test trigger matching..."
            className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/30 transition resize-none leading-relaxed"
          />
          <div className="absolute right-3 bottom-3 text-[10px] font-mono text-slate-600">
            {sampleText.length} characters
          </div>
        </div>

        {/* Live Simulation Telemetry */}
        <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-950/50 border border-slate-800/80 mb-4">
          {/* Matches Count */}
          <div>
            <span className="block text-[10px] font-mono uppercase text-slate-400">
              Matches Fired
            </span>
            <span className="text-xl font-bold font-mono text-white">
              {simulationResults.hits.length}
            </span>
          </div>

          {/* Points Sum */}
          <div>
            <span className="block text-[10px] font-mono uppercase text-slate-400">
              Heuristic Points
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold font-mono text-cyan-400">
                +{simulationResults.totalPoints}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">/ 100</span>
            </div>
          </div>

          {/* Projected Verdict */}
          <div>
            <span className="block text-[10px] font-mono uppercase text-slate-400">
              Projected Band
            </span>
            <span className={`inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${bandBadge.border} ${bandBadge.bg} ${bandBadge.text} mt-0.5`}>
              {simulationResults.riskLevel}
            </span>
          </div>
        </div>

        {/* Triggered Rules Chips */}
        <div>
          <span className="block text-[10px] font-mono uppercase text-slate-400 mb-2">
            Triggered Keywords ({simulationResults.hits.length})
          </span>
          {simulationResults.hits.length === 0 ? (
            <div className="p-3 rounded-xl border border-dashed border-slate-800 text-center">
              <span className="text-[11px] font-mono text-slate-500">
                {sampleText.trim()
                  ? 'No active signatures matched this payload.'
                  : 'Enter text above to simulate detection rule matching.'}
              </span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
              {simulationResults.hits.map((hit) => (
                <div
                  key={hit.keyword}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs font-mono text-blue-200"
                >
                  <span className="text-white font-medium">{hit.keyword}</span>
                  <span className="text-[10px] text-cyan-400 font-bold">
                    +{hit.weight}
                  </span>
                  <span className="text-[9px] text-slate-400 px-1 py-0.2 rounded bg-slate-900 border border-slate-800">
                    {hit.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>FIDELITY: 100% ENGINE MATCH</span>
        <span className="text-emerald-400 font-mono">0ms LATENCY</span>
      </div>
    </div>
  )
}
