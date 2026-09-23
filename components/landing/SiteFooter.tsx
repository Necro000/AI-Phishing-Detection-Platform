import React from 'react'
import Link from 'next/link'
import { CyberShieldIcon } from '@/components/icons/CyberIcons'

const CURRENT_YEAR = new Date().getFullYear()

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950/80 backdrop-blur-xl mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column (Spans 2 on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shadow-sm">
                <CyberShieldIcon size={18} glow />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white tracking-tight">AI Defense</span>
                <span className="text-[10px] font-mono text-cyan-400/80">Phishing Platform</span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-sm">
              Next-generation hybrid phishing mitigation platform combining lexical heuristics, Google Safe Browsing, VirusTotal engines, and machine learning inference.
            </p>

            {/* Live Operational Status Badge */}
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-mono text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>All Detection Systems Operational</span>
              </div>
            </div>
          </div>

          {/* Column 1: Scanners */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Scanners
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/scan/url" className="hover:text-white transition-colors">
                  URL Quad-Engine
                </Link>
              </li>
              <li>
                <Link href="/scan/email" className="hover:text-white transition-colors">
                  Email Forensics (.eml)
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  Personal Scan Feed
                </Link>
              </li>
              <li>
                <Link href="/admin/scans" className="hover:text-purple-300 transition-colors">
                  Admin SOC Console
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Detection Signals */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Signals
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="text-slate-300">Lexical Heuristics Engine</li>
              <li className="text-slate-300">Google Safe Browsing v4</li>
              <li className="text-slate-300">VirusTotal 89+ Scanners</li>
              <li className="text-slate-300">PhiUSIIL ML Model (91%)</li>
            </ul>
          </div>

          {/* Column 3: Security & Trust */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="text-slate-300">Supabase Row-Level Security</li>
              <li className="text-slate-300">Deterministic Score Capping</li>
              <li className="text-slate-300">Zero Raw Password Retention</li>
              <li className="text-slate-300">Audit-Ready Forensics</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono">
          <p>© {CURRENT_YEAR} AI Phishing Detection Platform. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Innovexis Internship Project</span>
            <span>·</span>
            <span className="text-slate-300">Built with Next.js & Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
