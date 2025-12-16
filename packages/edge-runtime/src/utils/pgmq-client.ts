/**
 * Typed pgmq_public schema client helper
 * Provides type-safe access to pgmq extension RPCs without using 'as any'
 *
 * Uses ExtendedDatabase type to properly type pgmq_public schema operations
 */

import { createClient } from '@supabase/supabase-js';
import { edgeEnv } from '@heyclaude/edge-runtime/config/env.ts';
import type {
  GetPgmqQueueMetricsArgs,
  GetPgmqQueueMetricsReturns,
} from '@heyclaude/database-types/postgres-types';
import type { ExtendedDatabase } from '@heyclaude/edge-runtime/database-extensions.types.ts';
import { normalizeError } from '@heyclaude/shared-runtime/error-handling.ts';
import { logger } from '@heyclaude/edge-runtime/utils/logger.ts';

const {
  supabase: { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY },
} = edgeEnv;

/**
 * Typed Supabase client for pgmq_public schema operations
 * Created separately to maintain proper typing for extension schemas
 */
const pgmqSupabaseClient = createClient<ExtendedDatabase>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Untyped Supabase client for public schema RPC operations
 * Uses Prisma postgres-types for function signatures instead of Database type
 */
const publicSchemaClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * Type-safe wrapper for pgmq_public.send RPC
 */
export async function pgmqSend(
  queueName: string,
  msg: Record<string, unknown>,
  options?: { sleepSeconds?: number }
): Promise<{ msg_id: bigint } | null> {
  const { data, error } = await pgmqSupabaseClient.schema('pgmq_public').rpc('send', {
    queue_name: queueName,
    message: msg,
    sleep_seconds: options?.sleepSeconds ?? 0,
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
 * Uses Prisma-generated postgres-types for function signatures
 */
export async function pgmqMetrics(queueName: string): Promise<{
  queue_length: number;
  newest_msg_age_sec: number | null;
  oldest_msg_age_sec: number | null;
} | null> {
  try {
    // Use wrapper function in public schema (get_pgmq_queue_metrics)
    // This function calls pgmq.metrics internally and is exposed via PostgREST
    // Uses Prisma-generated postgres-types
    const args: GetPgmqQueueMetricsArgs = { p_queue_name: queueName };

    // Call RPC
    const rpcResult = await publicSchemaClient.rpc('get_pgmq_queue_metrics', args);

    if (rpcResult.error) throw rpcResult.error;

    // Function returns array with single row: { queue_length, newest_msg_age_sec, oldest_msg_age_sec }[]
    // Validate data structure matches Returns type
    const data = rpcResult.data;
    if (!(data && Array.isArray(data))) {
      return null;
    }

    // Validate each result has the expected structure
    const results = data.filter((item): item is GetPgmqQueueMetricsReturns[number] => {
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
      return typeof queueLength === 'number' || queueLength === null;
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
    const errorObj = normalizeError(error, 'Failed to get queue metrics');
    logger.warn(`Failed to get metrics for queue '${queueName}'`, {
      err: errorObj,
    });
    return null;
  }
}
