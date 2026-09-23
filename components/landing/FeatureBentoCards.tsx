import React from 'react'
import Link from 'next/link'
import {
  CyberLinkIcon,
  CyberFileIcon,
  CyberCpuIcon,
  CyberShieldIcon,
} from '@/components/icons/CyberIcons'

export function FeatureBentoCards() {
  return (
    <section className="px-4 py-16 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-mono text-blue-300 mb-4">
          <span>⚡ Multi-Engine Forensic Architecture</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
          Enterprise Protection Built for Modern Threats
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-3 leading-relaxed">
          Four independent security signals evaluate each target in parallel, guaranteeing both zero false confidence and fast response times.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: URL Scanner (Spans 2 cols on large screens) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-blue-500/40 transition-all duration-300">
          <div className="relative z-10">
            {/* Visual Top Half Mockup */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 sm:p-5 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] text-slate-400 ml-2">Target Inspector</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[10px] font-bold">
                  HIGH_RISK · 88/100
                </span>
              </div>

              <div className="bg-slate-900/90 rounded-lg p-2.5 border border-white/5 text-slate-300 text-[11px] truncate flex items-center justify-between mb-4">
                <span className="text-rose-400 font-semibold truncate">
                  https://paypa1-security-verification.com/login/auth
                </span>
                <span className="text-[10px] text-slate-400 ml-2 shrink-0">2.1s</span>
              </div>

              {/* Live Signal Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400">Rules Engine</div>
                  <div className="text-amber-400 font-bold mt-0.5">+35 Pts</div>
                  <div className="text-[9px] text-slate-400">Typosquatting match</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400">Safe Browsing</div>
                  <div className="text-rose-400 font-bold mt-0.5">Flagged</div>
                  <div className="text-[9px] text-slate-400">Social Engineering</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400">VirusTotal</div>
                  <div className="text-rose-400 font-bold mt-0.5">14/89</div>
                  <div className="text-[9px] text-slate-400">Vendors Malicious</div>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-slate-400">PhiUSIIL ML</div>
                  <div className="text-purple-400 font-bold mt-0.5">94.8%</div>
                  <div className="text-[9px] text-slate-400">+25 Pt Score Cap</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <CyberLinkIcon size={20} glow />
              </div>
              <h3 className="text-xl font-bold text-white">Quad-Engine URL Scanner</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Simultaneously queries lexical heuristic rules, Google Safe Browsing v4, VirusTotal 89+ vendor scans, and trained ML probability into a weighted, zero-guesswork risk score.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <Link
              href="/scan/url"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Launch Live URL Scanner</span>
              <span>→</span>
            </Link>
            <span className="text-[11px] font-mono text-slate-400">Latency: ~2.4s</span>
          </div>

          {/* Ambient Glow */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-72 h-72 bg-blue-500/10 blur-3xl pointer-events-none rounded-full"
          />
        </div>

        {/* Card 2: Email Scanner */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-emerald-500/40 transition-all duration-300">
          <div className="relative z-10">
            {/* Visual Top Half Mockup */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl font-mono text-xs">
              <div className="text-[10px] text-slate-400 border-b border-white/10 pb-2 mb-2 flex justify-between">
                <span>Email Parser: .EML / .TXT</span>
                <span className="text-emerald-400">Zero API Quota</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="text-slate-400">
                  From:{' '}
                  <span className="text-rose-300 bg-rose-500/15 px-1 rounded">
                    support@acc-update-security.xyz
                  </span>
                </div>
                <div className="text-slate-300 truncate">
                  Subject:{' '}
                  <span className="text-amber-300">
                    URGENT: Verify your account within 24h
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-1 text-[9px]">
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Urgency: High
                </span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Mismatched DKIM
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CyberFileIcon size={20} glow />
              </div>
              <h3 className="text-xl font-bold text-white">Heuristic Email Forensics</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Drop raw email files or pasted text. Analyzes urgency triggers, credential harvesting traps, and suspicious embedded redirects with zero API token consumption.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <Link
              href="/scan/email"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Scan Email Content</span>
              <span>→</span>
            </Link>
            <span className="text-[11px] font-mono text-slate-400">Local Parsing</span>
          </div>

          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl pointer-events-none rounded-full"
          />
        </div>

        {/* Card 3: Machine Learning Model */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-purple-500/40 transition-all duration-300">
          <div className="relative z-10">
            {/* Visual Top Half Mockup */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl font-mono text-xs">
              <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-white/10 pb-2 mb-3">
                <span>Model Calibration</span>
                <span className="text-purple-400">PhiUSIIL 235k</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-300">Validation Accuracy</span>
                  <span className="text-emerald-400 font-bold">91.06%</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-full w-[91%]" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                  <span>False-Positive Cap:</span>
                  <span className="text-blue-300 font-bold">Max +25 pts</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <CyberCpuIcon size={20} glow />
              </div>
              <h3 className="text-xl font-bold text-white">Trained ML Inference</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Logistic regression trained on over 235,000 real-world benign and hostile URLs. Tuned to output confidence without overriding deterministic evidence.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-400">Pre-trained Weights</span>
            <span className="text-[11px] font-mono text-slate-400">0.05s Infer</span>
          </div>

          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl pointer-events-none rounded-full"
          />
        </div>

        {/* Card 4: SOC Command Center (Spans 2 cols on lg) */}
        <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden relative group hover:border-cyan-500/40 transition-all duration-300">
          <div className="relative z-10">
            {/* Visual Top Half Mockup */}
            <div className="mb-6 rounded-2xl border border-white/10 bg-slate-950/80 p-4 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span>SOC Real-Time Threat Feed</span>
                </span>
                <span className="text-cyan-300">Admin RBAC Protected</span>
              </div>

              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-md">
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                      HIGH_RISK
                    </span>
                    <span className="text-slate-300 truncate">https://metamask-claim-airdrop.top</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">94 / 100</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2 truncate max-w-[280px] sm:max-w-md">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      SAFE
                    </span>
                    <span className="text-slate-300 truncate">https://github.com/google/security</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">0 / 100</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <CyberShieldIcon size={20} glow />
              </div>
              <h3 className="text-xl font-bold text-white">SOC Command Center & Forensic Drawer</h3>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
              Audit all scans across users with live KPI metrics, instant keyword management, slide-over deep forensic JSON inspection, and one-click CSV export.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
            <Link
              href="/admin/scans"
              className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <span>Explore Admin SOC Scans</span>
              <span>→</span>
            </Link>
            <span className="text-[11px] font-mono text-slate-400">CSV Export Ready</span>
          </div>

          <div
            aria-hidden="true"
            className="absolute top-0 right-0 w-72 h-72 bg-cyan-500/10 blur-3xl pointer-events-none rounded-full"
          />
        </div>
      </div>
    </section>
  )
}
