'use client'

import React, { useState, useMemo } from 'react'
import KeywordKpis from '@/components/admin/keywords/KeywordKpis'
import KeywordRuleForge from '@/components/admin/keywords/KeywordRuleForge'
import KeywordRuleSandbox from '@/components/admin/keywords/KeywordRuleSandbox'
import { KEYWORD_CATEGORIES, CATEGORY_LABELS } from '@/lib/ruleEngine/categories'
import {
  CyberTerminalIcon,
  CyberShieldIcon,
  CyberTrashIcon,
  CyberZapIcon,
} from '@/components/icons/CyberIcons'

export interface KeywordItem {
  id: string
  keyword: string
  weight: number
  category: string
  created_at: string
}

interface Props {
  initialKeywords: KeywordItem[]
}

export default function KeywordManager({ initialKeywords }: Props) {
  const [keywords, setKeywords] = useState<KeywordItem[]>(initialKeywords)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // In-place edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState<number>(20)
  const [editCategory, setEditCategory] = useState<string>('')

  // Compute category counts for filter chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: keywords.length }
    keywords.forEach((k) => {
      counts[k.category] = (counts[k.category] || 0) + 1
    })
    return counts
  }, [keywords])

  // Extract all unique categories present in current dataset
  const uniqueCategories = useMemo(() => {
    const set = new Set<string>()
    keywords.forEach((k) => set.add(k.category))
    return Array.from(set)
  }, [keywords])

  // Filtered list based on search and selected category chip
  const filteredKeywords = useMemo(() => {
    return keywords.filter((k) => {
      const matchesSearch =
        k.keyword.toLowerCase().includes(search.toLowerCase().trim()) ||
        k.category.toLowerCase().includes(search.toLowerCase().trim())
      const matchesCategory =
        selectedCategory === 'all' || k.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [keywords, search, selectedCategory])

  async function handleSaveEdit(id: string) {
    setError(null)
    setSuccess(null)
    setLoading(true)

    // Defensive clamping
    const clampedWeight = Math.min(40, Math.max(1, Math.round(Number(editWeight))))

    try {
      const res = await fetch(`/api/admin/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: clampedWeight,
          category: editCategory.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update keyword')
      } else {
        setKeywords((prev) =>
          prev.map((k) =>
            k.id === id ? { ...k, weight: clampedWeight, category: editCategory.trim() } : k
          )
        )
        setEditingId(null)
        setSuccess('Signature rule updated successfully.')
        setTimeout(() => setSuccess(null), 3500)
      }
    } catch {
      setError('Network error while updating keyword.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, keywordName: string) {
    if (!confirm(`Are you sure you want to delete signature rule "${keywordName}"?`)) return

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/keywords/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Failed to delete keyword')
      } else {
        setKeywords((prev) => prev.filter((k) => k.id !== id))
        setSuccess(`Signature "${keywordName}" successfully deleted from catalog.`)
        setTimeout(() => setSuccess(null), 3500)
      }
    } catch {
      setError('Network error while deleting keyword.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* 1. Top Tier: 4 Cyber Bento KPI Telemetry Cards */}
      <KeywordKpis keywords={keywords} />

      {/* 2. Middle Tier: Two-Column Operations Deck (Rule Forge + Live Sandbox) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 flex">
          <div className="w-full">
            <KeywordRuleForge
              existingKeywords={keywords}
              onKeywordAdded={(newK) => setKeywords((prev) => [newK, ...prev])}
            />
          </div>
        </div>
        <div className="lg:col-span-7 flex">
          <div className="w-full">
            <KeywordRuleSandbox keywords={keywords} />
          </div>
        </div>
      </div>

      {/* Notification Banners */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-mono flex items-center justify-between">
          <span>⚠ {error}</span>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center justify-between">
          <span>✓ {success}</span>
          <button onClick={() => setSuccess(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* 3. Bottom Tier: Full-Width Signature Matrix Catalog */}
      <div className="relative rounded-2xl bg-slate-900/60 border border-cyan-500/20 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.05)]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                <CyberShieldIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                SIGNATURE REPOSITORY CATALOG
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              {filteredKeywords.length} of {keywords.length} active rules matching active criteria
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72 relative">
            <CyberTerminalIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword or category..."
              className="w-full pl-9 pr-3.5 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/30 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-xs text-slate-500 hover:text-white font-mono"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Chips Bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
              selectedCategory === 'all'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <span>All Categories</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-400">
              {categoryCounts.all ?? 0}
            </span>
          </button>

          {uniqueCategories.map((cat) => {
            const isSelected = selectedCategory === cat
            const count = categoryCounts[cat] ?? 0
            const displayLabel = CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ?? cat.replace(/_/g, ' ')

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono capitalize whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 border ${
                  isSelected
                    ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{displayLabel}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-400">
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Catalog Data Grid */}
        {filteredKeywords.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800/80 rounded-2xl bg-slate-950/30">
            <CyberTerminalIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-mono text-slate-300">
              {search || selectedCategory !== 'all'
                ? 'No detection signatures match your filter query.'
                : 'No custom signatures stored in DB yet.'}
            </p>
            <p className="text-xs font-mono text-slate-500 mt-1">
              The rule engine currently operates on default baseline heuristics.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Trigger Phrase</th>
                  <th className="py-3 px-4">Threat Vector</th>
                  <th className="py-3 px-4">Heuristic Weight</th>
                  <th className="py-3 px-4">Added Date</th>
                  <th className="py-3 px-4 text-right">Engine Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredKeywords.map((item) => {
                  const isEditing = editingId === item.id
                  const weightPct = Math.round((item.weight / 40) * 100)

                  // Risk color progress bar
                  let weightColor = 'bg-cyan-500'
                  let weightText = 'text-cyan-400'
                  if (item.weight >= 26) {
                    weightColor = 'bg-rose-500'
                    weightText = 'text-rose-400'
                  } else if (item.weight >= 16) {
                    weightColor = 'bg-amber-500'
                    weightText = 'text-amber-400'
                  }

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-cyan-500/[0.03] transition group"
                    >
                      {/* Phrase */}
                      <td className="py-3.5 px-4 font-mono font-medium text-white">
                        <span className="px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-cyan-200">
                          {item.keyword}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="px-2.5 py-1 bg-slate-950 border border-cyan-500/40 rounded-lg text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                          />
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-slate-950/80 border border-slate-800 text-slate-300 capitalize">
                            {CATEGORY_LABELS[item.category as keyof typeof CATEGORY_LABELS] ?? item.category.replace(/_/g, ' ')}
                          </span>
                        )}
                      </td>

                      {/* Weight with progress visualizer */}
                      <td className="py-3.5 px-4">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={40}
                              value={editWeight}
                              onChange={(e) => setEditWeight(Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-950 border border-cyan-500/40 rounded-lg text-xs font-mono text-white focus:outline-none"
                            />
                            <span className="text-[11px] text-slate-500 font-mono">/ 40 pts</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 w-40">
                            <div className="flex-1 h-1.5 rounded-full bg-slate-800/80 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${weightColor} transition-all duration-300`}
                                style={{ width: `${weightPct}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold font-mono ${weightText}`}>
                              +{item.weight} pts
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Date Added */}
                      <td
                        suppressHydrationWarning
                        className="py-3.5 px-4 text-slate-400 text-xs font-mono whitespace-nowrap"
                      >
                        {new Date(item.created_at).toISOString().split('T')[0]}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={loading}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25 text-xs font-mono transition cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-mono transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingId(item.id)
                                setEditWeight(item.weight)
                                setEditCategory(item.category)
                              }}
                              className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/25 text-blue-400 hover:text-blue-300 text-xs font-mono transition cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.keyword)}
                              disabled={loading}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 hover:text-rose-300 transition cursor-pointer"
                              title="Delete signature"
                            >
                              <CyberTrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
