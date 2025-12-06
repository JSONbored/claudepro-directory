'use server';

import type { Database, Json } from '@heyclaude/database-types';
import { logger } from './logger.ts';
import { normalizeError } from './errors.ts';
import { pgmqSend } from './supabase/pgmq-client.ts';
import { getAuthenticatedUser } from './auth/get-authenticated-user.ts';

const PULSE_QUEUE_NAME = 'pulse';

export interface PulseEvent {
  user_id?: string | null;
  content_type: Database['public']['Enums']['content_category'] | null;
  content_slug: string | null;
  interaction_type: string;
  session_id?: string | null;
  metadata?: Json | null;
}

/**
 * Enqueue a pulse event to the pgmq queue
 * Uses service role key via pgmqSend() for proper permissions
 */
export async function enqueuePulseEventServer(event: PulseEvent): Promise<void> {
  try {
    await pgmqSend(PULSE_QUEUE_NAME, {
      user_id: event.user_id ?? null,
      content_type: event.content_type ?? null,
      content_slug: event.content_slug ?? null,
      interaction_type: event.interaction_type,
      session_id: event.session_id ?? null,
      metadata: event.metadata ?? null,
    });
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to enqueue pulse event');
    logger.warn('Failed to enqueue pulse event', {
      err: normalized,
      interaction_type: event.interaction_type,
      content_type: event.content_type ?? 'unknown',
      ...(event.user_id && { user_id: event.user_id }),
    });
  }
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
  if (!query.trim()) {
    return;
  }

  try {
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
    const normalized = normalizeError(error, 'Job search pulsing error');
    // Pino's stdSerializers.err automatically handles error serialization
    logger.warn('Job search pulsing error', { err: normalized });
  }
}

export async function pulseUserSearch(query: string, resultCount: number): Promise<void> {
  if (!query.trim()) {
    return;
  }

  try {
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
    const normalized = normalizeError(error, 'User search pulsing error');
    // Pino's stdSerializers.err automatically handles error serialization
    logger.warn('User search pulsing error', { err: normalized });
  }
}
