/**
 * supabaseClient.ts
 * Two clients:
 *  - createBrowserClient  → anon key, safe for use in Client Components / browser
 *  - createServiceClient  → service-role key, SERVER ONLY — never import in client code
 *
 * For Server Components / Route Handlers that need the *user's* session (RLS-scoped),
 * use createServerClient from @supabase/ssr with cookie helpers instead.
 */

import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Browser / Client Component client — uses anon key, subject to RLS.
 * Safe to call from client-side code.
 */
export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey)
}

/**
 * Service-role client — bypasses RLS.
 * ONLY import this in server-side code (Route Handlers, Server Components, requireAdmin).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
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
