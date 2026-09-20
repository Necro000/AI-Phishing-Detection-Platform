/**
 * supabaseServiceClient.ts — SERVER-ONLY MODULE
 *
 * Reads SUPABASE_SERVICE_ROLE_KEY — never import this in 'use client' files,
 * Client Components, or any module that gets bundled for the browser.
 *
 * Safe import locations:
 *   - Route Handlers (app/api/route.ts files)
 *   - Server Components (no 'use client' directive)
 *   - lib/auth/requireAdmin.ts
 *
 * This module is intentionally separate from supabaseClient.ts so that
 * tree-shaking guarantees SUPABASE_SERVICE_ROLE_KEY never reaches the client
 * bundle, even if a developer accidentally imports createBrowserClient from
 * the same file.
 */

import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || (!url.startsWith('http://') && !url.startsWith('https://')) || url === 'your-supabase-project-url') {
    throw new Error('Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL in .env.local.')
  }

  if (!key || key === 'your-supabase-service-role-key') {
    throw new Error('Supabase service role key is not configured. Please set SUPABASE_SERVICE_ROLE_KEY in .env.local.')
  }

  return createClient(url, key, {
    auth: {
      // Service-role client should not persist sessions
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
