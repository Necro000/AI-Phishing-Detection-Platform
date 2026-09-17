# Implementation-Phase-Wise-Plan.md — 4 Days, Full Scope, Parallel Tracks

Full feature set is in scope (Context.md §3). This is achievable in 4 days by running
**two Antigravity Manager-mode tracks in parallel** each day where the work doesn't
depend on the other track finishing first. Track A is always the app's critical path
(auth → URL scanning → email scanning → hardening). Track B is the "can be built
independently and merged in" work. Review both tracks' output before merging/approving.

## Day 1
**Track A**: Init Next.js (TS, App Router, Tailwind). Supabase project + `scans`,
`profiles` (with role), `keywords`, `url_intel_cache` tables + RLS. Auth (signup/login/
logout), `(app)` and `(admin)` protected route groups, `requireAdmin.ts`. Manually create
one admin user in Supabase dashboard for testing.
**Track B** (independent — start immediately, doesn't need the app running): Find and
download a public labeled phishing-URL dataset. Write `scripts/train_model.py`: feature
extraction, train logistic regression, evaluate on held-out split, output `weights.json`
+ measured accuracy/precision/recall. Port the same feature extraction to `features.ts`.

**DoD**: Real user can sign up/log in/log out; admin user can log in and reach `(admin)`
routes while a normal user is blocked (test this, not assumed). `weights.json` exists,
committed, with real measured metrics written down (even rough ones) for the README later.
Edge-Cases.md "Auth" and "Admin Panel" role-check items handled.

## Day 2
**Track A**: `urlRules.ts`, `scoring.ts` (combining rules + Safe Browsing + VirusTotal +
ML per Architecture.md §5), `safeBrowsing.ts`, `virusTotal.ts` (+ `url_intel_cache` lookup),
`/api/scan/url`, `/scan/url` UI showing all signals in `reasons[]`.
**Track B**: `ml/infer.ts` wired into `scoring.ts` (coordinate the interface with Track A
early in the day — this is the one real dependency between tracks this phase). Once that's
merged, Track B moves to admin panel scaffolding: `/admin/users`, `/admin/scans` (Reports
view), `/api/admin/users`, `/api/admin/scans`.

**DoD**: URL scan returns a combined verdict using all 4 signals with SSRF/timeout/fallback/
cache edge cases from Edge-Cases.md handled. Admin can view all users and all scans.

## Day 3
**Track A**: `emailRules.ts` (reuses `scoring.ts`), `/api/scan/email`, `/scan/email` UI
(sanitized rendering), `/api/history` + dashboard counts.
**Track B**: Admin keyword management (`/admin/keywords`, CRUD API, validation), and wire
`urlRules.ts`/`emailRules.ts` to read keyword weights from the `keywords` table instead of
hardcoded lists (coordinate this handoff with Track A — rules must still work with sane
defaults if the keywords table is empty).

**DoD**: Email scan works end to end with sanitized rendering. Admin can add/remove/edit
keywords and see them affect new scans. A second test user cannot see the first user's
history; a non-admin cannot reach any `/api/admin/*` route even by direct request.

## Day 4 — Hardening, polish, deploy, docs (single track — merge and stabilize)
- Sweep every remaining unchecked Edge-Cases.md item, including the ML and VirusTotal
  sections specifically (cache TTL, degraded-signal UI copy, NaN/malformed-feature guards)
- Loading/error states on both scan forms and the admin panel
- Responsive check on mobile width, including admin tables
- Deploy to Vercel, confirm all env vars set there (Safe Browsing key, VirusTotal key,
  Supabase keys), smoke-test the live URL end to end including an admin login
- README: architecture summary, ML dataset source + actual measured metrics (not
  estimated), what was substituted (Context.md §4) and why, known limitations
  (Edge-Cases.md "Explicitly deferred")
- Resume bullets (see Antigravity-Prompts.md Day 4 prompt)

**DoD**: Live URL works end-to-end — signup, URL scan with all 4 signals visible, email
scan, dashboard, and admin panel — with no console errors, on mobile width. README states
real measured ML metrics and honest known limitations, not aspirational claims.

## If a track falls behind
Track B is the one to compress first (e.g. keyword weights can ship as sane hardcoded
defaults with the admin CRUD UI still functional, even if the "rules read from DB"
wiring lands imperfectly) — Track A (core scanning) is what the grade actually hinges on.
