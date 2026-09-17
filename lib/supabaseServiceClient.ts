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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Service-role client — bypasses RLS.
 * ONLY use in server-side code. Never expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export function createServiceClient() {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      // Service-role client should not persist sessions
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
