/**
 * Typed pgmq_public schema client helper
 * Provides type-safe access to pgmq extension RPCs without using 'as any'
 *
 * Uses ExtendedDatabase type to properly type pgmq_public schema operations
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { edgeEnv } from '../config/env.ts';
import type { Database as DatabaseGenerated } from '../database.types.ts';
import type { ExtendedDatabase } from '../database-extensions.types.ts';
import { errorToString } from './error-handling.ts';

const {
  supabase: { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY },
} = edgeEnv;

/**
 * Typed Supabase client for pgmq_public schema operations
 * Created separately to maintain proper typing for extension schemas
 */
const pgmqSupabaseClient = createClient<ExtendedDatabase>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Typed Supabase client for public schema RPC operations
 * Uses generated Database type from database.types.ts (ONLY generated types)
 */
const publicSchemaClient = createClient<DatabaseGenerated>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Type-safe wrapper for pgmq_public.send RPC
 */
export async function pgmqSend(
  queueName: string,
  msg: Record<string, unknown>
): Promise<{ msg_id: bigint } | null> {
  const { data, error } = await pgmqSupabaseClient.schema('pgmq_public').rpc('send', {
    queue_name: queueName,
    msg,
  });

  if (error) throw error;
  return data;
}

/**
 * Type-safe wrapper for pgmq_public.read RPC
 */
export async function pgmqRead(
  queueName: string,
  options?: { sleep_seconds?: number; n?: number }
): Promise<Array<{
  msg_id: bigint;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: Record<string, unknown>;
}> | null> {
  const { data, error } = await pgmqSupabaseClient.schema('pgmq_public').rpc('read', {
    queue_name: queueName,
    sleep_seconds: options?.sleep_seconds,
    n: options?.n,
  });

  if (error) throw error;
  return data;
}

/**
 * Type-safe wrapper for pgmq_public.delete RPC
 */
export async function pgmqDelete(queueName: string, msgId: bigint): Promise<boolean | null> {
  const { data, error } = await pgmqSupabaseClient.schema('pgmq_public').rpc('delete', {
    queue_name: queueName,
    message_id: msgId, // pgmq.delete uses 'message_id' not 'msg_id'
  });

  if (error) throw error;
  return data;
}

/**
 * Type-safe wrapper for pgmq.metrics RPC
 * Returns queue metrics including queue_length for smart polling
 * Uses public.get_pgmq_queue_metrics wrapper function (calls pgmq.metrics internally)
 * This wrapper is needed because PostgREST doesn't expose pgmq schema directly
 *
 * Uses generated types from database.types.ts via Database type
 */
export async function pgmqMetrics(queueName: string): Promise<{
  queue_length: number;
  newest_msg_age_sec: number | null;
  oldest_msg_age_sec: number | null;
} | null> {
  try {
    // Use wrapper function in public schema (get_pgmq_queue_metrics)
    // This function calls pgmq.metrics internally and is exposed via PostgREST
    // Uses ONLY generated types from database.types.ts
    type Args = DatabaseGenerated['public']['Functions']['get_pgmq_queue_metrics']['Args'];
    type Returns = DatabaseGenerated['public']['Functions']['get_pgmq_queue_metrics']['Returns'];

    const args: Args = { p_queue_name: queueName };

    // Call RPC - use satisfies to ensure args match generated type
    const rpcResult = await publicSchemaClient.rpc('get_pgmq_queue_metrics', args);

    if (rpcResult.error) throw rpcResult.error;

    // Function returns array with single row: { queue_length, newest_msg_age_sec, oldest_msg_age_sec }[]
    // Validate data structure matches Returns type
    const data = rpcResult.data;
    if (!(data && Array.isArray(data))) {
      return null;
    }

    // Validate each result has the expected structure
    const results = data.filter((item): item is Returns[number] => {
      if (typeof item !== 'object' || item === null) {
        return false;
      }
      const getProperty = (obj: unknown, key: string): unknown => {
        if (typeof obj !== 'object' || obj === null) {
          return undefined;
        }
        const desc = Object.getOwnPropertyDescriptor(obj, key);
        return desc?.value;
      };
      const queueLength = getProperty(item, 'queue_length');
      return typeof queueLength === 'number';
    });

    if (!(results && Array.isArray(results)) || results.length === 0) {
      return null;
    }

    const metrics = results[0];
    if (!metrics || typeof metrics !== 'object') {
      return null;
    }

    // Convert numeric types (may be bigint from database) to number
    return {
      queue_length: Number(metrics.queue_length ?? 0),
      newest_msg_age_sec:
        metrics.newest_msg_age_sec !== null ? Number(metrics.newest_msg_age_sec) : null,
      oldest_msg_age_sec:
        metrics.oldest_msg_age_sec !== null ? Number(metrics.oldest_msg_age_sec) : null,
    };
  } catch (error) {
    // If metrics check fails, return null (safe fallback - queue will be treated as empty)
    console.warn(`[pgmq-client] Failed to get metrics for queue '${queueName}'`, {
      error: errorToString(error),
    });
    return null;
  }
}
