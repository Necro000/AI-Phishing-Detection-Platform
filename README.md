# 🛡️ Enterprise AI Phishing Detection & Threat Intelligence Platform

An enterprise-grade, full-stack cybersecurity platform engineered to detect malicious phishing URLs, fraudulent email lures, and social engineering campaigns in real time. 

Built with **Next.js 16 (Turbopack, App Router)**, **TypeScript**, **Supabase (PostgreSQL + RLS)**, and styled using an **Enterprise SOC Dark Bento Matrix** design system with hand-crafted **Neon Duotone Cyber Icons**.

---

## 📑 Table of Contents
- [Executive Overview](#-executive-overview)
- [System Architecture](#-system-architecture)
- [Multi-Layered Detection Engine](#-multi-layered-detection-engine)
- [Machine Learning Model & Metrics](#-machine-learning-model--metrics)
- [SOC Threat Intelligence Suite](#-soc-threat-intelligence-suite)
- [Security & Threat Containment](#-security--threat-containment)
- [Automated Testing & QA Verification](#-automated-testing--qa-verification)
- [Local Development Setup](#-local-development-setup)
- [Environment Configuration](#-environment-configuration)
- [Project Status & Roadmap](#-project-status--roadmap)

---

## ⚡ Executive Overview

Modern phishing attacks exploit rapid domain generation, zero-day infrastructure, and manipulative psychological triggers. Traditional single-vendor blocklists often fail to catch targeted lures before users fall victim.

This platform solves this challenge by deploying a **defense-in-depth scoring pipeline** that aggregates four independent detection layers:
1. **Lexical & Structural Heuristic Engine** (Entropy, port tricks, typosquatting, cloud form abuse, keywords)
2. **VirusTotal Multi-Vendor Threat Intelligence** (Aggregated across 70+ global security engines with tiered zero-day caching)
3. **In-Process Machine Learning Inference** (Trained on 235k+ URLs; zero-cold-start TypeScript inference)
4. **Google Safe Browsing Fallback Protocol** (Gracefully degradable without external hard dependencies)

All telemetry flows into a unified risk scoring matrix classifying targets into strict security bands: `SAFE (0–29)`, `SUSPICIOUS (30–69)`, and `HIGH_RISK (70–100)`.

---

## 🏗️ System Architecture

The application runs as a unified full-stack Next.js 16 application with strict separation between public scanner endpoints, authenticated user dashboards, and role-gated SOC administrator consoles.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT INTERFACE (Next.js 16)                           │
│  - Bento Quick Scanner (URL / Email)        - SOC Incident Audit Log (/admin/scans)    │
│  - User Security Dashboard (/dashboard)     - Rule Forge & Sandbox (/admin/keywords)    │
│  - Zero Trust User Directory (/admin/users) - Forensic Threat Drawers (Slide-out)       │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SERVER-SIDE DETECTION PIPELINE                            │
│                                                                                        │
│  ├── 1. SSRF & IMDS Guard           ──► Blocks private IPs & Cloud Metadata (169.254.x)│
│  ├── 2. Lexical Rule Engine         ──► Structural heuristics + DB-driven signature sets│
│  ├── 3. VirusTotal Threat Feed      ──► Hashed URL query with tiered 15m/24h cache     │
│  ├── 4. In-Process ML Inference     ──► Logistic regression over committed weights.json│
│  └── 5. Safe Browsing Adapter       ──► Fallback protocol with auto-graceful bypass    │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             SCORING MODULE & STORAGE LAYER                             │
│                                                                                        │
│  ├── Score Summation Engine         ──► 0–29: SAFE | 30–69: SUSPICIOUS | 70–100: HIGH  │
│  ├── Hard Overrides                 ──► VT >= 3 malicious vendors -> 90 pts (HIGH_RISK)│
│  ├── Supabase PostgreSQL            ──► Row-Level Security (RLS) tenant isolation      │
│  └── Admin Verification Guard       ──► Server-side profile re-check on every request  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Multi-Layered Detection Engine

### 1. URL Analysis Signals
- **Lexical Rules Engine:** Analyzes host entropy, IP-based URLs, `@` credential markers, suspicious TLDs (`.xyz`, `.top`, `.tk`), subdomain count, cloud SaaS form credential harvesting, and database-driven threat keywords.
- **VirusTotal v3 Lookup:** Fast GET-only lookups against VirusTotal’s threat database. A dedicated `url_intel_cache` table caches vendor results using a **tiered TTL strategy** (24 hours for indexed reports; 15 minutes for 404/unseen targets to eliminate zero-day blind spots while conserving quota).
- **ML Phishing Probability:** Extracts 7 key structural features and applies an in-process logistic regression model (capped at +25 pts to prevent single-signal false positives).
- **Graceful Degradation:** If external APIs are unconfigured, timed out, or rate-limited, the engine automatically flags the signal as `degraded` and scores targets accurately using the remaining active layers.

### 2. Email & Social Engineering Engine
- Deep heuristic inspection targeting social engineering triggers:
  - **Urgency Vectors:** "Account suspended", "Immediate action required", "24 hours remaining".
  - **Credential Harvesting:** "Verify password", "Confirm credentials", "Update billing".
  - **Financial Coercion:** "Wire transfer", "Overdue invoice", "Crypto deposit".
  - **Deceptive Anchor Mismatches:** Detects hyperlinks where the visible display text differs from the actual underlying destination URL.
  - **Header & Structural Parsing:** RFC 822 MIME parsing with Quoted-Printable and Base64 content decoding.

---

## 🧠 Machine Learning Model & Metrics

The platform incorporates an offline-trained Machine Learning model designed for zero-latency, in-process inference without requiring an external microservice.

- **Training Dataset:** PhiUSIIL Phishing URL Dataset (UCI Machine Learning Repository, 235,795 labeled URLs).
- **Model Architecture:** Logistic Regression with L2 regularization, `class_weight="balanced"`, and StandardScaler normalization.
- **Extracted Features (7):**
  1. URL Total Length
  2. Subdomain Depth
  3. IP-Literal Host Flag
  4. At-Symbol (`@`) Presence
  5. HTTPS Protocol Flag
  6. Threat Keyword Density
  7. Shannon Entropy of Hostname

### Measured Performance on Held-Out Split (47,159 URLs)

| Evaluation Metric | Measured Result | Benchmark Standard |
| :--- | :---: | :---: |
| **Accuracy** | **91.06%** | High overall fidelity |
| **Precision** | **90.08%** | Low false-positive rate |
| **Recall** | **94.81%** | Catches 9.5 out of 10 phishing URLs |
| **F1-Score** | **92.39%** | Robust harmonic mean |
| **Inference Latency** | **< 1.5 ms** | In-process pure TypeScript arithmetic |

> **Note:** The weights and scaling factors are committed in `lib/ml/weights.json`. Feature extraction in `lib/ml/features.ts` operates with 100% mathematical parity to the Python training pipeline (`scripts/train_model.py`).

---

## 🖥️ SOC Threat Intelligence Suite

The administrative console provides Security Operations Center (SOC) analysts with deep threat telemetry across three dedicated interfaces:

### 1. Threat Scans Audit Log (`/admin/scans`)
- **Telemetry KPIs:** Real-time Interceptions counter, High-Risk Rate, Anomalies, and Vector split.
- **SVG Activity Streamgraph:** Custom mathematical Bezier area curves visualizing 7-day threat trends (Safe, Suspicious, High Risk).
- **Sliding Threat Drawer:** Click any scan to slide out deep forensic telemetry: raw inputs, vendor verdicts, rules fired, and ML confidence.
- **Debounced Multi-Field Search:** Real-time 300ms debounced search matching target URLs, user accounts, and incident UUIDs without server thrashing.
- **Secure CSV Export:** 1-click forensic dossier download with built-in CSV formula injection neutralization (CWE-1236).

### 2. Detection Keywords & IOC Manager (`/admin/keywords`)
- **Fleet Metrics:** Active Signatures count, Average Heuristic Density, Primary Vector distribution, and Engine Sensitivity Index.
- **Signature Forge:** Deploy new detection keywords with an interactive 1–40 pts weight slider color-coded by impact tier (Cyan `1–15`, Amber `16–25`, Rose `26–40`).
- **Live Rule Engine Sandbox:** Real-time client simulation sandbox allowing analysts to test sample emails or URLs and view instant keyword trigger matches and point scores with zero latency.
- **Signature Catalog Table:** Full-width grid with one-click category filter pills (`All`, `Urgency`, `Financial`, `Credential Theft`, etc.) and glowing progress bars.

### 3. Zero Trust User Directory (`/admin/users`)
- **Privilege Separation:** Distinguishes root administrator authority from standard tenant accounts.
- **Threat Activity Vectors:** Segmented visual telemetry illustrating the proportion of safe, suspicious, and high-risk scans triggered per user.
- **User Threat Profile Drawer:** Slide-out identity sheet showing individual user threat exposure, account metadata, and a live feed of their last 5 scans with direct cross-links into the SOC audit log.
- **Zero-Allocation Aggregation:** Backend queries utilize lightweight `head: true` count queries, preventing in-memory row dumps and out-of-memory bottlenecks.

---

## 🔒 Security & Threat Containment

1. **Server-Side RBAC Enforcement:**
   - Every `/api/admin/*` endpoint and `(admin)` page re-validates the user's role against the Supabase database using `requireAdmin.ts`. Client-side JWT role claims are never trusted.
2. **Row-Level Security (RLS):**
   - The `scans` table enforces strict per-user tenant isolation. Users can only query their own historical scans; SOC administrators access global telemetry exclusively through authenticated service-role clients.
3. **SSRF & Cloud Metadata Defense:**
   - Blocks private IP ranges (RFC 1918 `10.x`, `172.16.x`, `192.168.x`), loopbacks (`127.0.0.1`, `::1`), mapped IPv6 (`::ffff:127.x`), and **Cloud Instance Metadata Endpoints** (`169.254.169.254`, `metadata.google.internal`).
4. **CSV Formula Injection Mitigation (CWE-1236):**
   - Forensic export cells starting with dangerous trigger characters (`=`, `+`, `-`, `@`, `\t`, `\r`) are automatically neutralized with single-quote escaping prior to CSV generation.
5. **Zero-Day Cache Poisoning Prevention:**
   - URLs with no previous threat index (404) are assigned an accelerated 15-minute TTL rather than 24 hours, preventing long-term blind spots against newly deployed phishing infrastructure.
6. **XSS Containment:**
   - Raw user inputs, phishing payloads, and email lures rendered in user and admin tables are strictly rendered as inert text nodes. Zero `dangerouslySetInnerHTML` is used.
7. **Credential Segregation:**
   - Sensitive service keys are isolated to server-only modules (`lib/supabaseServiceClient.ts`) and never bundled into client JavaScript.

---

## 🧪 Automated Testing & QA Verification

The repository includes a comprehensive, automated test suite covering unit logic, feature parity, authorization boundaries, and live end-to-end integration:

| Test Command | Scope | Cases |
| :--- | :--- | :---: |
| `node scripts/test_rules.mjs` | URL heuristics, SSRF cloud metadata, score bands, overrides | 29 Passed |
| `node scripts/test_email_rules.mjs` | Email social engineering, credential harvesting, anchor checks | 6 Passed |
| `node scripts/verify_features.mjs` | Mathematical feature parity (TypeScript inference vs Python training) | 5 Passed |
| `node scripts/test_admin_auth.mjs` | Admin RBAC security boundaries, unauth (401), non-admin (403) | 5 Passed |
| `node scripts/qa_audit.mjs` | Live end-to-end system test: routes, unauth redirects, scan execution | 25 Passed |
| `npx tsc --noEmit` | Strict full-project TypeScript compilation | 0 Errors |

To execute the core test suites locally:
```bash
# 1. Verify URL heuristics & SSRF guards (29 tests)
node scripts/test_rules.mjs

# 2. Verify Email social engineering rules (6 tests)
node scripts/test_email_rules.mjs

# 3. Verify ML feature extraction parity (5 tests)
node scripts/verify_features.mjs

# 4. Run TypeScript strict type-check
npx tsc --noEmit
```

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory. Use the template below with your own service credentials:

```bash
# ── Supabase Configuration (Settings → API) ───────────────────────────────────
# Public URL and Anon Key (safe for client-side bundle)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Private Service Role Key (SERVER-ONLY — Never prefix with NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here

# ── VirusTotal v3 Threat Intelligence ─────────────────────────────────────────
# Server-only API Key (from virustotal.com/gui/my-apikey)
VIRUSTOTAL_API_KEY=your-virustotal-api-key-here

# ── Optional: Google Safe Browsing v4 ─────────────────────────────────────────
# Optional fallback (leave as placeholder to use automatic graceful bypass)
SAFE_BROWSING_API_KEY=your-safe-browsing-api-key
```

> ⚠️ **Security Notice:** Never commit `.env.local` to version control. It is gitignored by default.

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js:** `>= 20.0.0` (Recommended: v20.x or v22.x LTS)
- **Package Manager:** `npm` (v10+)
- **Database:** Supabase project (Free tier or self-hosted)

### 1. Clone the Repository & Install Dependencies
```bash
git clone https://github.com/your-org/ai-phishing-detection-platform.git
cd "ai-phishing-detection-platform"
npm install
```

### 2. Database Schema Setup
Execute the SQL schema migration in your Supabase SQL Editor:
- File location: `docs/supabase-schema.sql` (Creates `profiles`, `scans`, `keywords`, and `url_intel_cache` tables with RLS policies).

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

---

## 📈 Project Status & Roadmap

| Stage / Component | Status | Details |
| :--- | :---: | :--- |
| **URL & Email Multi-Engine Scanners** | ✅ Complete | 4 independent signals, scoring engine, and sanitized rendering. |
| **Machine Learning Model** | ✅ Complete | 91.06% accuracy on PhiUSIIL dataset; in-process TypeScript inference. |
| **User Dashboard & History** | ✅ Complete | Bento Quick Scanner, telemetry cards, and history table with delete. |
| **SOC Threat Incident Console** | ✅ Complete | SVG streamgraphs, multi-vector filtering, and slide-out forensic drawer. |
| **Keyword & IOC Manager Console** | ✅ Complete | Signature Forge, 1–40 pts slider, and Live Sandbox Simulator. |
| **Zero Trust User Directory** | ✅ Complete | Root admin privilege tier, threat vectors, and user telemetry drawer. |
| **Automated Test Coverage** | ✅ Complete | 76 automated test cases covering security, logic, and integration. |
| **Production Cloud Deployment** | ⏳ **Next Milestone** | Final step: Deploying to Vercel / Cloud and binding production environment keys. |

---

## 📜 License
This project is developed for non-commercial educational and security research purposes.
