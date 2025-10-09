/**
 * Newsletter Subscription Hook
 *
 * Production-grade hook for newsletter subscription with consistent state management.
 * Centralizes form logic that was duplicated across newsletter-form, footer-newsletter-bar,
 * and inline-email-cta components.
 *
 * Features:
 * - Type-safe source tracking for analytics
 * - Server Action integration with useTransition
 * - Consistent error handling and toast notifications
 * - Automatic form reset on success
 * - Referrer tracking for attribution
 *
 * Architecture:
 * - Follows existing useCopyToClipboard hook pattern
 * - Leverages subscribeToNewsletter server action
 * - Respects production standards for error handling
 *
 * @module hooks/use-newsletter
 */

'use client';

import { useCallback, useState, useTransition } from 'react';
import { toast } from 'sonner';
import { subscribeToNewsletter } from '@/src/lib/actions/newsletter-signup';
import { logger } from '@/src/lib/logger';

/**
 * Newsletter source types for analytics tracking
 */
export type NewsletterSource = 'footer' | 'homepage' | 'modal' | 'content_page' | 'inline';

/**
 * Options for newsletter subscription hook
 */
export interface UseNewsletterOptions {
  /**
   * Source location for analytics tracking
   */
  source: NewsletterSource;

  /**
   * Callback to execute on successful subscription
   */
  onSuccess?: () => void;

  /**
   * Callback to execute on subscription error
   */
  onError?: (error: string) => void;

  /**
   * Custom success toast message
   * @default "Welcome! You're now subscribed to our newsletter."
   */
  successMessage?: string;

  /**
   * Custom error toast title
   * @default "Subscription failed"
   */
  errorTitle?: string;

  /**
   * Whether to show toast notifications
   * @default true
   */
  showToasts?: boolean;
}

/**
 * Return type for newsletter subscription hook
 */
export interface UseNewsletterReturn {
  /**
   * Current email input value
   */
  email: string;

  /**
   * Update email input value
   */
  setEmail: (email: string) => void;

  /**
   * Whether subscription is in progress
   */
  isSubmitting: boolean;

  /**
   * Subscribe function to trigger submission
   */
  subscribe: () => Promise<void>;

  /**
   * Reset form state (clears email and errors)
   */
  reset: () => void;

  /**
   * Last error message (if any)
   */
  error: string | null;
}

/**
 * Hook for newsletter subscription with state management
 *
 * Centralizes newsletter subscription logic that was duplicated across
 * multiple components. Provides consistent UX and error handling.
 *
 * @param options - Configuration options
 * @returns Object with subscription state and handlers
 *
 * @example
 * ```tsx
 * function NewsletterForm() {
 *   const { email, setEmail, isSubmitting, subscribe } = useNewsletter({
 *     source: 'footer',
 *     onSuccess: () => console.log('Subscribed!'),
 *   });
 *
 *   return (
 *     <form onSubmit={(e) => { e.preventDefault(); subscribe(); }}>
 *       <input
 *         type="email"
 *         value={email}
 *         onChange={(e) => setEmail(e.target.value)}
 *         disabled={isSubmitting}
 *       />
 *       <button type="submit" disabled={isSubmitting}>
 *         {isSubmitting ? 'Subscribing...' : 'Subscribe'}
 *       </button>
 *     </form>
 *   );
 * }
 * ```
 */
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

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setEmail('');
    setError(null);
  }, []);

  /**
   * Subscribe to newsletter
   */
  const subscribe = useCallback(async () => {
    // Client-side validation
    if (!email) {
      const errorMsg = 'Please enter your email address';
      setError(errorMsg);

      if (showToasts) {
        toast.error(errorMsg);
      }

      onError?.(errorMsg);
      return;
    }

    // Clear previous errors
    setError(null);

    startTransition(async () => {
      try {
        // Get referrer for attribution
        const referrer = typeof window !== 'undefined' ? window.location.href : undefined;

        // Call server action
        const result = await subscribeToNewsletter({
          email,
          source,
          ...(referrer && { referrer }),
        });

        // Handle success
        if (result?.data?.success) {
          if (showToasts) {
            toast.success('Welcome!', {
              description: successMessage,
            });
          }

          // Reset form
          reset();

          // Call success callback
          onSuccess?.();
        } else {
          // Handle error response from server
          const errorMessage =
            result?.data?.message ||
            result?.serverError ||
            (result?.data?.error ? `Error: ${result.data.error}` : null) ||
            'Please try again later.';

          setError(errorMessage);

          if (showToasts) {
            toast.error(errorTitle, {
              description: errorMessage,
            });
          }

          onError?.(errorMessage);

          // Log error for monitoring
          logger.error('Newsletter subscription failed', new Error(errorMessage), {
            component: 'useNewsletter',
            source,
            email: `${email.substring(0, 3)}***`, // Partial email for privacy
          });
        }
      } catch (err) {
        // Handle unexpected errors
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';

        setError(errorMessage);

        if (showToasts) {
          toast.error(errorTitle, {
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
