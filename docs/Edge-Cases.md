# Edge-Cases.md — a feature is not "done" until these are handled

## URL Scanner
- [ ] No protocol given → normalize to https:// before checking
- [ ] Malformed/unparsable URL → clean "invalid input" response, not a 500
- [ ] IP-literal host → flag as suspicious
- [ ] Private/loopback IP or localhost → server never fetches the URL itself (SSRF guard);
      only string-based heuristics + third-party lookups touch it
- [ ] Punycode/homograph domain → flag as suspicious
- [ ] URL > ~2000 chars → truncate for storage, still analyze, note truncation
- [ ] Safe Browsing timeout/error → fallback, `degraded: true`, don't fail the request
- [ ] VirusTotal timeout/error/rate-limit hit → fallback, `degraded: true`, same as above
- [ ] VirusTotal has no report for this URL (unseen/new) → treat as "no VT signal," not an error;
      surface in reasons[] as "Not yet indexed by VirusTotal," don't imply it's clean
- [ ] Duplicate scan by same user → allowed, new row each time, no dedup
- [ ] Empty string → reject client + server side

## Email / Message Analyzer
- [ ] Empty content → reject with validation message
- [ ] Very long paste (>10,000 chars) → cap stored/displayed length, don't hang the request
- [ ] HTML/script tags in content → sanitize before ever rendering back (XSS — never
      `dangerouslySetInnerHTML` on raw input)
- [ ] Legitimate urgent bank email → accepted false-positive rate, document as known limitation
- [ ] Non-English content → English keyword sets only, documented limitation
- [ ] No links present → still score on language/urgency rules alone

## Admin Panel
- [ ] Non-admin hitting any `/api/admin/*` route (even with a forged client-side "isAdmin"
      flag) → `requireAdmin.ts` re-checks `profiles.role` server-side on every request;
      test this explicitly with a real non-admin session, not just by hiding the admin nav link
- [ ] Client ever sending a `role` field on signup/profile update → server ignores/rejects it;
      role changes are DB-manual only for this build (Architecture.md §3)
- [ ] Admin keyword CRUD: empty keyword, duplicate keyword, negative/absurd weight value →
      validate server-side, not just in the form
- [ ] Admin "all scans" view growing large → paginate, same pattern as user history
- [ ] Admin viewing another user's scan input (raw pasted email/URL) → still sanitize on
      render, admin's browser is not a trusted rendering context either

## ML Model
- [ ] `weights.json` missing/malformed at runtime → `infer.ts` catches this, returns
      `{ ml: null }`, scoring proceeds without the ML signal rather than crashing
- [ ] Feature extraction mismatch between `features.ts` (TS) and `train_model.py` (Python)
      → write one, port the other, and add a small test that runs both on 3–5 known URLs
      and confirms identical feature vectors before trusting the model in production
- [ ] Input URL that produces out-of-range/NaN features (e.g. empty domain after parsing)
      → clamp/guard in `features.ts`, return `{ ml: null }` rather than feeding NaN to inference
- [ ] Small training dataset → do not claim production-grade accuracy in the README; report
      the actual measured precision/recall from the held-out split, and state the dataset
      size plainly
- [ ] ML disagreeing strongly with rules+API signals on a specific case → this is expected
      with a small model; the 25-point cap in scoring.ts (Architecture.md §5) exists exactly
      so ML can't override a clean rules+API result on its own — don't raise that cap without
      re-validating the model

## Auth
- [ ] Duplicate signup email → clear "account already exists" message
- [ ] Weak/short password → enforced client + server side
- [ ] Expired/invalid session on protected route → redirect to `/login`, not a 500
- [ ] User A must never see User B's scans → verified by RLS, test by querying another
      user's scan id directly while logged in as a non-admin

## Dashboard / History
- [ ] Zero scans yet → empty state, not blank/error
- [ ] Large history → paginated per the frozen contract

## Cross-cutting
- [ ] No API keys (Safe Browsing, VirusTotal, Supabase service role) in client bundle,
      logs, or git history — verify `.env.local` is gitignored before first commit
- [ ] Unauthenticated hammering of scan endpoints → session check happens before any
      external API call, so quota isn't burned by unauthenticated abuse
- [ ] Combined quota exhaustion (Safe Browsing AND VirusTotal both degraded at once) →
      scan still returns a rule-engine(+ML)-only result, clearly labeled as reduced-confidence

## Explicitly deferred (document as known limitations, don't build)
- No redirect-chain following for shortened URLs
- No multi-language rule sets
- No admin-promotes-admin UI (role changes are manual DB actions for this build)
- VirusTotal is lookup-only — brand-new URLs won't have a VT verdict
