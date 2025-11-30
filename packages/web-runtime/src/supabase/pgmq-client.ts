/**
 * Typed pgmq_public schema client helper
 * Provides type-safe access to pgmq extension RPCs
 *
 * Uses ExtendedDatabase type to properly type pgmq_public schema operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getEnvVar } from '@heyclaude/shared-runtime';
import type { ExtendedDatabase } from './database-extensions.types';

let pgmqClient: SupabaseClient<ExtendedDatabase> | null = null;

/**
 * Get or create the pgmq Supabase client
 * Uses service role key for full access to queues
 */
function getPgmqClient(): SupabaseClient<ExtendedDatabase> {
  if (!pgmqClient) {
    const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
    const serviceRoleKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing Supabase configuration for pgmq client');
    }

    pgmqClient = createClient<ExtendedDatabase>(supabaseUrl, serviceRoleKey);
  }
  return pgmqClient;
}

/**
 * Message structure returned from pgmq read operations
 */
export interface PgmqMessage<T = Record<string, unknown>> {
  msg_id: bigint;
  read_ct: number;
  enqueued_at: string;
  vt: string;
  message: T;
}

/**
 * Type-safe wrapper for pgmq_public.send RPC
 *
 * @param queueName - Name of the queue to send to
 * @param msg - Message payload (JSON-serializable object)
 * @param options - Optional parameters like sleep_seconds
 * @returns The msg_id of the enqueued message, or null on failure
 */
export async function pgmqSend(
  queueName: string,
  msg: Record<string, unknown>,
  options?: { sleepSeconds?: number }
): Promise<{ msg_id: bigint } | null> {
  const client = getPgmqClient();
  const { data, error } = await client.schema('pgmq_public').rpc('send', {
    queue_name: queueName,
    message: msg,
    sleep_seconds: options?.sleepSeconds ?? 0,
  });

  if (error) throw error;
  return data;
}

/**
 * Type-safe wrapper for pgmq_public.read RPC
 *
 * @param queueName - Name of the queue to read from
 * @param options - Read options (visibility timeout, batch size)
 * @returns Array of messages, or null if queue is empty
 */
export async function pgmqRead<T = Record<string, unknown>>(
  queueName: string,
  options?: { vt?: number; qty?: number }
): Promise<PgmqMessage<T>[] | null> {
  const client = getPgmqClient();
  // Note: pgmq_public.read uses 'sleep_seconds' (visibility timeout) and 'n' (batch size)
  const { data, error } = await client.schema('pgmq_public').rpc('read', {
    queue_name: queueName,
    sleep_seconds: options?.vt ?? 30,
    n: options?.qty ?? 10,
  });

  if (error) throw error;

  // Cast message to the expected type
  if (data) {
    return data.map((msg: { msg_id: bigint; read_ct: number; enqueued_at: string; vt: string; message: Record<string, unknown> }) => ({
      ...msg,
      message: msg.message as T,
    }));
  }

  return null;
}

/**
 * Type-safe wrapper for pgmq_public.delete RPC
 *
 * @param queueName - Name of the queue
 * @param msgId - Message ID to delete
 * @returns true if deleted, false if not found, null on error
 */
export async function pgmqDelete(queueName: string, msgId: bigint): Promise<boolean | null> {
  const client = getPgmqClient();
  const { data, error } = await client.schema('pgmq_public').rpc('delete', {
    queue_name: queueName,
    message_id: msgId,
  });

  if (error) throw error;
  return data;
}

/**
 * Delete multiple messages from a queue
 *
 * @param queueName - Name of the queue
 * @param msgIds - Array of message IDs to delete
 * @returns Number of successfully deleted messages
 */
export async function pgmqDeleteBatch(
  queueName: string,
  msgIds: bigint[]
): Promise<number> {
  let deleted = 0;

  // Process in chunks to avoid overwhelming the database
  const BATCH_SIZE = 10;
  for (let i = 0; i < msgIds.length; i += BATCH_SIZE) {
    const chunk = msgIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      chunk.map((msgId) => pgmqDelete(queueName, msgId))
    );

    deleted += results.filter(
      (r) => r.status === 'fulfilled' && r.value === true
    ).length;
  }

  return deleted;
}
