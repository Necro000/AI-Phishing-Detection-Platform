'use client'

import React, { useState } from 'react'
import { KEYWORD_CATEGORIES, CATEGORY_LABELS } from '@/lib/ruleEngine/categories'
import { KeywordItem } from '@/components/KeywordManager'
import { CyberTerminalIcon, CyberZapIcon, CyberShieldIcon } from '@/components/icons/CyberIcons'

interface KeywordRuleForgeProps {
  existingKeywords: KeywordItem[]
  onKeywordAdded: (newKeyword: KeywordItem) => void
}

export default function KeywordRuleForge({ existingKeywords, onKeywordAdded }: KeywordRuleForgeProps) {
  const [keyword, setKeyword] = useState('')
  const [weight, setWeight] = useState(20)
  const [category, setCategory] = useState<string>(KEYWORD_CATEGORIES[0])
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Real-time duplicate check
  const normalizedInput = keyword.trim().toLowerCase()
  const isDuplicate = normalizedInput !== '' && existingKeywords.some(
    (k) => k.keyword.toLowerCase() === normalizedInput
  )

  // Weight impact zone styling
  let weightZoneLabel = 'LOW IMPACT'
  let weightZoneColor = 'text-cyan-400'
  let weightZoneBg = 'bg-cyan-500/10 border-cyan-500/30'

  if (weight >= 26) {
    weightZoneLabel = 'CRITICAL HEURISTIC'
    weightZoneColor = 'text-rose-400'
    weightZoneBg = 'bg-rose-500/10 border-rose-500/30'
  } else if (weight >= 16) {
    weightZoneLabel = 'MODERATE IMPACT'
    weightZoneColor = 'text-amber-400'
    weightZoneBg = 'bg-amber-500/10 border-amber-500/30'
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (isDuplicate) {
      setError(`Keyword "${normalizedInput}" is already registered in the signature catalog.`)
      return
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : category
    if (!finalCategory) {
      setError('Please select or provide a category.')
      return
    }

    // Defensive clamping per Architecture.md §4
    const sanitizedWeight = Math.min(40, Math.max(1, Math.round(Number(weight))))

    setLoading(true)
    try {
      const res = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: normalizedInput,
          weight: sanitizedWeight,
          category: finalCategory,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to forge signature rule')
      } else {
        onKeywordAdded(data.keyword)
        setKeyword('')
        setWeight(20)
        setCustomCategory('')
        setIsCustomCategory(false)
        setSuccess(`Signature "${data.keyword.keyword}" forged successfully (+${data.keyword.weight} pts).`)
        setTimeout(() => setSuccess(null), 4000)
      }
    } catch {
      setError('Network error communicating with signature engine.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative rounded-2xl bg-slate-900/60 border border-cyan-500/30 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.08)] flex flex-col justify-between">
      {/* Ambient Top Glow Line */}
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/70 to-transparent" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
              <CyberTerminalIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                SIGNATURE FORGE
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Deploy dynamic detection trigger to engine
              </p>
            </div>
          </div>

          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            AUTO-SYNC
          </span>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-mono flex items-center justify-between">
            <span>⚠ {error}</span>
            <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center justify-between">
            <span>✓ {success}</span>
            <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Keyword / Phrase Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-medium text-slate-300">
                Trigger Phrase / Token
              </label>
              {isDuplicate && (
                <span className="text-[11px] font-mono text-rose-400 animate-pulse">
                  ⚠ Duplicate Signature
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="e.g. urgent wire transfer, verify account"
                className={`w-full px-3.5 py-2.5 bg-slate-950/70 border rounded-xl text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition ${
                  isDuplicate
                    ? 'border-rose-500/50 focus:ring-rose-500'
                    : 'border-slate-800 focus:border-cyan-500/50 focus:ring-cyan-500/30'
                }`}
              />
              <span className="absolute right-3 top-2.5 text-[11px] font-mono text-slate-600">
                {keyword.length > 0 ? `${keyword.length} chars` : 'substring'}
              </span>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-mono font-medium text-slate-300 mb-1.5">
              Threat Vector / Category
            </label>
            {!isCustomCategory ? (
              <select
                value={category}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true)
                  } else {
                    setCategory(e.target.value)
                  }
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition"
              >
                {KEYWORD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat} className="bg-slate-900 text-slate-200">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </option>
                ))}
                <option value="__custom__" className="bg-slate-900 text-cyan-400 font-semibold">
                  + Custom Category...
                </option>
              </select>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  autoFocus
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category name"
                  className="w-full px-3.5 py-2 bg-slate-950/70 border border-cyan-500/40 rounded-xl text-sm font-mono text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Weight Slider (1-40 pts) */}
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <CyberZapIcon className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono font-medium text-slate-300">
                  Heuristic Weight (1–40)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${weightZoneBg} ${weightZoneColor}`}>
                  {weightZoneLabel}
                </span>
                <span className="text-sm font-bold font-mono text-white">
                  +{weight} pts
                </span>
              </div>
            </div>

            <input
              type="range"
              min={1}
              max={40}
              step={1}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
            />

            <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1.5">
              <span>Min: 1 pt</span>
              <span>Suspicious Threshold: 30 pts</span>
              <span>Cap: 40 pts</span>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading || !keyword.trim() || isDuplicate}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <span>FORGING SIGNATURE...</span>
            ) : (
              <>
                <CyberShieldIcon className="w-4 h-4" />
                <span>DEPLOY DETECTION SIGNATURE</span>
              </>
            )}
          </button>
        </form>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>RULE ENGINE SPEC §4</span>
        <span className="text-cyan-400/80">MAX CAPPED: 40 PTS</span>
      </div>
    </div>
  )
}
