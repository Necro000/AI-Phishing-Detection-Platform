/**
 * supabaseClient.ts — BROWSER-SAFE MODULE
 *
 * Only reads NEXT_PUBLIC_ env vars — safe to import from Client Components.
 * DO NOT add server-only env vars (SUPABASE_SERVICE_ROLE_KEY etc.) to this file.
 *
 * For server-side admin operations (bypassing RLS), import from:
 *   @/lib/supabaseServiceClient   ← server-only, never import in 'use client' files
 *
 * For Server Components / Route Handlers that need the user's RLS-scoped session,
 * use createServerClient from @supabase/ssr with cookie helpers.
 */

import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'

export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://')) || url === 'your-supabase-project-url') {
    throw new Error('Supabase is not configured yet. Please provide a valid NEXT_PUBLIC_SUPABASE_URL (e.g. https://xyz.supabase.co) in .env.local.')
  }

  if (!key || key === 'your-supabase-anon-key') {
    throw new Error('Supabase anon key is not configured. Please provide NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.')
  }

  return _createBrowserClient(url, key)
}
