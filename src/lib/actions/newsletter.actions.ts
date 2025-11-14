'use server';

/**
 * Newsletter Server Actions
 * Secure server-side RPC calls for newsletter operations
 */

import { logger } from '@/src/lib/logger';
import { env } from '@/src/lib/schemas/env.schema';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';

/**
 * Get newsletter subscriber count with edge caching
 * Cached for 5 minutes (controlled by cache.newsletter_count_ttl_s)
 */
export async function getNewsletterCount(): Promise<number | null> {
  try {
    const data = await cachedRPCWithDedupe(
      'get_newsletter_subscriber_count',
      {},
      {
        tags: ['newsletter', 'stats'],
        ttlConfigKey: 'cache.newsletter_count_ttl_s',
        keySuffix: 'newsletter-count',
        useAuthClient: false, // Public endpoint
      }
    );
    return (data as number) || null;
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
}

/**
 * Subscribe a freshly authenticated OAuth user to the newsletter
 * Mirrors the client-side edge call but keeps secrets server-side
 */
export async function subscribeViaOAuth({
  email,
  metadata,
}: SubscribeViaOAuthParams): Promise<SubscribeViaOAuthResult> {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    logger.error('subscribeViaOAuth missing NEXT_PUBLIC_SUPABASE_URL env');
    return { success: false, error: 'Supabase URL not configured' };
  }

  if (!email?.includes('@')) {
    return { success: false, error: 'Invalid email address' };
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
        email,
        status: response.status,
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }

    return { success: true };
  } catch (error) {
    logger.error('subscribeViaOAuth exception', error instanceof Error ? error : undefined, {
      email,
    });
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to subscribe',
    };
  }
}
