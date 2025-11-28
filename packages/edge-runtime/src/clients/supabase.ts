import { createClient } from '@supabase/supabase-js';
import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';
import type { Database } from '@heyclaude/database-types';

const {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  site: { siteUrl: SITE_URL_VALUE },
} = edgeEnv;

// Use Database type from @heyclaude/database-types (generated types only)
// This ensures proper type inference for RPC functions and table operations
export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseServiceRole = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const SITE_URL = SITE_URL_VALUE;
