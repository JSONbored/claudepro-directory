/**
 * Newsletter Subscription Hook - Client-side state management for newsletter forms
 * Thin wrapper over subscribeToNewsletter server action with analytics tracking
 */

'use client';

import { useCallback, useState, useTransition } from 'react';
import { subscribeToNewsletter } from '@/src/lib/actions/newsletter-signup';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { logger } from '@/src/lib/logger';
import { toasts } from '@/src/lib/utils/toast.utils';

export type NewsletterSource = 'footer' | 'homepage' | 'modal' | 'content_page' | 'inline';

function getEmailSubscriptionEvent(source: NewsletterSource): string {
  const eventMap: Record<NewsletterSource, string> = {
    footer: 'email_subscribed_footer',
    homepage: 'email_subscribed_homepage',
    modal: 'email_subscribed_modal',
    content_page: 'email_subscribed_content_page',
    inline: 'email_subscribed_inline',
  };
  return eventMap[source];
}

export interface UseNewsletterOptions {
  source: NewsletterSource;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorTitle?: string;
  showToasts?: boolean;
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

        const result = await subscribeToNewsletter({
          email,
          source,
          ...(referrer && { referrer }),
        });

        if (result?.data) {
          if (showToasts) {
            toasts.raw.success('Welcome!', {
              description: successMessage,
            });
          }

          const eventName = getEmailSubscriptionEvent(source);
          trackEvent(eventName, {
            contact_id: result.data.id,
            ...(referrer && { referrer }),
          });

          reset();
          onSuccess?.();
        } else {
          const errorMessage = result?.serverError || 'Please try again later.';

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
        });
      }
    });
  }, [email, source, onSuccess, onError, successMessage, errorTitle, showToasts, reset]);

  return {
    email,
    setEmail,
    isSubmitting: isPending,
    subscribe,
    reset,
    error,
  };
}
