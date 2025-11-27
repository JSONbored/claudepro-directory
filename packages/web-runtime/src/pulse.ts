'use server';

import type { Database, Json } from '@heyclaude/database-types';
import { logger } from './logger.ts';
import { normalizeError } from './errors.ts';
import { createSupabaseServerClient } from './supabase/server.ts';
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

export interface RpcClient {
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

export type CreateRpcClient = () => Promise<RpcClient>;

export async function enqueuePulseEvent(
  event: PulseEvent,
  createClientFn: CreateRpcClient
): Promise<void> {
  try {
    const supabase = await createClientFn();
    const pgmqClient = supabase.schema('pgmq_public');

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
    const normalized = normalizeError(error, 'Pulse event enqueue exception');
    logger.warn('Pulse event enqueue exception', {
      error: normalized.message,
      interaction_type: event.interaction_type,
      content_type: event.content_type ?? 'unknown',
      ...(event.user_id && { user_id: event.user_id }),
    });
  }
}

export async function enqueuePulseEventServer(event: PulseEvent): Promise<void> {
  await enqueuePulseEvent(event, async () => {
    const supabase = await createSupabaseServerClient();
    // Type compatibility: SupabaseServerClient has a schema().rpc() method that matches RpcClient interface
    // The schema('public').rpc() method signature is compatible with RpcClient.schema().rpc()
    // We use a type assertion here because TypeScript doesn't recognize the structural compatibility
    return supabase as unknown as RpcClient;
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
