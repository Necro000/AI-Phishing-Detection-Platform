/**
 * defaultKeywords.ts — Sane default keywords fallback
 *
 * Architecture.md §4, §5 & Day 3 Track B:
 * - Used when the `keywords` table is empty or unreachable.
 * - Weights are capped at 1–40 (Architecture.md §4: a single keyword match can push into
 *   SUSPICIOUS [30–69] but can never unilaterally force HIGH_RISK [70–100]).
 * - Categories align with suggested categories in `categories.ts`.
 */

import type { DbKeyword } from './urlRules'

export const DEFAULT_KEYWORDS: DbKeyword[] = [
  // Urgency
  { keyword: 'urgent', weight: 25, category: 'urgency' },
  { keyword: 'immediate action', weight: 30, category: 'urgency' },
  { keyword: 'account suspended', weight: 35, category: 'urgency' },
  { keyword: 'within 24 hours', weight: 25, category: 'urgency' },
  { keyword: 'act now', weight: 20, category: 'urgency' },
  { keyword: 'unauthorized access', weight: 30, category: 'urgency' },

  // Credential request
  { keyword: 'verify your account', weight: 35, category: 'credential_request' },
  { keyword: 'confirm your password', weight: 40, category: 'credential_request' },
  { keyword: 'reset your password', weight: 25, category: 'credential_request' },
  { keyword: 'login to verify', weight: 35, category: 'credential_request' },
  { keyword: 'security alert', weight: 25, category: 'credential_request' },
  { keyword: 'validate credentials', weight: 35, category: 'credential_request' },

  // Scam / generic phishing
  { keyword: 'congratulations you won', weight: 35, category: 'scam_generic' },
  { keyword: 'claim your prize', weight: 35, category: 'scam_generic' },
  { keyword: 'lottery winner', weight: 40, category: 'scam_generic' },
  { keyword: 'exclusive deal', weight: 15, category: 'scam_generic' },

  // Financial threat / extortion
  { keyword: 'wire transfer', weight: 30, category: 'financial_threat' },
  { keyword: 'bitcoin payment', weight: 35, category: 'financial_threat' },
  { keyword: 'gift card', weight: 35, category: 'financial_threat' },
  { keyword: 'invoice overdue', weight: 25, category: 'financial_threat' },
  { keyword: 'crypto wallet', weight: 25, category: 'financial_threat' },

  // Account action
  { keyword: 'billing failure', weight: 30, category: 'account_action' },
  { keyword: 'update payment method', weight: 30, category: 'account_action' },
  { keyword: 'tax refund pending', weight: 35, category: 'account_action' },
]
