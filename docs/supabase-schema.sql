-- =============================================================================
-- AI Phishing Detection Platform — Supabase Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Architecture.md §3 — frozen schema, do not modify without human sign-off
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. profiles (extends auth.users, 1:1, role management)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Trigger: auto-create a profile row on every new signup
-- role is always 'user' — admin promotion is a manual DB action only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS: users can read their own profile only; no write access from client
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- No INSERT/UPDATE/DELETE policies for profiles — only the trigger inserts rows,
-- and role changes are manual DB actions (Architecture.md §3).

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. scans
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type   text NOT NULL CHECK (scan_type IN ('url', 'email')),
  input       text NOT NULL,
  risk_level  text NOT NULL CHECK (risk_level IN ('SAFE', 'SUSPICIOUS', 'HIGH_RISK')),
  risk_score  integer NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  reasons     jsonb NOT NULL DEFAULT '[]'::jsonb,
  signals     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: users see only their own scans; admin routes bypass via service-role client
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own scans"
  ON public.scans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scans"
  ON public.scans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE/DELETE — scan history is immutable from client side

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. keywords (admin-managed, read by rule engine at request time)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.keywords (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword     text NOT NULL UNIQUE,
  weight      integer NOT NULL DEFAULT 10 CHECK (weight > 0),
  category    text NOT NULL DEFAULT 'scam_generic',
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: authenticated users can read keywords (rule engine needs them at scan time)
-- Only service-role client (admin routes) can write
ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read keywords"
  ON public.keywords FOR SELECT
  TO authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE client policies — admin API routes use service-role client

-- Seed: default keyword set so the rule engine works even before admin tunes it
INSERT INTO public.keywords (keyword, weight, category) VALUES
  ('verify your account', 15, 'account_action'),
  ('click here immediately', 12, 'urgency'),
  ('your account has been suspended', 15, 'account_action'),
  ('enter your password', 15, 'credential_request'),
  ('confirm your details', 12, 'credential_request'),
  ('you have won', 12, 'scam_generic'),
  ('claim your prize', 12, 'scam_generic'),
  ('urgent action required', 15, 'urgency'),
  ('limited time offer', 10, 'urgency'),
  ('bank account', 10, 'financial_threat'),
  ('wire transfer', 12, 'financial_threat'),
  ('update payment information', 15, 'financial_threat'),
  ('social security', 15, 'credential_request'),
  ('login credentials', 15, 'credential_request'),
  ('free gift', 10, 'scam_generic')
ON CONFLICT (keyword) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. url_intel_cache (VirusTotal lookup cache — shared across all users)
-- Architecture.md §3: TTL enforced in app code (virusTotal.ts), not a DB job.
-- RLS enabled with zero policies (default-deny) — service-role bypasses RLS.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.url_intel_cache (
  url_hash           text PRIMARY KEY,
  virustotal_result  jsonb NOT NULL,
  fetched_at         timestamptz NOT NULL DEFAULT now()
);

-- RLS on with zero policies = default-deny for any non-service-role access
-- Service-role client bypasses RLS regardless (Architecture.md §3)
ALTER TABLE public.url_intel_cache ENABLE ROW LEVEL SECURITY;
-- (No policies created intentionally — see Architecture.md §3)

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes for query performance
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS scans_user_id_created_at_idx
  ON public.scans (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS scans_created_at_idx
  ON public.scans (created_at DESC);  -- for admin all-scans view

CREATE INDEX IF NOT EXISTS keywords_category_idx
  ON public.keywords (category);
