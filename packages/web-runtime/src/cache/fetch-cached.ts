import { unstable_cache } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@heyclaude/database-types';
import { createSupabaseServerClient } from '../supabase/server.ts';
import { createSupabaseAnonClient } from '../supabase/server-anon.ts';
import { getCacheTtl, type CacheTtlKey } from '../cache-config.ts';
import { logger } from '../logger.ts';
import { normalizeError } from '../errors.ts';

export interface FetchCachedOptions<TResult> {
  key: string;
  tags: string[];
  ttlKey: CacheTtlKey;
  useAuth?: boolean;
  fallback: TResult;
  logMeta?: Record<string, unknown>;
}

export async function fetchCached<TResult>(
  serviceCall: (client: SupabaseClient<Database>) => Promise<TResult>,
  options: FetchCachedOptions<TResult>
): Promise<TResult> {
  const { key, tags, ttlKey, useAuth = false, fallback, logMeta } = options;
  
  const ttl = await getCacheTtl(ttlKey);
  
  return unstable_cache(
    async () => {
      try {
        const client = useAuth 
          ? await createSupabaseServerClient() 
          : createSupabaseAnonClient();
          
        // Cast to typed client
        return await serviceCall(client as unknown as SupabaseClient<Database>);
      } catch (error) {
        const normalized = normalizeError(error, `Service call failed: ${key}`);
        logger.error(`Service call failed: ${key}`, normalized, {
           key,
           ...logMeta
        });
        return fallback;
      }
    },
    [key],
    { revalidate: ttl, tags }
  )();
}
