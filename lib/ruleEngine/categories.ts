/**
 * categories.ts — shared keyword category constants
 *
 * Architecture.md §4: `keywords.category` has no DB enum constraint (forward-compatible),
 * but this constant is imported by both the admin UI dropdown and the rule matcher so a
 * typo silently fails to match.
 *
 * To add a new category: add it here ONLY — the UI dropdown and matcher pick it up automatically.
 */

export const KEYWORD_CATEGORIES = [
  'urgency',
  'credential_request',
  'scam_generic',
  'financial_threat',
  'account_action',
] as const

export type KeywordCategory = (typeof KEYWORD_CATEGORIES)[number]

/**
 * Human-readable labels for the admin UI dropdown.
 */
export const CATEGORY_LABELS: Record<KeywordCategory, string> = {
  urgency: 'Urgency',
  credential_request: 'Credential Request',
  scam_generic: 'Generic Scam',
  financial_threat: 'Financial Threat',
  account_action: 'Account Action',
}
