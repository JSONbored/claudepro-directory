import { createClient } from 'jsr:@supabase/supabase-js@2';
import type { Database } from '../database.types.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL) {
  throw new Error('Missing required environment variable: SUPABASE_URL');
}
if (!SUPABASE_ANON_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_ANON_KEY');
}
if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

export const supabaseAnon = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
export const supabaseServiceRole = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
export const SITE_URL = Deno.env.get('NEXT_PUBLIC_SITE_URL') || 'https://claudepro.directory';
