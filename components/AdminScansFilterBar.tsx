'use client'

/**
 * AdminScansFilterBar — Client Component
 *
 * Renders the multi-dimensional search & filter bar for the admin scans page.
 * Synchronizes with URL search parameters for server-side filtering.
 * High-tech cyber styling matching the CrowdStrike / SentinelOne mockup.
 */

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect, useRef } from 'react'
import { CyberTerminalIcon, CyberLinkIcon, CyberFileIcon, CyberWarningIcon } from '@/components/icons/CyberIcons'

interface ScanRowExport {
  id: string
  user_email: string
  scan_type: string
  input: string
  risk_level: string
  risk_score: number
  created_at: string
}

interface Props {
  /** Current active filter values (from server searchParams) */
  currentQ: string
  currentVerdict: string
  currentType: string
  /** All scans matching current filter (for CSV export) */
  exportRows: ScanRowExport[]
}

/**
 * Sanitizes a cell value to prevent CSV Formula Injection (CWE-1236).
 * Prepends a single quote if the value starts with formula trigger characters (=, +, -, @, tab, CR).
 */
function sanitizeCsvCell(v: unknown): string {
  const str = String(v ?? '')
  if (/^[=+@\-\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`
  }
  return `"${str.replace(/"/g, '""')}"`
}

function downloadCSV(rows: ScanRowExport[]) {
  const headers = ['ID', 'User Email', 'Scan Type', 'Input', 'Risk Level', 'Risk Score', 'Timestamp']
  const lines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        sanitizeCsvCell(r.id),
        sanitizeCsvCell(r.user_email),
        sanitizeCsvCell(r.scan_type),
        sanitizeCsvCell(r.input),
        sanitizeCsvCell(r.risk_level),
        sanitizeCsvCell(r.risk_score),
        sanitizeCsvCell(new Date(r.created_at).toISOString()),
      ].join(',')
    ),
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `threat-report-${new Date().toISOString().slice(0, 10)}.csv`
  anchor.click()
  URL.revokeObjectURL(url)
}

export default function AdminScansFilterBar({
  currentQ,
  currentVerdict,
  currentType,
  exportRows,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(currentQ)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Synchronize when URL search parameters change externally (e.g. back navigation or "Clear All Filters")
  useEffect(() => {
    setSearchValue(currentQ)
  }, [currentQ])

  // Cleanup pending timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Reset to page 1 on filter change
      params.delete('page')
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [router, pathname, searchParams]
  )

  const handleSearchChange = (val: string) => {
    setSearchValue(val)
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = setTimeout(() => {
      updateParam('q', val.trim())
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      updateParam('q', searchValue.trim())
    }
  }

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-4 mb-6"
      role="search"
      aria-label="Filter scans"
    >
      {/* Search Input Bar */}
      <div className="relative flex-1 min-w-[260px] max-w-md">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" aria-hidden="true">
          <CyberTerminalIcon size={16} />
        </span>
        <input
          id="admin-scan-search"
          type="search"
          aria-label="Search hashes, URLs, user emails"
          placeholder="Search hashes, URLs, user accounts…"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950/80 border border-white/10 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 transition-all font-sans"
        />
        {isPending && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
            <svg className="animate-spin h-3.5 w-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        )}
      </div>

      {/* Cyber Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick Verdict Chips */}
        <div className="inline-flex p-1 rounded-full bg-slate-950/80 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => updateParam('verdict', '')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentVerdict === ''
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => updateParam('verdict', 'HIGH_RISK')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentVerdict === 'HIGH_RISK'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-sm shadow-rose-500/10'
                : 'text-rose-400/80 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span>High Risk</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam('verdict', 'SUSPICIOUS')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentVerdict === 'SUSPICIOUS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-sm shadow-amber-500/10'
                : 'text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Suspicious</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam('verdict', 'SAFE')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              currentVerdict === 'SAFE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                : 'text-emerald-400/80 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Safe</span>
          </button>
        </div>

        {/* Vector Split Filter */}
        <div className="inline-flex p-1 rounded-full bg-slate-950/80 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => updateParam('type', '')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              currentType === ''
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Any
          </button>
          <button
            type="button"
            onClick={() => updateParam('type', 'url')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentType === 'url'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <CyberLinkIcon size={12} />
            <span>URL</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam('type', 'email')}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
              currentType === 'email'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-purple-300'
            }`}
          >
            <CyberFileIcon size={12} />
            <span>Email</span>
          </button>
        </div>

        {/* CSV Export Button */}
        <button
          id="admin-export-csv"
          type="button"
          aria-label="Export current filtered scans as CSV"
          onClick={() => downloadCSV(exportRows)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 text-xs font-medium text-cyan-300 transition-all active:scale-95 shadow-sm shadow-cyan-500/10 cursor-pointer"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  )
}
