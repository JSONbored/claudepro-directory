/**
 * Shared Pulse Utilities
 * Queue-based analytics tracking for optimal egress reduction
 */

import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/client';
import type { Json } from '@/src/types/database.types';

const PULSE_QUEUE_NAME = 'user_interactions';

/**
 * Enqueue pulse event to Supabase Queue
 * Fire-and-forget, non-blocking - worker processes in batches
 * Uses type assertion to access pgmq_public schema (not in generated types)
 */
export async function enqueuePulseEvent(event: {
  user_id?: string | null;
  content_type: string | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  try {
    const supabase = await createClient();
    // Type assertion needed - pgmq_public schema not in generated types
    // RLS is enabled, so anon/authenticated roles can access pgmq_public.send
    const pgmqClient = (
      supabase as unknown as {
        schema: (schema: string) => {
          rpc: (
            name: string,
            args: Record<string, unknown>
          ) => Promise<{
            data: unknown;
            error: { message: string } | null;
          }>;
        };
      }
    ).schema('pgmq_public');

    const { error } = await pgmqClient.rpc('send', {
      queue_name: PULSE_QUEUE_NAME,
      msg: {
        user_id: event.user_id ?? null,
        content_type: event.content_type ?? null,
        content_slug: event.content_slug ?? null,
        interaction_type: event.interaction_type,
        session_id: event.session_id ?? null,
        metadata: event.metadata ?? null,
      },
    });

    if (error) {
      // Log but don't throw - pulse is best-effort
      logger.warn('Failed to enqueue pulse event', {
        error: error.message,
        interaction_type: event.interaction_type,
        content_type: event.content_type ?? 'unknown',
      });
    }
  } catch (error) {
    // Silent fail - pulse is best-effort, don't block user actions
    logger.warn('Pulse event enqueue exception', {
      error: error instanceof Error ? error.message : String(error),
      interaction_type: event.interaction_type,
    });
  }
}
