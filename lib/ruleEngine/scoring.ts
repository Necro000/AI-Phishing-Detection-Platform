/**
 * scoring.ts — single source of truth for combining all 4 signals
 *
 * Architecture.md §5 (frozen — do not change without human sign-off):
 *  - signals.rules: raw rule-engine contribution, pre-ML, pre-override
 *  - Safe Browsing flagged → risk_score = 95, HIGH_RISK (overrides everything)
 *  - VirusTotal >= 3 malicious → risk_score = 90, HIGH_RISK (overrides everything)
 *  - ML signal (URL only): infer.ts probability * 25 max, added to rule score
 *  - Score bands: 0–29 = SAFE, 30–69 = SUSPICIOUS, 70–100 = HIGH_RISK
 *  - risk_level: only 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK' (Brain.md rule 3)
 */

import type { RuleHit } from './urlRules'
import type { SafeBrowsingResult } from '../safeBrowsing'
import type { VirusTotalResult } from '../virusTotal'
import type { InferResult } from '../ml/infer'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'HIGH_RISK'

export interface Signals {
  /** Raw rule-engine contribution — pre-ML, pre-override (Architecture.md §5) */
  rules: number
  /** true = SB flagged, false = clean, null = not checked (email scans) or degraded */
  safeBrowsing: boolean | null
  /** true = VT flagged (>=3 vendors), false = clean/unseen, null = not checked or degraded */
  virusTotal: boolean | null
  /** ML phishing probability 0–1, or null if not applicable / inference failed */
  ml: number | null
}

export interface ScanResult {
  risk_level: RiskLevel
  risk_score: number
  reasons: string[]
  signals: Signals
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ML_MAX_CONTRIBUTION = 25  // Architecture.md §5 — do NOT raise without re-validating model

function scoreToLevel(score: number): RiskLevel {
  if (score <= 29) return 'SAFE'
  if (score <= 69) return 'SUSPICIOUS'
  return 'HIGH_RISK'
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ─────────────────────────────────────────────────────────────────────────────
// URL scan scoring — combines all 4 signals
// ─────────────────────────────────────────────────────────────────────────────

export interface UrlScoringInput {
  ruleHits: RuleHit[]
  ruleScore: number
  safeBrowsing: SafeBrowsingResult
  virusTotal: VirusTotalResult
  mlResult: InferResult
  isPrivate: boolean
}

export function scoreUrl(input: UrlScoringInput): ScanResult {
  const { ruleHits, ruleScore, safeBrowsing, virusTotal, mlResult, isPrivate } = input

  const reasons: string[] = ruleHits.map(h => h.reason)
  const signals: Signals = {
    rules: ruleScore,             // raw rule contribution, pre-ML, pre-override
    safeBrowsing: null,
    virusTotal: null,
    ml: mlResult.ml,
  }

  // ── Safe Browsing signal ─────────────────────────────────────────────────
  if (safeBrowsing.degraded) {
    signals.safeBrowsing = null
    reasons.push('Google Safe Browsing check unavailable (service degraded or quota exhausted)')
  } else {
    signals.safeBrowsing = safeBrowsing.flagged
    if (safeBrowsing.flagged) {
      reasons.push(
        `Flagged by Google Safe Browsing${safeBrowsing.threatType ? ` as ${safeBrowsing.threatType}` : ''}`
      )
    }
  }

  // ── VirusTotal signal ────────────────────────────────────────────────────
  if (virusTotal.degraded) {
    signals.virusTotal = null
    reasons.push('VirusTotal check unavailable (service degraded, rate limited, or quota exhausted)')
  } else if (virusTotal.unseen) {
    signals.virusTotal = false
    // Edge-Cases.md: surface in reasons[], don't imply it's clean
    reasons.push('Not yet indexed by VirusTotal — no verdict available for this URL')
  } else {
    signals.virusTotal = virusTotal.flagged
    if (virusTotal.flagged) {
      reasons.push(
        `Flagged by VirusTotal (${virusTotal.maliciousCount ?? '≥3'} security vendors reported malicious)`
      )
    }
  }

  // ── Private/loopback IP note ─────────────────────────────────────────────
  if (isPrivate) {
    reasons.push('URL targets a private or loopback IP address — external API checks skipped')
  }

  // ── ML signal ───────────────────────────────────────────────────────────
  let mlContribution = 0
  if (mlResult.ml !== null && !mlResult.degraded) {
    // Contribution: up to ML_MAX_CONTRIBUTION points (Architecture.md §5)
    mlContribution = clamp(Math.round(mlResult.ml * ML_MAX_CONTRIBUTION), 0, ML_MAX_CONTRIBUTION)
    if (mlContribution >= 10) {
      reasons.push(
        `ML model signals elevated phishing probability (${Math.round(mlResult.ml * 100)}%)`
      )
    }
  } else if (mlResult.degraded) {
    reasons.push('ML signal unavailable (weights not loaded or feature extraction failed)')
  }

  // ── Override logic (Architecture.md §5) — after all reasons collected ────

  // Safe Browsing override — highest priority
  if (safeBrowsing.flagged && !safeBrowsing.degraded) {
    return {
      risk_level: 'HIGH_RISK',
      risk_score: 95,
      reasons,
      signals,
    }
  }

  // VirusTotal override
  if (virusTotal.flagged && !virusTotal.degraded) {
    return {
      risk_level: 'HIGH_RISK',
      risk_score: 90,
      reasons,
      signals,
    }
  }

  // ── Combined score: rule base + ML contribution ──────────────────────────
  const combinedScore = clamp(ruleScore + mlContribution, 0, 100)

  return {
    risk_level: scoreToLevel(combinedScore),
    risk_score: combinedScore,
    reasons,
    signals,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Email scan scoring — rules only (no Safe Browsing, VT, or ML per Architecture.md §5)
// ─────────────────────────────────────────────────────────────────────────────

export interface EmailScoringInput {
  ruleHits: RuleHit[]
  ruleScore: number
}

export function scoreEmail(input: EmailScoringInput): ScanResult {
  const { ruleHits, ruleScore } = input

  const reasons = ruleHits.map(h => h.reason)
  const signals: Signals = {
    rules: ruleScore,
    safeBrowsing: null,   // not applicable for email (Architecture.md §5)
    virusTotal: null,     // not applicable for email
    ml: null,             // features.ts is URL-shaped, no ML on email content
  }

  return {
    risk_level: scoreToLevel(clamp(ruleScore, 0, 100)),
    risk_score: clamp(ruleScore, 0, 100),
    reasons,
    signals,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined degradation check — Edge-Cases.md: both APIs degraded at once
// ─────────────────────────────────────────────────────────────────────────────

export function isBothApisDegraded(
  safeBrowsing: SafeBrowsingResult,
  virusTotal: VirusTotalResult
): boolean {
  return safeBrowsing.degraded && virusTotal.degraded
}
