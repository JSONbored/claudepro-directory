/**
 * Newsletter Subscription Hook - Client-side state management for newsletter forms
 * Calls Supabase Edge Function directly for better observability
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { getNewsletterConfig } from '@heyclaude/web-runtime/config/static-configs';
import { logClientWarning, logger, normalizeError } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { toasts } from '@heyclaude/web-runtime/ui';
import { useCallback, useMemo, useState, useTransition } from 'react';

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL'];

// Default retry configuration (actual values loaded from static config per hook instance)
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;
const DEFAULT_RETRY_BACKOFF_MULTIPLIER = 2;

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  backoffMultiplier: number;
}

/**
 * Retry helper with exponential backoff
 * Only retries on network errors or 5xx server errors
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retryConfig: RetryConfig,
  retries = retryConfig.maxRetries
): Promise<Response> {
  try {
    const response = await fetch(url, options);

    // Don't retry on client errors (4xx) - these are user/validation errors
    if (!response.ok && response.status >= 400 && response.status < 500) {
      return response;
    }

    // Retry on server errors (5xx)
    if (!response.ok && response.status >= 500 && retries > 0) {
      const delay = retryConfig.initialDelayMs * retryConfig.backoffMultiplier ** (retryConfig.maxRetries - retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryConfig, retries - 1);
    }

    return response;
  } catch (error) {
    // Retry on network errors
    if (retries > 0) {
      const delay = retryConfig.initialDelayMs * retryConfig.backoffMultiplier ** (retryConfig.maxRetries - retries);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retryConfig, retries - 1);
    }
    const normalized = normalizeError(error, 'fetchWithRetry: request failed');
    logger.error('fetchWithRetry: request failed', normalized, {
      url,
      attempt: retryConfig.maxRetries - retries + 1,
    });
    throw error;
  }
}

export interface UseNewsletterOptions {
  source: Database['public']['Enums']['newsletter_source'];
  onSuccess?: () => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorTitle?: string;
  showToasts?: boolean;
  /** Optional metadata for contextual tracking (copy actions, campaigns, etc.) */
  metadata?: {
    copy_type?: Database['public']['Enums']['copy_type'];
    copy_category?: Database['public']['Enums']['content_category'];
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

  // Load retry config from static defaults (synchronous, per-hook instance)
  const retryConfig = useMemo(() => {
    try {
      const config = getNewsletterConfig();
      return {
        maxRetries: config['newsletter.max_retries'] ?? DEFAULT_MAX_RETRIES,
        initialDelayMs: config['newsletter.initial_retry_delay_ms'] ?? DEFAULT_INITIAL_RETRY_DELAY_MS,
        backoffMultiplier: config['newsletter.retry_backoff_multiplier'] ?? DEFAULT_RETRY_BACKOFF_MULTIPLIER,
      };
    } catch (error) {
      logClientWarning('useNewsletter: failed to load retry config', error);
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

        // Normalize email
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

          const normalized = normalizeError(errorMessage, 'Newsletter subscription failed');
          logger.error('Newsletter subscription failed', normalized, {
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
