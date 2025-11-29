/**
 * Newsletter Subscription Hook
 *
 * Client-side state management for newsletter subscription forms.
 * Calls Supabase Edge Function directly with retry logic and analytics tracking.
 *
 * @example
 * ```tsx
 * function NewsletterForm() {
 *   const { email, setEmail, subscribe, isSubmitting, error } = useNewsletter({
 *     source: 'footer',
 *     onSuccess: () => console.log('Subscribed!'),
 *   });
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); subscribe(); }}>
 *       <input value={email} onChange={(e) => setEmail(e.target.value)} />
 *       <button disabled={isSubmitting}>Subscribe</button>
 *       {error && <p>{error}</p>}
 *     </form>
 *   );
 * }
 * ```
 *
 * @module web-runtime/hooks/use-newsletter
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { env } from '@heyclaude/shared-runtime/schemas/env';
import { fetchWithRetry, type FetchRetryConfig } from '../client.ts';
import { getNewsletterConfig } from '../config/static-configs.ts';
import { logClientError, logClientWarn } from '../utils/client-logger.ts';
import { usePulse } from './use-pulse.ts';
import { toasts } from '../client/toast.ts';
import { useCallback, useMemo, useState, useTransition } from 'react';

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;

// Default retry configuration
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;
const DEFAULT_RETRY_BACKOFF_MULTIPLIER = 2;

/** Options for useNewsletter hook */
export interface UseNewsletterOptions {
  /** Source identifier for tracking where signup originated */
  source: Database['public']['Enums']['newsletter_source'];
  /** Callback on successful subscription */
  onSuccess?: () => void;
  /** Callback on subscription error */
  onError?: (error: string) => void;
  /** Custom success message */
  successMessage?: string;
  /** Custom error title */
  errorTitle?: string;
  /** Whether to show toast notifications */
  showToasts?: boolean;
  /** Optional metadata for contextual tracking */
  metadata?: {
    copy_type?: Database['public']['Enums']['copy_type'];
    copy_category?: Database['public']['Enums']['content_category'];
    copy_slug?: string;
    [key: string]: unknown;
  };
  /** Optional context for error logging */
  logContext?: Record<string, unknown>;
}

/** Return type for useNewsletter hook */
export interface UseNewsletterReturn {
  /** Current email value */
  email: string;
  /** Set email value */
  setEmail: (email: string) => void;
  /** Whether subscription is in progress */
  isSubmitting: boolean;
  /** Submit subscription */
  subscribe: () => Promise<void>;
  /** Reset form state */
  reset: () => void;
  /** Current error message */
  error: string | null;
}

/**
 * Hook for managing newsletter subscription state
 * @param options - Configuration options
 * @returns Object with form state and control functions
 */
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

  // Load retry config from static defaults
  const retryConfig: FetchRetryConfig = useMemo(() => {
    try {
      const config = getNewsletterConfig();
      return {
        maxRetries: config['newsletter.max_retries'] ?? DEFAULT_MAX_RETRIES,
        initialDelayMs: config['newsletter.initial_retry_delay_ms'] ?? DEFAULT_INITIAL_RETRY_DELAY_MS,
        backoffMultiplier: config['newsletter.retry_backoff_multiplier'] ?? DEFAULT_RETRY_BACKOFF_MULTIPLIER,
      };
    } catch (configError: unknown) {
      logClientWarn('useNewsletter: failed to load retry config', configError, 'useNewsletter.loadConfig');
      return {
        maxRetries: DEFAULT_MAX_RETRIES,
        initialDelayMs: DEFAULT_INITIAL_RETRY_DELAY_MS,
        backoffMultiplier: DEFAULT_RETRY_BACKOFF_MULTIPLIER,
      };
    }
  }, []);

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

        const normalizedEmail = email.toLowerCase().trim();

        const response = await fetchWithRetry(
          `${SUPABASE_URL}/functions/v1/email-handler`,
          {
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
          },
          retryConfig
        );

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
          ]).catch((trackingError: unknown) => {
            logClientWarn('useNewsletter: signup success tracking failed', trackingError, 'useNewsletter.trackSuccess', {
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
            .catch((trackingError: unknown) => {
              logClientWarn('useNewsletter: signup error tracking failed', trackingError, 'useNewsletter.trackError', { source });
            });

          logClientError('Newsletter subscription failed', errorMessage, 'useNewsletter.subscribe', {
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
          .catch((trackingError: unknown) => {
            logClientWarn('useNewsletter: exception tracking failed', trackingError, 'useNewsletter.trackException', { source });
          });

        logClientError('Newsletter subscription error', err, 'useNewsletter.subscribe', {
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
    retryConfig,
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
