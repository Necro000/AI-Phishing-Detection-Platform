# Brain.md — Project Constitution & Decisions Log

## 1. Non-negotiable rules
1. Full feature set from the problem statement is in scope (Context.md §3), with the one
   substitution noted in Context.md §4 (Reports = admin view over scans, not a new table).
2. DB schema and API contract in Architecture.md are frozen. A schema change requires you
   to explicitly approve it — the agent never silently migrates it.
3. `risk_level` only ever has 3 values: `SAFE`, `SUSPICIOUS`, `HIGH_RISK`.
4. Every external call (Safe Browsing, VirusTotal) has a timeout and a fallback. No bare
   `fetch()` without both.
5. `role` is never client-settable. Every `/api/admin/*` route re-checks role server-side,
   every single request — no caching "is admin" in a client token and trusting it.
6. ML model runs as a pure in-process function over committed weights — no live training,
   no separate model server, in production.
7. No secrets in client code, ever.
8. Sanitize/escape all user-submitted text before rendering — including in the admin panel.

## 2. Decisions log
- **Day 0**: Full scope restored per explicit user decision — admin panel, VirusTotal, and
  ML are all in, using parallel Manager-mode tracks instead of cutting features. See
  Context.md §5 and Implementation-Phase-Wise-Plan.md for how the tracks are split.
- **Day 0**: ML approach = offline training on a public labeled dataset, shipped as static
  weights, TS-side inference — chosen specifically so ML doesn't become a second runtime
  service to keep alive under deadline pressure.
- **Day 0**: VirusTotal = lookup-only (GET existing report), not submit+poll — avoids a
  wait-state UX problem and fits the free-tier rate limit better.
- **Day 0**: Admin role promotion is a manual DB action, not a UI feature, for this build.
- **Day 0 (Session 0 confirmation round)**: Real folder must be lowercase `docs` — Linux
  deploy is case-sensitive, don't let dev-machine casing mask a prod bug.
  `url_intel_cache` TTL enforced in `virusTotal.ts` app code, not a Supabase cron.
  `url_intel_cache` gets RLS enabled with zero policies (default-deny) even though only
  the service-role client touches it. `signals.rules` = raw rule-engine contribution only,
  pre-ML, pre-override. `keywords.category` stays enum-free in the DB but is backed by a
  shared `lib/ruleEngine/categories.ts` constant used by both the admin UI and the matcher.
  `/api/admin/keywords` gets PATCH added (not just GET/POST/DELETE) so weight/category edits
  don't destroy `created_at`/`created_by` — expect real tuning to happen here near the deadline.
- *(append further decisions here as the build proceeds — e.g. actual rule weights chosen,
  actual measured ML precision/recall, any deviation approved mid-build)*

## 3. Conventions
- TypeScript everywhere, strict mode on.
- Rule engine + ML inference are pure functions: no I/O inside them.
- One rule = one small named function, not a big if/else — keeps `reasons[]` traceable.
- Commit messages reference the phase/track from Implementation-Phase-Wise-Plan.md
  (e.g. `day2-trackA: url scanner rule engine + safe browsing wrapper`,
  `day2-trackB: ml feature extraction + training script`).

## 4. What "done" means
A phase/track is done when: its Definition of Done is fully checked, AND its relevant
Edge-Cases.md items are checked, AND nothing in Architecture.md's frozen contracts was
silently changed to make it work.

## 5. Escalation rule
Propose a specific default + one-line reasoning and proceed for ambiguities not covered
here (e.g. an exact rule weight). Stop and ask only when it touches a frozen item (schema,
API contract, role/security model) from §1.