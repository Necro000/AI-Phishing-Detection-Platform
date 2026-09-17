# Resume Bullets — AI Phishing Detection Platform

These bullets are factual, based on what was actually built and measured.
No invented metrics, no aspirational claims, no estimated numbers.

---

## 4–6 Resume Bullets

---

**Full-Stack AI Security Platform** — Built a production-grade phishing detection web app in Next.js (App Router) and Supabase that classifies URLs and email content as Safe / Suspicious / High Risk using four independent signals: heuristic rule engine, Google Safe Browsing v4, VirusTotal v3 (24h cached lookups), and offline-trained logistic regression inference — all combined in a single scoring function with explicit degradation handling for external API failures.

---

**Machine Learning Pipeline (Offline-Trained, Zero Runtime Dependency)** — Trained a logistic regression model on the PhiUSIIL Phishing URL Dataset (188,636 train / 47,159 test samples from the UCI ML Repository), achieving **91.06% accuracy, 90.08% precision, 94.81% recall, and F1 0.9239** on a held-out split. Ported the identical 7-feature extraction pipeline from Python (scikit-learn) to TypeScript for in-process inference via committed `weights.json` — no model server, no cold-start risk, and inference capped at 25 score points by design so a small-dataset model cannot unilaterally override multi-signal evidence.

---

**Defense-in-Depth Authorization Architecture** — Implemented a two-layer role enforcement model (`requireAdmin.ts`) that re-verifies `profiles.role` from the Supabase Postgres DB on every `/api/admin/*` request, independently of the session token — preventing both unauthenticated access (401) and privilege escalation via forged client-side role claims (403). Role promotion is a manual database operation by design, eliminating an unnecessary admin-promotes-admin attack surface.

---

**Threat Detection Rule Engine with Admin-Configurable Keywords** — Designed a pure-function rule engine (`urlRules.ts`, `emailRules.ts`) that separates signal collection (returning `RuleHit[]`) from scoring (`scoring.ts` as single source of truth), enabling independent testability. Keyword weights are capped at 1–40 per rule so no single term can force HIGH_RISK unilaterally; structural rules (IP-literal hosts, Punycode domains, SSRF guard) run unconditionally regardless of keyword configuration.

---

**Real-Time Security Dashboard with Multi-Tenant Data Isolation** — Built user dashboard (`/dashboard`), scan history (`/api/history`), and admin audit log (`/api/admin/scans`) with Supabase Row-Level Security (RLS) enforcing tenant isolation at the database layer (`user_id = auth.uid()`). Service-role client bypasses RLS only for admin routes, which are independently gated by server-side role verification — so two mechanisms must both be compromised to access another user's data.

---

**Resilient External API Integration with Graceful Degradation** — Wrapped Google Safe Browsing (3s timeout) and VirusTotal (5s timeout, 24h Redis-style Postgres cache for the 4 req/min free-tier rate limit) in try/catch fallback wrappers returning `{ flagged: false, degraded: true }` on any failure, so a throttled or unavailable external signal never crashes a scan — it surfaces in the UI as an explicit "Reduced Confidence" banner with per-signal degradation indicators. Email scans never call external APIs, preventing invisible quota drain.
