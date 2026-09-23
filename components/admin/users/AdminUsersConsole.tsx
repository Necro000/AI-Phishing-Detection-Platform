'use client'

import React, { useState, useMemo } from 'react'
import UserThreatDrawer, { EnrichedUser } from './UserThreatDrawer'
import {
  CyberTerminalIcon,
  CyberShieldIcon,
  CyberRadarIcon,
  CyberLockIcon,
  CyberUserIcon,
} from '@/components/icons/CyberIcons'

interface Props {
  initialUsers: EnrichedUser[]
}

export default function AdminUsersConsole({ initialUsers }: Props) {
  const [users] = useState<EnrichedUser[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all')
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null)

  // Total summary telemetry
  const totalUsers = users.length
  const adminUsers = users.filter((u) => u.role === 'admin')
  const standardUsers = users.filter((u) => u.role === 'user')
  const totalScans = users.reduce((acc, u) => acc + u.scan_count, 0)
  const totalThreats = users.reduce((acc, u) => acc + (u.suspicious_count + u.high_risk_count), 0)
  const threatPct = totalScans === 0 ? 0 : Math.round((totalThreats / totalScans) * 100)

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase().trim()
      const matchesSearch =
        u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q)
      const matchesRole =
        roleFilter === 'all' ? true : u.role === roleFilter
      return matchesSearch && matchesRole
    })
  }, [users, search, roleFilter])

  return (
    <div className="space-y-6">
      {/* ── Top Threat Telemetry Status Bar ───────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Registered Identities */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-cyan-400/80">
              REGISTERED IDENTITIES
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
              <CyberUserIcon className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalUsers}</span>
            <span className="text-xs text-slate-400 font-mono">accounts</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500">
            Across active Supabase Auth pool
          </div>
        </div>

        {/* Card 2: Root Admin Lock */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-purple-500/30 backdrop-blur-2xl shadow-[0_0_20px_rgba(168,85,247,0.1)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-purple-400">
              ROOT AUTHORITY
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <CyberLockIcon className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-sm font-bold font-mono text-white truncate max-w-[170px]" title="sohit@gmail.com">
              sohit@gmail.com
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>EXCLUSIVE ADMIN LOCKED</span>
          </div>
        </div>

        {/* Card 3: Cumulative User Scans */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-blue-500/20 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-blue-400/80">
              TOTAL USER SCANS
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/25">
              <CyberRadarIcon className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{totalScans}</span>
            <span className="text-xs text-slate-400 font-mono">interceptions</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500">
            URL &amp; Email scans aggregated
          </div>
        </div>

        {/* Card 4: Threat Discovery Ratio */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-cyan-500/20 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-cyan-400/80">
              USER THREAT RATIO
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
              <CyberShieldIcon className="w-4 h-4 text-cyan-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{threatPct}%</span>
            <span className="text-xs text-slate-400 font-mono">{totalThreats} threats</span>
          </div>
          <div className="mt-2 text-[10px] font-mono text-slate-500">
            Flagged Suspicious or High Risk
          </div>
        </div>
      </div>

      {/* ── User Directory Table Card ─────────────────────────────────────── */}
      <div className="relative rounded-2xl bg-slate-900/60 border border-cyan-500/20 p-6 backdrop-blur-2xl shadow-[0_0_30px_rgba(6,182,212,0.05)]">
        {/* Header with Search and Role Filter Chips */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25">
                <CyberUserIcon className="w-4 h-4 text-cyan-400" />
              </div>
              <h2 className="text-base font-bold text-white font-mono tracking-wide">
                ZERO TRUST USER ROSTER
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Select any identity row to inspect security exposure, recent queries, and scan timelines
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-72 relative">
            <CyberTerminalIcon className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or ID..."
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

        {/* Filter Chips Bar */}
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 border ${
              roleFilter === 'all'
                ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>All Identities</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-400">
              {totalUsers}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 border ${
              roleFilter === 'admin'
                ? 'bg-purple-500/15 border-purple-500/50 text-purple-300 font-bold shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CyberLockIcon className="w-3 h-3 text-purple-400" />
            <span>Root Admin</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-purple-400 font-bold">
              {adminUsers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('user')}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono transition cursor-pointer flex items-center gap-1.5 border ${
              roleFilter === 'user'
                ? 'bg-blue-500/15 border-blue-500/50 text-blue-300 font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <span>Standard Users</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-400">
              {standardUsers.length}
            </span>
          </button>
        </div>

        {/* Directory Table */}
        {filteredUsers.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl bg-slate-950/30">
            <CyberTerminalIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-mono text-slate-300">
              No registered identities match your query.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-[11px] font-mono uppercase tracking-wider text-slate-400 border-b border-slate-800/80 bg-slate-950/40">
                <tr>
                  <th className="py-3 px-4">Identity / Email</th>
                  <th className="py-3 px-4">Access Privilege</th>
                  <th className="py-3 px-4">Threat Activity Vector</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Investigation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                {filteredUsers.map((u) => {
                  const isRootAdmin = u.email.toLowerCase() === 'sohit@gmail.com'
                  const total = u.scan_count

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="hover:bg-cyan-500/[0.04] transition cursor-pointer group"
                    >
                      {/* Identity */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center border font-bold text-xs ${
                              isRootAdmin
                                ? 'bg-purple-500/10 border-purple-500/40 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
                                : 'bg-slate-800 border-slate-700 text-slate-300'
                            }`}
                          >
                            {u.email.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-white block group-hover:text-cyan-300 transition">
                              {u.email}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">
                              ID: {u.id.slice(0, 8)}…{u.id.slice(-4)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Access Privilege Badge */}
                      <td className="py-3.5 px-4">
                        {isRootAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                            <CyberLockIcon className="w-3 h-3 text-purple-400" />
                            ROOT ADMIN [EXCLUSIVE]
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] bg-slate-950/80 border border-slate-800 text-slate-400">
                            STANDARD USER
                          </span>
                        )}
                      </td>

                      {/* Threat Activity Vector */}
                      <td className="py-3.5 px-4">
                        {total === 0 ? (
                          <span className="text-[11px] text-slate-500 font-mono">0 scans</span>
                        ) : (
                          <div className="flex items-center gap-3 w-48">
                            <div className="flex-1 h-2 rounded-full bg-slate-800/80 overflow-hidden flex">
                              <div
                                style={{ width: `${(u.safe_count / total) * 100}%` }}
                                className="h-full bg-emerald-500"
                                title={`Safe: ${u.safe_count}`}
                              />
                              <div
                                style={{ width: `${(u.suspicious_count / total) * 100}%` }}
                                className="h-full bg-amber-500"
                                title={`Suspicious: ${u.suspicious_count}`}
                              />
                              <div
                                style={{ width: `${(u.high_risk_count / total) * 100}%` }}
                                className="h-full bg-rose-500"
                                title={`High Risk: ${u.high_risk_count}`}
                              />
                            </div>
                            <span className="text-xs font-bold text-cyan-400 font-mono">
                              {total} scans
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Date */}
                      <td
                        suppressHydrationWarning
                        className="py-3.5 px-4 text-slate-400 text-xs font-mono whitespace-nowrap"
                      >
                        {u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : '—'}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedUser(u)
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/25 hover:border-cyan-500/40 text-cyan-300 text-xs font-mono transition flex items-center gap-1.5 ml-auto cursor-pointer"
                        >
                          <CyberRadarIcon className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out User Threat Drawer */}
      <UserThreatDrawer
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  )
}
