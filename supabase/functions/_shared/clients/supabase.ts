import { createClient } from 'jsr:@supabase/supabase-js@2';
import { edgeEnv } from '../config/env.ts';
import type { Database } from '../database.types.ts';

const {
  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  site: { siteUrl: SITE_URL_VALUE },
} = edgeEnv;

export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseServiceRole = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
export const SITE_URL = SITE_URL_VALUE;
