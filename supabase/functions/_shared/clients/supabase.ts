import { createClient } from 'jsr:@supabase/supabase-js@2';
import { edgeEnv } from '../config/env.ts';
import type { Database as DatabaseGenerated } from '../database.types.ts';

const {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  site: { siteUrl: SITE_URL_VALUE },
} = edgeEnv;

// Use DatabaseGenerated directly for Supabase client to ensure proper RPC type inference
// The Database type from database-overrides.ts is used for helper types (Tables, RpcArgs, etc.)
// but createClient needs the exact DatabaseGenerated interface structure
export const supabaseAnon = createClient<DatabaseGenerated>(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseServiceRole = createClient<DatabaseGenerated>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const SITE_URL = SITE_URL_VALUE;
