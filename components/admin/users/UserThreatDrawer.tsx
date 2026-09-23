'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import {
  CyberShieldIcon,
  CyberRadarIcon,
  CyberLinkIcon,
  CyberFileIcon,
  CyberLockIcon,
  CyberZapIcon,
  CyberUserIcon,
} from '@/components/icons/CyberIcons'

export interface UserScanSummary {
  id: string
  input: string
  scan_type: 'url' | 'email'
  risk_level: 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'
  risk_score: number
  created_at: string
}

export interface EnrichedUser {
  id: string
  email: string
  role: string
  created_at?: string
  scan_count: number
  safe_count: number
  suspicious_count: number
  high_risk_count: number
  recent_scans: UserScanSummary[]
}

interface Props {
  user: EnrichedUser | null
  onClose: () => void
}

export default function UserThreatDrawer({ user, onClose }: Props) {
  // Close drawer on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!user) return null

  const isRootAdmin = user.email.toLowerCase() === 'sohit@gmail.com'
  const totalScans = user.scan_count
  const threatScans = user.suspicious_count + user.high_risk_count
  const threatRate = totalScans === 0 ? 0 : Math.round((threatScans / totalScans) * 100)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`User Threat Profile for ${user.email}`}
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg h-full bg-slate-950/95 border-l border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.15)] flex flex-col overflow-hidden animate-slide-left font-mono"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                isRootAdmin
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.25)]'
                  : 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400'
              }`}
            >
              {isRootAdmin ? <CyberShieldIcon className="w-5 h-5" /> : <CyberUserIcon className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide truncate max-w-[260px]">
                  {user.email}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {isRootAdmin ? 'ROOT SYSTEM AUTHORITY' : 'STANDARD PLATFORM USER'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close drawer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Identity & Privilege Status Card */}
          <div
            className={`p-4 rounded-2xl border ${
              isRootAdmin
                ? 'bg-purple-500/5 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.1)]'
                : 'bg-slate-900/50 border-slate-800/80'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-wider text-slate-400">
                ACCESS PRIVILEGE TIER
              </span>
              {isRootAdmin ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  <CyberLockIcon className="w-3 h-3" />
                  ROOT ADMIN [SOLE AUTHORITY]
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                  STANDARD ANALYST [RESTRICTED]
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">User ID:</span>
                <span className="text-slate-300 font-mono text-[11px] select-all">{user.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Account Created:</span>
                <span suppressHydrationWarning className="text-slate-300 font-mono text-[11px]">
                  {user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Privilege Status:</span>
                <span className={isRootAdmin ? 'text-purple-400 font-semibold' : 'text-slate-400'}>
                  {isRootAdmin ? 'Immutable Administrator' : 'Normal User (No Admin Rights)'}
                </span>
              </div>
            </div>
          </div>

          {/* Threat Exposure Telemetry */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <CyberRadarIcon className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  THREAT EXPOSURE PROFILE
                </span>
              </div>
              <span className="text-[11px] font-mono text-cyan-400">
                {threatRate}% Threat Rate
              </span>
            </div>

            {/* 3 Metric Pills */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center">
                <span className="block text-[10px] uppercase text-emerald-400/80 font-medium">
                  Safe Scans
                </span>
                <span className="text-lg font-bold text-emerald-400 font-mono">
                  {user.safe_count}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-center">
                <span className="block text-[10px] uppercase text-amber-400/80 font-medium">
                  Suspicious
                </span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {user.suspicious_count}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/20 text-center">
                <span className="block text-[10px] uppercase text-rose-400/80 font-medium">
                  High Risk
                </span>
                <span className="text-lg font-bold text-rose-400 font-mono">
                  {user.high_risk_count}
                </span>
              </div>
            </div>

            {/* Visual Vector Distribution Bar */}
            {totalScans > 0 ? (
              <div className="h-2 rounded-full bg-slate-900 overflow-hidden flex">
                <div
                  style={{ width: `${(user.safe_count / totalScans) * 100}%` }}
                  className="h-full bg-emerald-500 transition-all"
                  title={`Safe: ${user.safe_count}`}
                />
                <div
                  style={{ width: `${(user.suspicious_count / totalScans) * 100}%` }}
                  className="h-full bg-amber-500 transition-all"
                  title={`Suspicious: ${user.suspicious_count}`}
                />
                <div
                  style={{ width: `${(user.high_risk_count / totalScans) * 100}%` }}
                  className="h-full bg-rose-500 transition-all"
                  title={`High Risk: ${user.high_risk_count}`}
                />
              </div>
            ) : (
              <div className="h-2 rounded-full bg-slate-800 text-center text-[9px] text-slate-500">
                No telemetry recorded
              </div>
            )}
          </div>

          {/* Recent Scans Activity Log */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white tracking-wide">
                RECENT SCAN ACTIVITY ({user.recent_scans.length})
              </span>
              <span className="text-[10px] text-slate-500 font-mono">LAST 5 SCANS</span>
            </div>

            {user.recent_scans.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-slate-800 text-center">
                <p className="text-xs text-slate-500 font-mono">
                  No scans have been submitted by this user yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {user.recent_scans.map((scan) => {
                  let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  if (scan.risk_level === 'HIGH_RISK') {
                    badgeColor = 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  } else if (scan.risk_level === 'SUSPICIOUS') {
                    badgeColor = 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  }

                  return (
                    <div
                      key={scan.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {scan.scan_type === 'url' ? (
                            <CyberLinkIcon className="w-3.5 h-3.5 text-cyan-400" />
                          ) : (
                            <CyberFileIcon className="w-3.5 h-3.5 text-purple-400" />
                          )}
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {scan.scan_type} SCAN
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-slate-300 font-mono">
                            {scan.risk_score}/100
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${badgeColor}`}>
                            {scan.risk_level}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs font-mono text-slate-200 truncate select-all">
                        {scan.input}
                      </p>

                      <span suppressHydrationWarning className="text-[10px] text-slate-500 font-mono">
                        {new Date(scan.created_at).toISOString().replace('T', ' ').slice(0, 16)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Drill-Down Link */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
          <Link
            href={`/admin/scans?q=${encodeURIComponent(user.email)}`}
            className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold text-center transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <span>VIEW ALL SCANS IN SOC AUDIT LOG</span>
            <CyberRadarIcon className="w-4 h-4 text-cyan-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}
