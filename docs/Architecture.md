# Architecture.md — Frozen Design (do not deviate without human sign-off)

## 1. High-level flow
```
Browser (Next.js UI)
   -> Next.js Route Handler (/app/api/*)
      -> Rule Engine (pure functions, no I/O)
      -> Google Safe Browsing API (timeout + fallback)
      -> VirusTotal lookup (cached, timeout + fallback)
      -> ML inference (pure function over precomputed weights, no I/O)
      -> Supabase (Postgres: insert scan row, read history, role-checked admin reads)
   <- JSON { risk_level, risk_score, reasons[], signals: {...} }
Browser renders result + refreshes dashboard
```
Still one deployable unit. No separate backend service, no separate ML server — this is
what keeps the expanded scope shippable in 4 days (see Context.md section 5).

## 2. Folder structure
```
/app
  /(auth)/login/page.tsx
  /(auth)/signup/page.tsx
  /(app)/dashboard/page.tsx
  /(app)/scan/url/page.tsx
  /(app)/scan/email/page.tsx
  /(admin)/admin/users/page.tsx
  /(admin)/admin/scans/page.tsx        <- "Reports" view, see Context.md §4
  /(admin)/admin/keywords/page.tsx
  /api/scan/url/route.ts
  /api/scan/email/route.ts
  /api/history/route.ts
  /api/admin/users/route.ts
  /api/admin/scans/route.ts
  /api/admin/keywords/route.ts
/lib
  supabaseClient.ts
  safeBrowsing.ts
  virusTotal.ts
  ml/
    weights.json          <- trained offline, committed as a static artifact
    infer.ts              <- pure function: features -> probability
    features.ts            <- URL string -> feature vector (must match training script exactly)
  ruleEngine/
    urlRules.ts
    emailRules.ts
    scoring.ts             <- combines all 4 signals, single source of truth
  auth/
    requireAdmin.ts        <- server-side role check, used by every /api/admin/* route
/scripts
  train_model.py           <- offline, one-time. NOT run in production. Outputs weights.json
/components
  RiskBadge.tsx, ScanForm.tsx, HistoryTable.tsx, AdminTable.tsx, KeywordManager.tsx
/docs
```

## 3. Database schema (Supabase / Postgres)

**`profiles`** (extends `auth.users`, 1:1, created via trigger on signup)
| column | type | notes |
|---|---|---|
| id | uuid pk | = auth.users.id |
| role | text | 'user' \| 'admin', default 'user' |
| created_at | timestamptz | default now() |

Role is **never** settable by the client. No API route accepts `role` in a request body.
Promoting a user to admin is a manual DB action (Supabase dashboard) for this project's
timeframe — do not build an admin-promotes-admin UI, that's an unnecessary privilege
escalation surface for a 4-day build.

**`scans`**
| column | type | notes |
|---|---|---|
| id | uuid pk | default gen_random_uuid() |
| user_id | uuid fk | -> auth.users.id, NOT NULL |
| scan_type | text | 'url' \| 'email' |
| input | text | raw submitted content, length-capped (Edge-Cases.md) |
| risk_level | text | 'SAFE' \| 'SUSPICIOUS' \| 'HIGH_RISK' |
| risk_score | int | 0–100 |
| reasons | jsonb | array of strings |
| signals | jsonb | `{ rules: number, safeBrowsing: bool|null, virusTotal: bool|null, ml: number|null }` |
| created_at | timestamptz | default now() |

**`keywords`** (admin-managed, used by emailRules/urlRules at request time)
| column | type | notes |
|---|---|---|
| id | uuid pk | |
| keyword | text | unique |
| weight | int | how many points this keyword contributes if matched |
| category | text | 'urgency' \| 'credential_request' \| 'scam_generic' etc. |
| created_by | uuid fk | -> auth.users.id (admin who added it) |
| created_at | timestamptz | |

