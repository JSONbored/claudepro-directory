import { createClient } from '@supabase/supabase-js';
import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';

const {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  site: { siteUrl: SITE_URL_VALUE },
} = edgeEnv;

// Supabase clients for auth/storage operations only (database queries use Prisma)
export const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseServiceRole = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const SITE_URL = SITE_URL_VALUE;
