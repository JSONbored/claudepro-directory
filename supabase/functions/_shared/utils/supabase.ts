/**
 * Singleton Supabase clients and environment validation
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../database.types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

if (!(SUPABASE_URL && SUPABASE_ANON_KEY)) {
  throw new Error('Missing required environment variables: SUPABASE_URL and/or SUPABASE_ANON_KEY');
}

export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
export const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