**`url_intel_cache`** (avoids re-hitting VirusTotal's rate limit for repeat/shared URLs)
| column | type | notes |
|---|---|---|
| url_hash | text pk | sha256 of normalized URL |
| virustotal_result | jsonb | cached verdict |
| fetched_at | timestamptz | |

TTL (24h) is enforced in application code, not a DB job: `virusTotal.ts` checks
`fetched_at < now() - interval '24h'` and treats a stale row as a cache miss, overwriting
it on the next lookup. No Supabase cron — nothing to schedule or monitor for a table that
self-corrects on next access. Accessed only via the server-side service-role client (never
from client code); RLS is enabled with zero policies (default-deny) as defense-in-depth in
case a future change ever exposes it to a client-side query — service-role bypasses RLS
regardless, so this costs nothing today.

RLS: `scans` — `user_id = auth.uid()` for select/insert (users see only their own).
Admin routes bypass this via a server-side Supabase service-role client, gated by
`requireAdmin.ts` checking `profiles.role = 'admin'` for the session user — **never**
trust a role claim from the client, always re-check server-side per request.

## 4. API contract (frozen)
### POST `/api/scan/url`
Request: `{ "url": string }`
Response: `{ "risk_level": "SAFE"|"SUSPICIOUS"|"HIGH_RISK", "risk_score": number, "reasons": string[], "signals": {...} }`

### POST `/api/scan/email`
Request: `{ "content": string }` — same response shape as above (signals.safeBrowsing/virusTotal = null, not applicable).

### GET `/api/history?limit=20&offset=0`
Response: `{ "scans": Scan[], "total": number }` — current user's scans only.

### GET `/api/admin/scans?limit=50&offset=0` (admin only)
Response: `{ "scans": Scan[], "total": number }` — all users' scans, joined with user email.

### GET `/api/admin/users` (admin only)
Response: `{ "users": { id, email, role, scan_count }[] }`

### GET/POST/PATCH/DELETE `/api/admin/keywords` (admin only)
Standard CRUD on the `keywords` table. PATCH (`/api/admin/keywords/:id`) edits `weight`/
`category` in place — deliberately not DELETE+re-POST, which would lose `created_at`/
`created_by` on every weight tweak during the tuning you'll be doing close to the deadline.

`weight` is capped at **1–40 per keyword**, enforced both server-side and via a DB `CHECK`
constraint — not 1–100. Reasoning: risk bands are SAFE 0–29 / SUSPICIOUS 30–69 / HIGH_RISK
70–100; a single keyword must never be able to unilaterally force HIGH_RISK on its own,
the same way no single rule can — reaching HIGH_RISK from the rule engine alone still
requires multiple signals to agree. A weight of 40 can push a scan into SUSPICIOUS by
itself but never into HIGH_RISK alone.

`category` has no DB enum constraint and the API does not reject unknown category strings
— it stays free-text/forward-compatible. `lib/ruleEngine/categories.ts` exports the known
set (`urgency`, `credential_request`, `scam_generic`, ...) purely to populate the admin UI
dropdown and to be imported by the rule matcher for its own known checks; it is a suggested
list, not a validation whitelist. Do not add server-side rejection of categories outside
this list.

## 5. Scoring model (single source of truth: `scoring.ts`)
- Rule engine hits sum to a base score (each rule has a fixed weight, urlRules/emailRules
  read active weights from `keywords` table for keyword-based rules, hardcoded weights for
  structural rules like "no HTTPS" or "IP-literal host").
- Safe Browsing flagged = automatic `risk_score = 95`, `HIGH_RISK`, overrides everything else.
- VirusTotal: if malicious-vendor count >= 3, automatic `risk_score = 90`, `HIGH_RISK`.
  If VT has no report for the URL (unseen), contributes 0 — this is a known limitation
  (Context.md §5), not an error.
- ML signal (URL scans only): `infer.ts` outputs a 0–1 probability; contributes up to 25
  points added to the rule-engine base score, capped so a noisy/small-dataset model can't
  single-handedly flip a verdict — it's a signal, not the final word (see Edge-Cases.md ML
  section for why this cap exists).
- Score bands: 0–29 = SAFE, 30–69 = SUSPICIOUS, 70–100 = HIGH_RISK.
- `reasons[]` lists every rule/signal that fired in plain English, including which external
  service produced a verdict — keeps the tool explainable per section 4.3 of the source doc.
- `signals.rules` stores the **raw rule-engine contribution only** — pre-ML, pre-override,
  before Safe Browsing/VirusTotal auto-override logic is applied. Each entry in `signals`
  reflects its own independent input, not a running combined total; `risk_score` is the
  only field that reflects the final combined number. For email scans, `signals.safeBrowsing`,
  `signals.virusTotal`, and `signals.ml` are all `null` — no ML runs on email content
  (features.ts is URL-shaped), only `signals.rules` is populated.

## 6. External API integration
- **Google Safe Browsing v4** `threatMatches:find` — timeout ~3s, catch+fallback to
  `{ flagged: false, degraded: true }` on any failure.
- **VirusTotal v3** — GET existing URL report only (`/urls/{id}` where id = base64url(URL)),
  never POST a new scan + poll. Check `url_intel_cache` first (24h TTL); only call VT if
  cache miss. Free-tier rate limit (4 req/min) means the cache is load-bearing, not optional.
- Both wrappers return a consistent `{ verdict, degraded }` shape so `scoring.ts` doesn't
  need to know which provider produced which result.

## 7. ML model
- Trained **offline**, once, via `scripts/train_model.py` against a public labeled
  phishing-URL dataset (cite the exact dataset + source in the README — do not fabricate
  a dataset or claim results you haven't actually measured).
- Model: logistic regression over a small hand-picked feature set (URL length, subdomain
  count, has-IP-host, has-@-symbol, HTTPS present, count of suspicious keywords, entropy
  of the domain string) — chosen because it's fast to train, easy to validate, and its
  coefficients can be embedded directly as JSON and evaluated in TypeScript without any
  ML runtime dependency in production.
- `scripts/train_model.py` also prints/saves accuracy, precision, recall on a held-out
  split — these numbers go in the README as-measured, not estimated.
- `features.ts` (TypeScript) must extract features identically to the Python training
  script's feature extraction — mismatched feature order/scaling silently breaks inference.
  Write one, then port it, don't write both independently.

## 8. Auth
Supabase Auth, email/password. Middleware protects `/(app)/*` and `/(admin)/*` route
groups; `/(admin)/*` additionally requires `requireAdmin.ts` to pass server-side.

## 9. Deployment
Vercel (frontend + API routes + ML inference, all in the same app) + Supabase (hosted
Postgres/Auth). `weights.json` is a committed static file, not fetched at runtime from
anywhere external — no cold-start dependency on a model registry.