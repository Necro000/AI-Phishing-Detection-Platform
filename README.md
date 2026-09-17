# AI Phishing Detection Platform

> **Live demo:** _[add Vercel URL after deployment]_

A full-stack web app that detects phishing URLs and suspicious emails/messages using four independent signals — rule-based heuristics, Google Safe Browsing, VirusTotal, and a trained ML model — combined into a single risk score. Built with Next.js (App Router), Supabase (Auth + Postgres), and deployed on Vercel.

---

## Features

- **URL Scanner** — analyzes any URL across 4 signals, returns `SAFE / SUSPICIOUS / HIGH_RISK` with per-signal breakdown and human-readable reasons
- **Email & Message Analyzer** — rule-based detection of urgency language, credential harvesting patterns, financial fraud signals, and suspicious link structures
- **User dashboard** — paginated personal scan history with risk-level counts
- **Admin panel** — view all users' scans, manage the keyword list (CRUD with server-side validation), inspect all submitted URLs/emails
- **Auth** — email/password via Supabase Auth; role-based access (`user` / `admin`) with server-side role re-check on every admin request

---

## Architecture

Single deployable unit on Vercel (Next.js App Router, TypeScript). No separate backend, no separate ML server.

```
Browser (Next.js UI)
  → /app/api/* Route Handler
      → Rule Engine           (pure TS functions, no I/O)
      → Google Safe Browsing  (3 s timeout + degraded fallback)
      → VirusTotal v3         (GET-only lookup, 24 h cache, degraded fallback)
      → ML inference          (pure arithmetic on weights.json, no I/O)
      → Supabase              (insert scan, read history, role-gated admin reads)
  ← JSON { risk_level, risk_score, reasons[], signals: { rules, safeBrowsing, virusTotal, ml } }
```

**Score bands:** 0–29 SAFE · 30–69 SUSPICIOUS · 70–100 HIGH_RISK

**Override rules** (Architecture.md §5):
- Safe Browsing flagged → `risk_score = 95`, HIGH_RISK (overrides everything)
- VirusTotal ≥ 3 malicious vendors → `risk_score = 90`, HIGH_RISK
- ML signal: up to 25 points added to rule score — capped so a noisy small-dataset model can't single-handedly flip a verdict

**Degraded signals** (Edge-Cases.md):
- Safe Browsing or VirusTotal timeout/error → `degraded: true`, scan continues with remaining signals
- VirusTotal has no report for a URL → "Not yet indexed by VirusTotal" surfaced in `reasons[]`, not treated as an error or as clean — distinct from an actual API failure

---

## ML Model

**Dataset:** PhiUSIIL Phishing URL Dataset, UCI ML Repository  
**Source:** https://archive.ics.uci.edu/dataset/967/phiusiil+phishing+url+dataset  
**Citation:** Prasad Patil, Bhanu, et al. (2023). PhiUSIIL Phishing URL (Website) Dataset. UCI Machine Learning Repository. https://doi.org/10.24432/C5GW2T

**Training:** `scripts/train_model.py` — logistic regression, 80/20 stratified held-out split, StandardScaler normalization, `class_weight="balanced"`.

**Features (7):** URL length, subdomain count, IP-literal host flag, @-symbol in URL, HTTPS present, suspicious-keyword count, Shannon entropy of hostname.

**Measured results on held-out split (47,159 rows):**

| Metric    | Value  |
|-----------|--------|
| Accuracy  | 91.06% |
| Precision | 90.08% |
| Recall    | 94.81% |
| F1 Score  | 92.39% |
| Train size | 188,636 |
| Test size  | 47,159  |

These numbers are the **direct terminal output of `scripts/train_model.py`** on the full PhiUSIIL dataset (235,795 rows), not sourced from benchmark literature for the dataset. The model used 7 features as specified in Architecture.md §7; the PhiUSIIL paper used a much larger feature set and reports different results for different architectures — our numbers reflect this specific 7-feature logistic regression only.

Production inference is pure TypeScript arithmetic on `lib/ml/weights.json` — no ML runtime dependency, no cold-start. `lib/ml/features.ts` extracts the same 7 features identically to the Python training script.

---

## The one simplification (Context.md §4)

