# Context.md — AI Phishing Detection Platform

## 1. One-liner
A web app where a user pastes a URL or email/message text and gets back a risk score
(Safe / Suspicious / High Risk) using rule-based checks + Google Safe Browsing + VirusTotal
+ a lightweight trained ML signal, with a user dashboard and an admin panel, deployed live.

## 2. Real constraint driving every decision in this doc set
Original problem statement assumes a **30-day** build. **Actual deadline: 4 days**
(submission moved to Sept 21). Full scope from the problem statement is being kept per
your call — the plan below achieves that by running work in **parallel Antigravity
Manager-mode tracks** rather than by cutting features. See Implementation-Phase-Wise-Plan.md
for how the tracks are split.

## 3. In scope (full feature set, per problem statement)
- Email/password auth (Supabase Auth) with `user` / `admin` roles
- URL Scanner: heuristics + Google Safe Browsing + VirusTotal (cached lookup, not submit+poll)
- Email/Message Analyzer: rule engine (urgency, credential requests, link mismatch, scam keywords)
- ML signal: logistic-regression-style model trained offline on a public labeled phishing
  dataset, shipped as weights, inference done in-app (no separate model server)
- Combined risk scoring across all signals (rules + Safe Browsing + VirusTotal + ML)
- User dashboard: scan history, counts, per-user scoped
- Admin panel: user list, all-scans view (serves as "Reports"), keyword list management
- One deployed, working URL (Vercel)

## 4. The one simplification kept, and why
- **"Reports" is an admin query/view over the `scans` table, not a separate stored table.**
  The original doc's Reports Table (id, report_type, details, created_at) would just be a
  redundant copy of data already in `scans` — building it as a live admin view of scans
  gets you the same "Monitor Reports" capability (section 5/6.2) without a sync problem
  between two tables. This is the only place I've substituted a simpler implementation
  for a literal schema element from the source doc; everything else is built as specified.

## 5. Why this is achievable in 4 days now (the argument, updated)
- **Parallel tracks, not sequential features.** ML training and admin-panel UI don't depend
  on each other or on the URL scanner being finished — they can run as separate Antigravity
  Manager-mode agent sessions from Day 1, reviewed by you in parallel, instead of queued
  one after another. This is the actual thing your pro subscription buys back: reviewer
  time, not just agent compute.
- **ML kept out of the runtime critical path.** Training happens once, offline, against a
  public dataset (not a live pipeline you have to keep working under deadline pressure).
  Production inference is arithmetic on precomputed weights — same reliability profile as
  the rule engine, not a second service that can go down.
- **VirusTotal used as lookup-only, not submit+poll.** Submitting a URL to VT for a fresh
  scan then polling for results adds a wait state and a queue to manage — time you don't
  have. Querying VT's existing report for a URL (GET, hashed URL id) is fast and fits the
  same "signal provider" shape as Safe Browsing. Documented as a known limitation: brand-new
  URLs VT hasn't seen yet won't get a VT verdict, just rules + Safe Browsing + ML.

## 6. Success criteria for Sept 21
- [ ] User can sign up / log in; admin account exists and can log in with elevated access
- [ ] URL scan returns a combined verdict (rules + Safe Browsing + VirusTotal + ML) with reasons
- [ ] Email/message scan returns a rule-based verdict with reasons
- [ ] User dashboard shows own scan history + counts
- [ ] Admin panel shows all users' scans, and lets admin edit the keyword list
- [ ] Deployed on a public URL, all four signal types demonstrably working on the live site
- [ ] README explains architecture, the ML dataset/training approach, and known limitations

## 7. Glossary
- **Risk Level**: SAFE / SUSPICIOUS / HIGH_RISK — the only three values allowed, everywhere.
- **Risk Score**: 0–100 numeric, weighted sum across rule engine + ML, overridden to 90+ by
  a positive Safe Browsing or VirusTotal malicious verdict.
- **Signal**: one of the four independent inputs to a scan's score — rule engine, Safe
  Browsing, VirusTotal, ML model.
- **Scan**: one submitted URL or one submitted email/message text + its combined result.
