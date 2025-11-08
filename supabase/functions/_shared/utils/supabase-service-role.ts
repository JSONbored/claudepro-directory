/**
 * Singleton Supabase service role client and environment exports
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../database.types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)) {
  throw new Error(
    'Missing required environment variables: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY'
  );
}

export const supabaseServiceRole = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
export const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
