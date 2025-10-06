/**
 * Supabase Browser Client
 * Used in Client Components for browser-side operations
 *
 * Security: Uses anon key (safe for client-side)
 * RLS policies enforce data access rules
 */

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