**"Reports" is a live admin query over the `scans` table**, not a separate stored Reports table. The original problem statement specified a separate Reports table (id, report_type, details, created_at) — this would be a redundant copy of data already in `scans` with a sync problem. The admin `/admin/scans` view achieves the same monitoring capability without the overhead. This is the only place the implementation substitutes a simpler approach for a literal schema element from the source specification.

---

## API Usage Terms and Costs

**Google Safe Browsing v4**  
Free. Non-commercial/research use per the [Google Safe Browsing Terms of Service](https://developers.google.com/safe-browsing/terms). This project is a non-commercial academic demonstration. The `threatMatches:find` endpoint is called with a 3-second timeout and graceful degraded fallback.

**VirusTotal v3**  
Free tier (4 requests/minute). Non-commercial use per the [VirusTotal Terms of Service](https://www.virustotal.com/gui/terms-of-service). This app uses **GET-only existing-report lookups** (`/urls/{id}`) — it never submits new URLs for scanning. A 24-hour `url_intel_cache` table in Supabase keeps the app well within the free-tier rate limit even under concurrent use.

**Supabase**  
Free tier. [Supabase Terms of Service](https://supabase.com/terms).

---

## Known Limitations

- Brand-new URLs not yet indexed by VirusTotal receive no VT verdict ("Not yet indexed" is surfaced in `reasons[]`, not treated as clean or as an error)
- No redirect-chain following for shortened URLs (bit.ly, t.co, etc.) — only the shortened URL itself is analyzed
- Rule engine keyword sets are English-only; non-English phishing content is a documented limitation
- Admin role promotion is a manual Supabase dashboard action — no UI for it (eliminates a privilege-escalation surface for this build's scope)
- ML model trained on 235,795 rows of a public labeled dataset — precision and recall figures reflect the held-out split on that dataset; real-world performance on novel zero-day phishing campaigns will vary
- The ML model's 25-point contribution cap (Architecture.md §5) is intentional: with a small 7-feature model, the cap prevents a false positive from the ML signal from unilaterally overriding a clean rules+API result

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY`, `SAFE_BROWSING_API_KEY`, and `VIRUSTOTAL_API_KEY` are server-only env vars — never prefixed `NEXT_PUBLIC_`, never referenced in any client component or `lib/supabaseClient.ts` (which is imported by client code)
- Session check happens before any external API call on every route — unauthenticated requests consume no Safe Browsing or VirusTotal quota
- Admin role is re-checked from the database on every `/api/admin/*` request via `lib/auth/requireAdmin.ts` — client-side role claims are never trusted
- RLS on the `scans` table ensures users only see their own scans; admin routes use a service-role client gated by `requireAdmin.ts`

---

## Running Locally

```bash
cp .env.local.example .env.local
# Fill in Supabase URL, anon key, service role key, Safe Browsing API key, VirusTotal API key
npm install
npm run dev
```

Apply the Supabase schema: `docs/supabase-schema.sql` in the Supabase SQL editor.

Retrain the ML model (optional — `lib/ml/weights.json` is already committed):

```bash
pip install numpy pandas scikit-learn
python scripts/train_model.py
```

---

## Resume Bullets

_Based on what was actually built and measured — no invented metrics._

- Built and deployed a full-stack AI phishing detection platform in 4 days using Next.js 16 (App Router, TypeScript), Supabase (Auth + Postgres + RLS), and Vercel
- Integrated 4 independent threat-intelligence signals — rule engine, Google Safe Browsing v4, VirusTotal v3 (cached lookup), and a trained logistic regression model — combined in a single scoring module with graceful degraded fallback per signal
- Trained a 7-feature logistic regression on 235k labeled URLs (PhiUSIIL / UCI ML Repository); achieved 91.06% accuracy, 94.81% recall on a held-out split; shipped inference as pure TypeScript arithmetic with no ML runtime dependency
- Implemented server-side role-based access control (RBAC) with `requireAdmin.ts` re-checking `profiles.role` from Postgres on every admin request, not trusting client-side claims; Row-Level Security enforces per-user scan isolation at the DB layer
- Built full admin panel with keyword CRUD (server-validated 1–40 weight cap, free-text category), all-users view, all-scans view, and paginated per-user dashboard
- Applied production security hardening: SSRF guard on private/loopback IPs, XSS-safe email content rendering (React text escaping, no `dangerouslySetInnerHTML`), secrets segregated into server-only module (`supabaseServiceClient.ts`) to prevent service-role key from entering the client bundle
