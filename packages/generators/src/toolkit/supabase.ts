import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://hgtjdifxfapoltfflowc.supabase.co';

export function getSupabaseUrl(): string {
  return process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? DEFAULT_SUPABASE_URL;
}

export function getServiceRoleConfig() {
  const supabaseUrl = getSupabaseUrl();
  const serviceRoleKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY. Did you run ensureEnvVars()?');
  }

  return { supabaseUrl, serviceRoleKey };
}

export function createServiceRoleClient() {
  const { supabaseUrl, serviceRoleKey } = getServiceRoleConfig();
  // Note: Database type removed - all database queries should use Prisma services
  // This client is only for auth/storage operations if needed
  return createClient(supabaseUrl, serviceRoleKey);
}
