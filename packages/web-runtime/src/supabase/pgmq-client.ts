/**
 * PGMQ Client - Prisma Implementation
 *
 * Modernized for Prisma - uses $queryRaw to call pgmq_public schema functions.
 * PGMQ is a PostgreSQL extension for message queues.
 */

import { prisma } from '@heyclaude/data-layer';
import { normalizeError } from '@heyclaude/shared-runtime';
import { logger } from '../logging/server';

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
 * Modernized for Prisma - uses $queryRaw to call pgmq extension functions.
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
  try {
    const query = `SELECT * FROM pgmq_public.send($1, $2, $3)`;
    const result = await prisma.$queryRawUnsafe(
      query,
      queueName,
      JSON.stringify(msg),
      options?.sleepSeconds ?? 0
    ) as Array<{ msg_id: bigint }> | null;

    if (Array.isArray(result) && result.length > 0) {
      return result[0] ?? null;
    }
    return null;
  } catch (error) {
    const normalized = normalizeError(error, 'PGMQ send failed');
    logger.error({ err: normalized, queueName }, 'PGMQ send failed');
    throw normalized;
  }
}

/**
 * Type-safe wrapper for pgmq_public.read RPC
 *
 * Modernized for Prisma - uses $queryRaw to call pgmq extension functions.
 *
 * @param queueName - Name of the queue to read from
 * @param options - Read options (visibility timeout, batch size)
 * @returns Array of messages, or null if queue is empty
 */
export async function pgmqRead<T = Record<string, unknown>>(
  queueName: string,
  options?: { vt?: number; qty?: number }
): Promise<PgmqMessage<T>[] | null> {
  try {
    // pgmq_public.read uses 'sleep_seconds' (visibility timeout) and 'n' (batch size)
    const query = `SELECT * FROM pgmq_public.read($1, $2, $3)`;
    const result = await prisma.$queryRawUnsafe(
      query,
      queueName,
      options?.vt ?? 30,
      options?.qty ?? 10
    ) as Array<{
      msg_id: bigint;
      read_ct: number;
      enqueued_at: string;
      vt: string;
      message: Record<string, unknown>;
    }> | null;

    if (result && result.length > 0) {
      return result.map((msg: {
        msg_id: bigint;
        read_ct: number;
        enqueued_at: string;
        vt: string;
        message: Record<string, unknown>;
      }) => ({
        ...msg,
        message: msg.message as T,
      }));
    }

    return null;
  } catch (error) {
    const normalized = normalizeError(error, 'PGMQ read failed');
    logger.error({ err: normalized, queueName }, 'PGMQ read failed');
    throw normalized;
  }
}

/**
 * Type-safe wrapper for pgmq_public.delete RPC
 *
 * Modernized for Prisma - uses $queryRaw to call pgmq extension functions.
 *
 * @param queueName - Name of the queue
 * @param msgId - Message ID to delete
 * @returns true if deleted, false if not found, null on error
 */
export async function pgmqDelete(queueName: string, msgId: bigint): Promise<boolean | null> {
  try {
    const query = `SELECT * FROM pgmq_public.delete($1, $2)`;
    const result = await prisma.$queryRawUnsafe(
      query,
      queueName,
      msgId
    ) as Array<boolean> | null;

    if (Array.isArray(result) && result.length > 0) {
      return result[0] ?? null;
    }
    return null;
  } catch (error) {
    const normalized = normalizeError(error, 'PGMQ delete failed');
    logger.error({ err: normalized, queueName, msgId: msgId.toString() }, 'PGMQ delete failed');
    throw normalized;
  }
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
