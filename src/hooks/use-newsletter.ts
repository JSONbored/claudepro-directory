/**
 * Newsletter Subscription Hook - Client-side state management for newsletter forms
 * Calls Supabase Edge Function directly for better observability
 */

'use client';

import { useCallback, useState, useTransition } from 'react';
import { trackInteraction } from '@/src/lib/edge/client';
import { logger } from '@/src/lib/logger';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Enums } from '@/src/types/database.types';

export type NewsletterSource = Enums<'newsletter_source'>;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export interface UseNewsletterOptions {
  source: NewsletterSource;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorTitle?: string;
  showToasts?: boolean;
  /** Optional metadata for contextual tracking (copy actions, campaigns, etc.) */
  metadata?: {
    copy_type?: string;
    copy_category?: string;
    copy_slug?: string;
    [key: string]: unknown;
  };
  /** Optional context for error logging (variant, component-specific metadata) */
  logContext?: Record<string, unknown>;
}

export interface UseNewsletterReturn {
  email: string;
  setEmail: (email: string) => void;
  isSubmitting: boolean;
  subscribe: () => Promise<void>;
  reset: () => void;
  error: string | null;
}

export function useNewsletter(options: UseNewsletterOptions): UseNewsletterReturn {
  const {
    source,
    onSuccess,
    onError,
    successMessage = "You're now subscribed to our newsletter.",
    errorTitle = 'Subscription failed',
    showToasts = true,
    metadata,
    logContext,
  } = options;

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const reset = useCallback(() => {
    setEmail('');
    setError(null);
  }, []);

  const subscribe = useCallback(async () => {
    if (!email) {
      const errorMsg = 'Please enter your email address';
      setError(errorMsg);
      if (showToasts) toasts.error.validation(errorMsg);
      onError?.(errorMsg);
      return;
    }

    setError(null);

    startTransition(async () => {
      try {
        const referrer = typeof window !== 'undefined' ? window.location.href : undefined;

        if (!SUPABASE_URL) {
          throw new Error('Supabase URL not configured');
        }

        const response = await fetch(`${SUPABASE_URL}/functions/v1/email-handler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Email-Action': 'subscribe',
          },
          body: JSON.stringify({
            email,
            source,
            ...(referrer && { referrer }),
            ...(metadata && metadata),
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          if (showToasts) {
            toasts.raw.success('Welcome!', {
              description: successMessage,
            });
          }

          trackInteraction({
            content_type: null,
            content_slug: null,
            interaction_type: 'newsletter_subscribe',
            metadata: {
              source,
              subscription_id: result.subscription_id,
              ...(referrer && { referrer }),
              ...(metadata && metadata),
            },
          }).catch(() => {
            // Analytics failure should not affect UX
          });

          reset();
          onSuccess?.();
        } else {
          const errorMessage = result.message || result.error || 'Please try again later.';

          setError(errorMessage);

          if (showToasts) {
            toasts.raw.error(errorTitle, {
              description: errorMessage,
            });
          }

          onError?.(errorMessage);

          logger.error('Newsletter subscription failed', new Error(errorMessage), {
            component: 'useNewsletter',
            source,
            email: `${email.substring(0, 3)}***`,
            status: response.status,
            ...logContext,
          });
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';

        setError(errorMessage);

        if (showToasts) {
          toasts.raw.error(errorTitle, {
            description: errorMessage,
          });
        }

        onError?.(errorMessage);

        logger.error('Newsletter subscription error', err instanceof Error ? err : undefined, {
          component: 'useNewsletter',
          source,
          ...logContext,
        });
      }
    });
  }, [
    email,
    source,
    onSuccess,
    onError,
    successMessage,
    errorTitle,
    showToasts,
    reset,
    metadata,
    logContext,
  ]);

  return {
    email,
    setEmail,
    isSubmitting: isPending,
    subscribe,
    reset,
    error,
  };
}
