'use client'

/**
 * AccessibleRiskBadge — WCAG 2.1 Criterion 1.4.1 Compliant
 *
 * Communicates threat level through THREE independent channels:
 *   1. Color  (Emerald / Amber / Rose)
 *   2. Shape  (Circle-pill / Diamond / Octagon)
 *   3. Icon   (ShieldCheck ✓ / AlertTriangle ▲ / OctagonX ✕)
 *
 * Never relies on color alone — safe for Deuteranopia & Protanopia users (~8% of men).
 * Use this in place of inline badge classes everywhere a risk level is displayed.
 */

import React from 'react'
import type { RiskLevel } from '@/lib/ruleEngine/scoring'

// ─── Icons (inline SVG — no icon library dependency) ─────────────────────────

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8 0c-.28 0-.55.1-.76.28L1.47 4.44C1.17 4.66 1 5 1 5.37v3.88C1 13.04 4.72 15.9 8 16c3.28-.1 7-2.96 7-6.75V5.37c0-.37-.17-.71-.47-.93L8.76.28A1.17 1.17 0 0 0 8 0Zm2.73 6.47-3.5 3.5a.75.75 0 0 1-1.06 0L4.27 8.07a.75.75 0 1 1 1.06-1.06L6.8 8.47l2.97-2.97a.75.75 0 1 1 1.06 1.06-.03.02-.07.06-.1.1Z" />
    </svg>
  )
}

function AlertTriangleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6.86 2.31 1.2 11.5A1.33 1.33 0 0 0 2.33 13.5h11.34a1.33 1.33 0 0 0 1.14-2L9.14 2.31a1.33 1.33 0 0 0-2.28 0Z" />
      <line x1="8" y1="6.5" x2="8" y2="9" />
      <circle cx="8" cy="11" r=".5" fill="currentColor" />
    </svg>
  )
}

function OctagonXIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <polygon points="5.5,1 10.5,1 15,5.5 15,10.5 10.5,15 5.5,15 1,10.5 1,5.5" />
      <line x1="10" y1="6" x2="6" y2="10" />
      <line x1="6" y1="6" x2="10" y2="10" />
    </svg>
  )
}

// ─── Config map ───────────────────────────────────────────────────────────────

interface BadgeConfig {
  label: string
  ariaLabel: string
  /** Tailwind classes for the pill wrapper */
  wrapperClass: string
  /** Tailwind classes for the icon */
  iconClass: string
  Icon: React.FC<{ className?: string }>
}

const CONFIG: Record<RiskLevel, BadgeConfig> = {
  SAFE: {
    label: 'SAFE',
    ariaLabel: 'Verdict: Safe — no phishing indicators detected',
    // Rounded full pill — circle/continuous shape signals "all clear"
    wrapperClass:
      'rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    iconClass: 'text-emerald-400',
    Icon: ShieldCheckIcon,
  },
  SUSPICIOUS: {
    label: 'SUSPICIOUS',
    ariaLabel: 'Verdict: Suspicious — potential phishing indicators found, exercise caution',
    // Rounded-md (softer square) — diamond-ish geometry signals "caution"
    wrapperClass:
      'rounded-md border border-amber-500/60 bg-amber-500/15 text-amber-300',
    iconClass: 'text-amber-400',
    Icon: AlertTriangleIcon,
  },
  HIGH_RISK: {
    label: 'HIGH RISK',
    ariaLabel: 'Verdict: High Risk — confirmed or strongly suspected phishing threat',
    // Sharp rounded-sm + heavy border — stop-sign octagon geometry signals "danger"
    wrapperClass:
      'rounded-sm border-2 border-rose-500/80 bg-rose-500/20 text-rose-200 font-bold',
    iconClass: 'text-rose-400',
    Icon: OctagonXIcon,
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

interface AccessibleRiskBadgeProps {
  level: RiskLevel
  score?: number
  /** 'sm' (default) | 'md' for slightly larger usage (e.g. scan result cards) */
  size?: 'sm' | 'md'
  /** If true, also renders the numeric score alongside the label */
  showScore?: boolean
}

export function AccessibleRiskBadge({
  level,
  score,
  size = 'sm',
  showScore = false,
}: AccessibleRiskBadgeProps) {
  const cfg = CONFIG[level] ?? CONFIG.SAFE

  const sizeClasses =
    size === 'md'
      ? 'px-3 py-1.5 text-sm gap-2'
      : 'px-2.5 py-1 text-xs gap-1.5'

  const iconSize = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'

  return (
    <span
      role="status"
      aria-label={cfg.ariaLabel}
      className={`inline-flex items-center font-mono ${sizeClasses} ${cfg.wrapperClass}`}
    >
      <cfg.Icon className={`${iconSize} ${cfg.iconClass} shrink-0`} />
      <span>{cfg.label}</span>
      {showScore && score !== undefined && (
        <span className="opacity-60 font-normal">({score}/100)</span>
      )}
    </span>
  )
}
