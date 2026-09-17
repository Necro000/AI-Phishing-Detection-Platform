'use client'

import { useState } from 'react'
import { KEYWORD_CATEGORIES, CATEGORY_LABELS } from '@/lib/ruleEngine/categories'

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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // New Keyword Form state
  const [newKeyword, setNewKeyword] = useState('')
  const [newWeight, setNewWeight] = useState(25)
  const [newCategory, setNewCategory] = useState<string>(KEYWORD_CATEGORIES[0])
  const [customCategory, setCustomCategory] = useState('')
  const [isCustomCategory, setIsCustomCategory] = useState(false)

  // Edit in-place state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editWeight, setEditWeight] = useState<number>(20)
  const [editCategory, setEditCategory] = useState<string>('')

  // Filtered list
  const filteredKeywords = keywords.filter(
    (k) =>
      k.keyword.toLowerCase().includes(search.toLowerCase()) ||
      k.category.toLowerCase().includes(search.toLowerCase())
  )

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const finalCategory = isCustomCategory ? customCategory.trim() : newCategory
    if (!finalCategory) {
      setError('Please provide a category')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/keywords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: newKeyword.trim().toLowerCase(),
          weight: Number(newWeight),
          category: finalCategory,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to add keyword')
      } else {
        setKeywords((prev) => [data.keyword, ...prev])
        setNewKeyword('')
        setNewWeight(25)
        setCustomCategory('')
        setIsCustomCategory(false)
        setSuccess(`Keyword "${data.keyword.keyword}" added successfully.`)
      }
    } catch {
      setError('Network error while adding keyword.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveEdit(id: string) {
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const res = await fetch(`/api/admin/keywords/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          weight: Number(editWeight),
          category: editCategory.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Failed to update keyword')
      } else {
        setKeywords((prev) =>
          prev.map((k) => (k.id === id ? { ...k, weight: editWeight, category: editCategory } : k))
        )
        setEditingId(null)
        setSuccess('Keyword updated successfully.')
      }
    } catch {
      setError('Network error while updating keyword.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string, keywordName: string) {
    if (!confirm(`Are you sure you want to delete "${keywordName}"?`)) return

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
        setSuccess(`Keyword "${keywordName}" deleted.`)
      }
    } catch {
      setError('Network error while deleting keyword.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          {success}
        </div>
      )}

      {/* Add Keyword Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-white mb-1">Add Detection Keyword</h2>
        <p className="text-xs text-slate-400 mb-4">
          Per Architecture.md §4: Weights are capped at 1–40 so no single keyword can unilaterally force a HIGH_RISK verdict.
        </p>

        <form onSubmit={handleAddKeyword} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-4">
            <label className="block text-xs font-medium text-slate-300 mb-1">Keyword / Phrase</label>
            <input
              type="text"
              required
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="e.g. urgent wire transfer"
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
            {!isCustomCategory ? (
              <select
                value={newCategory}
                onChange={(e) => {
                  if (e.target.value === '__custom__') {
                    setIsCustomCategory(true)
                  } else {
                    setNewCategory(e.target.value)
                  }
                }}
                className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {KEYWORD_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat] ?? cat}
                  </option>
                ))}
                <option value="__custom__">+ Custom Category...</option>
              </select>
            ) : (
              <div className="flex gap-1">
                <input
                  type="text"
                  required
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter category"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setIsCustomCategory(false)}
                  className="px-2 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          <div className="md:col-span-3">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-300">Weight (1–40)</label>
              <span className="text-xs font-semibold text-blue-400">{newWeight} pts</span>
            </div>
            <input
              type="range"
              min={1}
              max={40}
              value={newWeight}
              onChange={(e) => setNewWeight(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading || !newKeyword.trim()}
              className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition"
            >
              {loading ? 'Adding...' : 'Add Keyword'}
            </button>
          </div>
        </form>
      </div>

      {/* Keywords Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-white">Active Detection Keywords</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredKeywords.length} keywords configured (affects both URL & Email scanners in real time)
            </p>
          </div>
          <div className="w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword or category..."
              className="w-full px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {filteredKeywords.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-xl">
            <p className="text-sm text-slate-400">
              {search ? 'No keywords match your search.' : 'No custom keywords stored in DB yet (scanners use sane defaults).'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="py-3 px-3">Keyword</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Weight</th>
                  <th className="py-3 px-3">Added</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredKeywords.map((item) => {
                  const isEditing = editingId === item.id
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="py-3 px-3 font-mono text-xs text-white">
                        {item.keyword}
                      </td>

                      <td className="py-3 px-3">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCategory}
                            onChange={(e) => setEditCategory(e.target.value)}
                            className="px-2 py-1 bg-slate-900 border border-white/20 rounded text-xs text-white"
                          />
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded text-xs bg-white/5 border border-white/10 text-slate-300">
                            {item.category}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              max={40}
                              value={editWeight}
                              onChange={(e) => setEditWeight(Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-900 border border-white/20 rounded text-xs text-white"
                            />
                            <span className="text-xs text-slate-500">/40</span>
                          </div>
                        ) : (
                          <span className="font-semibold text-blue-400 text-xs">
                            +{item.weight} pts
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleSaveEdit(item.id)}
                              disabled={loading}
                              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-xs text-slate-400 hover:text-slate-300"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                setEditingId(item.id)
                                setEditWeight(item.weight)
                                setEditCategory(item.category)
                              }}
                              className="text-xs text-blue-400 hover:text-blue-300"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.keyword)}
                              disabled={loading}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Delete
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
