/**
 * Newsletter Subscription Hook - Client-side state management for newsletter forms
 * Calls Supabase Edge Function directly for better observability
 */

'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePulse } from '@/src/hooks/use-pulse';
import { getNewsletterConfig } from '@/src/lib/actions/feature-flags.actions';
import { logger } from '@/src/lib/logger';
import { logClientWarning } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { NewsletterSource } from '@/src/types/database-overrides';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Retry configuration (loaded from Statsig via server action)
let MAX_RETRIES = 3;
let INITIAL_RETRY_DELAY_MS = 1000;
let RETRY_BACKOFF_MULTIPLIER = 2;

/**
 * Retry helper with exponential backoff
 * Only retries on network errors or 5xx server errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Don't retry on client errors (4xx) - these are user/validation errors
    if (!response.ok && response.status >= 400 && response.status < 500) {
      return response;
    }

    // Retry on server errors (5xx)
    if (!response.ok && response.status >= 500 && retries > 0) {
      const delay = INITIAL_RETRY_DELAY_MS * RETRY_BACKOFF_MULTIPLIER ** (MAX_RETRIES - retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  } catch (error) {
    // Retry on network errors
    if (retries > 0) {
      const delay = INITIAL_RETRY_DELAY_MS * RETRY_BACKOFF_MULTIPLIER ** (MAX_RETRIES - retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }
    logger.error('fetchWithRetry: request failed', error as Error, {
      url,
      attempt: MAX_RETRIES - retries + 1,
    });
    throw error;
  }
}

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
  const pulse = usePulse();

  // Load retry config from Statsig on mount
  useEffect(() => {
    getNewsletterConfig({})
      .then((result) => {
        if (result?.data) {
          const config = result.data;
          MAX_RETRIES = config['newsletter.max_retries'];
          INITIAL_RETRY_DELAY_MS = config['newsletter.initial_retry_delay_ms'];
          RETRY_BACKOFF_MULTIPLIER = config['newsletter.retry_backoff_multiplier'];
        }
      })
      .catch((error) => {
        logClientWarning('useNewsletter: failed to load retry config', error, {
          source,
          hook: 'useNewsletter',
        });
      });
  }, [source]);

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

        // Normalize email
        const normalizedEmail = email.toLowerCase().trim();

        const response = await fetchWithRetry(`${SUPABASE_URL}/functions/v1/email-handler`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Email-Action': 'subscribe',
          },
          body: JSON.stringify({
            email: normalizedEmail,
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

          // Track newsletter signup success
          Promise.all([
            pulse.newsletter({
              event: 'subscribe',
              metadata: {
                source,
                subscription_id: result.subscription_id,
                ...(referrer && { referrer }),
                ...(metadata && metadata),
              },
            }),
            pulse.newsletter({
              event: 'signup_success',
              metadata: {
                source,
                ...metadata,
              },
            }),
          ]).catch((error) => {
            logClientWarning('useNewsletter: signup success tracking failed', error, {
              source,
              email: normalizedEmail,
              subscriptionId: result.subscription_id,
            });
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

          // Track newsletter signup error
          pulse
            .newsletter({
              event: 'signup_error',
              metadata: {
                source,
                error: errorMessage,
                ...metadata,
              },
            })
            .catch((error) => {
              logClientWarning('useNewsletter: signup error tracking failed', error, { source });
            });

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

        // Track newsletter signup error (exception)
        pulse
          .newsletter({
            event: 'signup_error',
            metadata: {
              source,
              error: errorMessage,
              ...metadata,
            },
          })
          .catch((error) => {
            logClientWarning('useNewsletter: exception tracking failed', error, { source });
          });

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
    pulse,
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
