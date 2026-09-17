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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Browser / Client Component client — uses anon key, subject to RLS.
 * Safe to call from client-side code.
 */
export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey)
}
