/**
 * infer.ts — pure ML inference function
 *
 * Architecture.md §7: pure function over precomputed weights — no I/O, no model server.
 * weights.json is committed as a static file; this function reads it at module init.
 *
 * Edge-Cases.md (ML section):
 *   - weights.json missing/malformed → return { ml: null }, don't crash
 *   - NaN features → extractFeatures() returns null → return { ml: null }
 *   - ML disagrees with rules+API → expected; 25-point cap in scoring.ts prevents override
 */

import { extractFeatures } from './features'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Weights {
  intercept: number
  coefficients: number[]
  scaler_mean: number[]
  scaler_std: number[]
  _meta?: {
    feature_count: number
    feature_names: string[]
    metrics: Record<string, number>
  }
}

export interface InferResult {
  /** Phishing probability 0–1, or null if inference failed */
  ml: number | null
  /** True if weights.json is missing/malformed or feature extraction failed */
  degraded: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Load weights once at module init (server-side only — this runs in Node, not Edge)
// ─────────────────────────────────────────────────────────────────────────────

let weights: Weights | null = null
let weightsLoadError: string | null = null

function loadWeights(): void {
  if (weights !== null || weightsLoadError !== null) return // already attempted

  try {
    // Use require() for synchronous load of the committed JSON static artifact.
    // This runs server-side in Next.js Route Handlers only — never in client bundle.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const raw = require('../../lib/ml/weights.json') as Weights

    // Validate shape
    if (
      typeof raw.intercept !== 'number' ||
      !Array.isArray(raw.coefficients) ||
      !Array.isArray(raw.scaler_mean) ||
      !Array.isArray(raw.scaler_std) ||
      raw.coefficients.length === 0 ||
      raw.coefficients.length !== raw.scaler_mean.length ||
      raw.coefficients.length !== raw.scaler_std.length
    ) {
      weightsLoadError = 'weights.json has invalid shape'
      return
    }

    weights = raw
  } catch (err) {
    weightsLoadError = `Failed to load weights.json: ${err}`
  }
}

// Attempt load immediately
loadWeights()

// ─────────────────────────────────────────────────────────────────────────────
// Sigmoid
// ─────────────────────────────────────────────────────────────────────────────

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x))
}

// ─────────────────────────────────────────────────────────────────────────────
// Inference
// ─────────────────────────────────────────────────────────────────────────────

/**
 * infer(url) → { ml: probability | null, degraded: bool }
 *
 * ml is a 0–1 phishing probability.
 * scoring.ts converts this to a 0–25 point contribution (Architecture.md §5).
 *
 * Returns { ml: null, degraded: true } if:
 *   - weights.json is missing or malformed
 *   - URL feature extraction returns null (NaN/unparsable)
 *   - Any arithmetic produces NaN/Infinity
 */
export function infer(url: string): InferResult {
  // Edge-Cases.md: weights.json missing/malformed
  if (weights === null) {
    console.error('[ml/infer] weights not loaded:', weightsLoadError)
    return { ml: null, degraded: true }
  }

  // Feature extraction — null if URL is unparsable or produces NaN
  const features = extractFeatures(url)
  if (features === null) {
    return { ml: null, degraded: true }
  }

  // Validate feature count matches weights
  if (features.length !== weights.coefficients.length) {
    console.error(
      `[ml/infer] Feature count mismatch: got ${features.length}, expected ${weights.coefficients.length}`
    )
    return { ml: null, degraded: true }
  }

  // Apply StandardScaler: z = (x - mean) / std
  const scaled = features.map((v, i) => {
    const std = weights!.scaler_std[i]
    if (std === 0 || !isFinite(std)) return 0 // avoid division by zero
    return (v - weights!.scaler_mean[i]) / std
  })

  // Logistic regression: dot(coefficients, scaled) + intercept
  let logit = weights.intercept
  for (let i = 0; i < scaled.length; i++) {
    logit += weights.coefficients[i] * scaled[i]
  }

  const probability = sigmoid(logit)

  // NaN/Infinity guard — Edge-Cases.md: NaN features
  if (!isFinite(probability) || isNaN(probability)) {
    return { ml: null, degraded: true }
  }

  return { ml: probability, degraded: false }
}
