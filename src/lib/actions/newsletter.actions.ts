'use server';

/**
 * Newsletter Server Actions
 * Secure server-side RPC calls for newsletter operations
 * All actions use rateLimitedAction for automatic error logging, rate limiting, and consistent error handling
 */

import { z } from 'zod';
import { rateLimitedAction } from '@/src/lib/actions/safe-action';
import { getNewsletterSubscriberCount } from '@/src/lib/data/newsletter';
import { env } from '@/src/lib/schemas/env.schema';

/**
 * Get newsletter subscriber count with edge caching
 * Cached for 5 minutes (controlled by cache.newsletter_count_ttl_s)
 */
export const getNewsletterCountAction = rateLimitedAction
  .schema(z.object({}))
  .metadata({ actionName: 'newsletter.getCount', category: 'analytics' })
  .action(async () => {
    const count = await getNewsletterSubscriberCount();
    return count ?? null;
  });

/**
 * Subscribe a freshly authenticated OAuth user to the newsletter
 * Mirrors the client-side edge call but keeps secrets server-side
 */
const subscribeViaOAuthSchema = z.object({
  email: z.string().email('Invalid email address'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const subscribeViaOAuthAction = rateLimitedAction
  .schema(subscribeViaOAuthSchema)
  .metadata({ actionName: 'newsletter.subscribeViaOAuth', category: 'form' })
  .action(async ({ parsedInput }) => {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
      throw new Error('Supabase URL not configured');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/email-handler`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Email-Action': 'subscribe',
      },
      body: JSON.stringify({
        email: parsedInput.email,
        source: 'oauth_signup',
        ...(parsedInput.metadata || {}),
      }),
      cache: 'no-store',
      // Edge functions can take a moment when cold-starting
      next: { revalidate: 0 },
    });

    const result = (await response.json()) as { success?: boolean; error?: string };

    if (!(response.ok && result?.success)) {
      const errorMessage = result?.error || response.statusText || 'Unknown error';
      throw new Error(errorMessage);
    }

    return { success: true };
  });
