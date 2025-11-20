'use server';

/**
 * Pulse utilities - queue-based event pulsing via pgmq
 */

import { logger } from '@/src/lib/logger';
import type { Database, Json } from '@/src/types/database.types';

const PULSE_QUEUE_NAME = 'pulse';

async function enqueueToPulseQueue(
  event: {
    user_id?: string | null;
    content_type: Database['public']['Enums']['content_category'] | null;
    content_slug: string | null;
    interaction_type: string;
    session_id?: string | null;
    metadata?: Json | null;
  },
  createClientFn: () => Promise<{
    schema: (schema: string) => {
      rpc: (
        name: string,
        args: Record<string, unknown>
      ) => Promise<{
        data: unknown;
        error: { message: string } | null;
      }>;
    };
  }>
): Promise<void> {
  try {
    const supabase = await createClientFn();
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
      logger.warn('Failed to enqueue pulse event', {
        error: error.message,
        interaction_type: event.interaction_type,
        content_type: event.content_type ?? 'unknown',
        ...(event.user_id && { user_id: event.user_id }),
      });
    }
  } catch (error) {
    logger.warn('Pulse event enqueue exception', {
      error: error instanceof Error ? error.message : String(error),
      interaction_type: event.interaction_type,
      content_type: event.content_type ?? 'unknown',
      ...(event.user_id && { user_id: event.user_id }),
    });
  }
}

export async function enqueuePulseEventServer(event: {
  user_id?: string | null;
  content_type: Database['public']['Enums']['content_category'] | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  const { createClient } = await import('@/src/lib/supabase/server');
  await enqueueToPulseQueue(event, async () => {
    const supabase = await createClient();
    return supabase as unknown as {
      schema: (schema: string) => {
        rpc: (
          name: string,
          args: Record<string, unknown>
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
  });
}

export async function pulseJobSearch(
  query: string,
  filters: {
    category?: string;
    employment?: string;
    experience?: string;
    remote?: boolean;
  },
  resultCount: number
): Promise<void> {
  if (!query.trim()) return;

  try {
    const { getAuthenticatedUser } = await import('@/src/lib/auth/get-authenticated-user');
    const { user } = await getAuthenticatedUser({ requireUser: false });

    const filtersJson = {
      ...(filters.category && filters.category !== 'all' ? { category: filters.category } : {}),
      ...(filters.employment && filters.employment !== 'any'
        ? { employment: filters.employment }
        : {}),
      ...(filters.experience && filters.experience !== 'any'
        ? { experience: filters.experience }
        : {}),
      ...(filters.remote !== undefined ? { remote: filters.remote } : {}),
      entity: 'job',
    };

    await enqueuePulseEventServer({
      user_id: user?.id ?? null,
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: null,
      metadata: {
        query: query.trim(),
        filters: Object.keys(filtersJson).length > 0 ? filtersJson : null,
        result_count: resultCount,
      },
    });
  } catch (error) {
    logger.warn('Job search pulsing error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function pulseUserSearch(query: string, resultCount: number): Promise<void> {
  if (!query.trim()) return;

  try {
    const { getAuthenticatedUser } = await import('@/src/lib/auth/get-authenticated-user');
    const { user } = await getAuthenticatedUser({ requireUser: false });

    await enqueuePulseEventServer({
      user_id: user?.id ?? null,
      content_type: null,
      content_slug: null,
      interaction_type: 'search',
      session_id: null,
      metadata: {
        query: query.trim(),
        filters: { entity: 'user' },
        result_count: resultCount,
      },
    });
  } catch (error) {
    logger.warn('User search pulsing error', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
