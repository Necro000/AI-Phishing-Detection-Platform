# Antigravity-Prompts.md — What to actually paste into the agent

Run Track A and Track B as **separate Manager-mode sessions** each day (Cmd/Ctrl+E to
open Manager view, "Start Conversation" per track). Use Planning Mode within each session
before execution. Review both before merging into your actual working branch.

## Session 0 — one-time setup prompt (run once, before Day 1)
```
Read AGENTS.md and every file in /docs before doing anything else. Confirm back to me,
in under 10 bullet points: the frozen DB schema (all 4 tables), the frozen API contract,
the role/admin security model, and how the ML signal is capped in scoring.ts. Do not write
any code yet. If anything in the docs is ambiguous or contradicts itself, list it before
I approve you to start Day 1.
```

## Day 1 — Track A prompt
```
Start Implementation-Phase-Wise-Plan.md Day 1, Track A only. Planning Mode first: give me
a file-by-file plan before writing anything. Follow Architecture.md's schema and folder
structure exactly. After building, explicitly test and show me: a non-admin user cannot
reach an (admin) route, and an admin user can.
```

## Day 1 — Track B prompt (separate Manager session, run at the same time)
```
Start Implementation-Phase-Wise-Plan.md Day 1, Track B. This doesn't depend on the web app
running. Find a real public labeled phishing-URL dataset, cite its source. Write
scripts/train_model.py per Architecture.md section 7: extract the specified features, train
logistic regression, evaluate on a held-out split, save weights.json, and print actual
accuracy/precision/recall — report the real numbers to me, don't estimate them. Then port
the same feature extraction to lib/ml/features.ts and show me a side-by-side test proving
the TS and Python feature vectors match on 3-5 sample URLs.
```

## Day 2 — Track A prompt
```
Start Day 2, Track A. Planning Mode first. Build urlRules.ts, safeBrowsing.ts (timeout +
fallback per Architecture.md section 6), virusTotal.ts (lookup-only, with url_intel_cache
per the same section — never submit+poll), and scoring.ts combining all signals per section
5. Wire the /api/scan/url route and UI. Go through every "URL Scanner" checkbox in
Edge-Cases.md and tell me explicitly how each is handled.
```

## Day 2 — Track B prompt
```
Start Day 2, Track B. First, coordinate with the interface Track A's scoring.ts expects for
the ML signal (ask me if you need to see Track A's current scoring.ts) and wire
lib/ml/infer.ts in. Once that's merged, build the admin panel scaffolding: /admin/users and
/admin/scans (the Reports view per Context.md section 4) with their API routes, gated by
requireAdmin.ts. Prove server-side role-checking works by testing as a non-admin.
```

## Day 3 — Track A prompt
```
Start Day 3, Track A. Reuse scoring.ts — do not duplicate scoring logic for email. Before
rendering any user-submitted email content, confirm and show me the exact sanitization line.
Build /api/history and the dashboard. Test that a second account cannot see the first
account's history.
```

## Day 3 — Track B prompt
```
Start Day 3, Track B. Build /admin/keywords CRUD (validate server-side: no empty/duplicate
keywords, no negative weights). Then wire urlRules.ts/emailRules.ts to read weights from the
keywords table, with sane hardcoded defaults if the table is empty — coordinate this change
with Track A's rule files before merging so you don't overwrite each other's work.
```

## Day 4 prompt (single session)
```
Go through Edge-Cases.md top to bottom, including the ML and VirusTotal sections
specifically, and tell me item by item what's unchecked, then fix those first. Handle
loading/error states and mobile responsiveness across user and admin views. Deploy to
Vercel, confirm all env vars are set there, smoke-test the live URL including an admin
login. Then write README.md with the architecture summary, the ML dataset source and the
actual measured accuracy/precision/recall from Day 1 Track B, the one substitution from
Context.md section 4, and known limitations from Edge-Cases.md. Finally draft 4-6 resume
bullet points — factual, based on what was actually built and measured, no invented metrics.
```

## Standing correction prompt
```
Stop. That's outside the frozen contracts in Architecture.md/Brain.md section 1. Re-read
Brain.md and continue only within those constraints.
```

## Notes on model/mode choice
Antigravity's agent API rejects a temperature parameter directly — control determinism via
Planning Mode + model/thinking-level instead (AGENTS.md section 1). Use a high-thinking
variant for both tracks whenever they touch auth, role checks, the DB schema, external API
wrappers, or the ML feature extraction — these are exactly the places a hallucinated detail
either breaks the app or quietly breaks security. Lighter/faster variant is fine for admin
UI polish, README wording, and resume bullets.
