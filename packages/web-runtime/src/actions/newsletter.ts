'use server';

import { z } from 'zod';
import { getEnvVar } from '@heyclaude/shared-runtime';
import { rateLimitedAction } from './safe-action.ts';
// import { getNewsletterSubscriberCount } from '../data/newsletter.ts'; // Lazy loaded

export const getNewsletterCountAction = rateLimitedAction
  .inputSchema(z.object({}))
  .metadata({ actionName: 'newsletter.getCount', category: 'analytics' })
  .action(async () => {
    const { getNewsletterSubscriberCount } = await import('../data/newsletter.ts');
    const count = await getNewsletterSubscriberCount();
    return count ?? null;
  });

const subscribeViaOAuthSchema = z.object({
  email: z.string().refine(
    (val) => {
      const parts = val.split('@');
      if (parts.length !== 2) return false;
      const [local, domain] = parts;
      if (!local || !domain) return false;
      if (!domain.includes('.')) return false;
      if (val.includes(' ')) return false;
      return true;
    },
    { message: 'Invalid email address' }
  ),
  metadata: z
    .object({
      referrer: z
        .string()
        .refine(
          (url) => {
            try {
              new URL(url);
              return true;
            } catch {
              return false;
            }
          },
          { message: 'Invalid URL format' }
        )
        .optional(),
      trigger_source: z.enum(['auth_callback']).optional(),
    })
    .optional(),
});

export const subscribeViaOAuthAction = rateLimitedAction
  .inputSchema(subscribeViaOAuthSchema)
  .metadata({ actionName: 'newsletter.subscribeViaOAuth', category: 'form' })
  .action(async ({ parsedInput }) => {
    const supabaseUrl = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');

    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
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
        ...(parsedInput.metadata ?? {}),
      }),
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    const result = (await response.json()) as { success?: boolean; error?: string };

    if (!(response.ok && result?.success)) {
      const errorMessage = result?.error || response.statusText || 'Unknown error';
      throw new Error(errorMessage);
    }

    return { success: true };
  });
