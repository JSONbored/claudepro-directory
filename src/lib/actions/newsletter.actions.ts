'use server';

/**
 * Newsletter Server Actions
 * Secure server-side RPC calls for newsletter operations
 */

import { traceMeta } from '@/src/lib/actions/action-helpers';
import { getNewsletterSubscriberCount } from '@/src/lib/data/newsletter';
import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/schemas/env.schema';

/**
 * Get newsletter subscriber count with edge caching
 * Cached for 5 minutes (controlled by cache.newsletter_count_ttl_s)
 */
export async function getNewsletterCount(): Promise<number | null> {
  try {
    return await getNewsletterSubscriberCount();
  } catch (error) {
    logger.error(
      'Error in getNewsletterCount',
      error instanceof Error ? error : new Error(String(error))
    );
    return null;
  }
}

interface SubscribeViaOAuthParams {
  email: string;
  metadata?: Record<string, unknown>;
}

interface SubscribeViaOAuthResult {
  success: boolean;
  error?: string;
  traceId?: string;
}

/**
 * Subscribe a freshly authenticated OAuth user to the newsletter
 * Mirrors the client-side edge call but keeps secrets server-side
 */
export async function subscribeViaOAuth({
  email,
  metadata,
}: SubscribeViaOAuthParams): Promise<SubscribeViaOAuthResult> {
  const trace = traceMeta({ email });
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    logger.error('subscribeViaOAuth missing NEXT_PUBLIC_SUPABASE_URL env', undefined, trace);
    return { success: false, error: 'Supabase URL not configured', traceId: trace.traceId };
  }

  if (!email?.includes('@')) {
    return { success: false, error: 'Invalid email address', traceId: trace.traceId };
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/email-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email-Action': 'subscribe',
      },
      body: JSON.stringify({
        email,
        source: 'oauth_signup',
        ...(metadata || {}),
      }),
      cache: 'no-store',
      // Edge functions can take a moment when cold-starting
      next: { revalidate: 0 },
    });

    const result = (await response.json()) as { success?: boolean; error?: string };

    if (!(response.ok && result?.success)) {
      const errorMessage = result?.error || response.statusText || 'Unknown error';
      logger.warn('subscribeViaOAuth failed', {
        status: response.status,
        error: errorMessage,
        ...trace,
      });
      return { success: false, error: errorMessage, traceId: trace.traceId };
    }

    return { success: true, traceId: trace.traceId };
  } catch (error) {
    logger.error('subscribeViaOAuth exception', error instanceof Error ? error : undefined, {
      ...trace,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe',
      traceId: trace.traceId,
    };
  }
}
