/**
 * Typed pgmq_public schema client helper
 * Provides type-safe access to pgmq extension RPCs without using 'as any'
 *
 * Uses ExtendedDatabase type to properly type pgmq_public schema operations
 */

import { createClient } from 'jsr:@supabase/supabase-js@2';
import { edgeEnv } from '../config/env.ts';
import type { ExtendedDatabase } from '../database-extensions.types.ts';

const {
  supabase: { url: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY },
} = edgeEnv;

/**
 * Typed Supabase client for pgmq_public schema operations
 * Created separately to maintain proper typing for extension schemas
 */
const pgmqSupabaseClient = createClient<ExtendedDatabase>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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
