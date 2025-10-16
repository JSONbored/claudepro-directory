/**
 * Post-Copy Email Capture Modal
 *
 * Modal sheet that appears after user copies content, prompting for email subscription.
 * Integrates with newsletter system and tracks conversion attribution.
 *
 * Features:
 * - Appears after copy actions (markdown, code, llmstxt)
 * - Tracks copy context for analytics
 * - Rate-limited server action integration
 * - Umami analytics tracking
 * - Respects user dismissal preferences
 *
 * @module components/shared/post-copy-email-modal
 */

'use client';

import { useAction } from 'next-safe-action/hooks';
import { useEffect, useState } from 'react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/ui/sheet';
import { postCopyEmailCaptureAction } from '@/src/lib/actions/email-capture';
import { EVENTS } from '@/src/lib/analytics/events.config';
import { trackEvent } from '@/src/lib/analytics/tracker';
import { logger } from '@/src/lib/logger';
import { cn } from '@/src/lib/utils';
import { toasts } from '@/src/lib/utils/toast.utils';

/**
 * Copy type for tracking context
 */
export type CopyType = 'llmstxt' | 'markdown' | 'code' | 'link';

/**
 * Props for PostCopyEmailModal
 */
export interface PostCopyEmailModalProps {
  /**
   * Whether modal is open
   */
  open: boolean;

  /**
   * Callback when modal open state changes
   */
  onOpenChange: (open: boolean) => void;

  /**
   * Type of content that was copied
   */
  copyType: CopyType;

  /**
   * Content category (agents, mcp, etc.)
   */
  category?: string;

  /**
   * Content slug identifier
   */
  slug?: string;

  /**
   * Optional referrer URL
   */
  referrer?: string;
}

/**
 * Modal component for capturing email after copy action
 *
 * Shows once per session after user copies content.
 * Tracks analytics and sends welcome email on subscription.
 *
 * @param props - Component props
 * @returns Sheet modal with email capture form
 *
 * @example
 * ```tsx
 * <PostCopyEmailModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   copyType="markdown"
 *   category="agents"
 *   slug="api-builder"
 * />
 * ```
 */
export function PostCopyEmailModal({
  open,
  onOpenChange,
  copyType,
  category,
  slug,
  referrer,
}: PostCopyEmailModalProps) {
  const [email, setEmail] = useState('');
  const [showTime, setShowTime] = useState<number | null>(null);

  // Track when modal is shown
  useEffect(() => {
    if (open) {
      const now = Date.now();
      setShowTime(now);

      // Track modal shown event
      trackEvent(EVENTS.EMAIL_MODAL_SHOWN, {
        trigger_source: 'post_copy',
        copy_type: copyType,
        session_copy_count: 1, // TODO: Track actual session copy count
      });
    }
  }, [open, copyType]);

  // Use next-safe-action hook
  const { execute, status } = useAction(postCopyEmailCaptureAction, {
    onSuccess: (result) => {
      if (result.data?.success) {
        toasts.raw.success('Welcome to the newsletter! 🎉', {
          description: 'Check your inbox for a welcome email',
          duration: 5000,
        });

        // Track analytics if provided
        if (result.data.analytics) {
          const { event, ...eventData } = result.data.analytics;
          trackEvent(event, eventData);
        }

        // Close modal and reset
        onOpenChange(false);
        setEmail('');
      } else {
        throw new Error(result.data?.error || 'Subscription failed');
      }
    },
    onError: (error) => {
      const serverError = error.error?.serverError;
      const errorMessage =
        serverError &&
        typeof serverError === 'object' &&
        'message' in serverError &&
        typeof (serverError as { message?: unknown }).message === 'string'
          ? (serverError as { message: string }).message
          : typeof serverError === 'string'
            ? serverError
            : 'Failed to subscribe';

      logger.error('Post-copy email capture failed', new Error(errorMessage), {
        component: 'PostCopyEmailModal',
        copyType,
        ...(category && { category }),
        ...(slug && { slug }),
      });

      toasts.raw.error('Failed to subscribe', {
        description: errorMessage,
        duration: 4000,
      });
    },
  });

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toasts.raw.error('Email required', {
        description: 'Please enter your email address',
        duration: 3000,
      });
      return;
    }

    await execute({
      email: email.trim(),
      source: 'post_copy',
      ...(referrer && { referrer }),
      copyType,
      ...(category && { copyCategory: category }),
      ...(slug && { copySlug: slug }),
    });
  };

  /**
   * Handle "Maybe later" dismissal
   */
  const handleMaybeLater = () => {
    if (showTime) {
      const timeShown = Date.now() - showTime;

      trackEvent(EVENTS.EMAIL_MODAL_DISMISSED, {
        trigger_source: 'post_copy',
        dismissal_method: 'maybe_later',
        time_shown_ms: timeShown,
      });
    }

    onOpenChange(false);
    setEmail('');
  };

  /**
   * Handle overlay/close button dismissal
   */
  const handleDismiss = (open: boolean) => {
    if (!open && showTime) {
      const timeShown = Date.now() - showTime;

      trackEvent(EVENTS.EMAIL_MODAL_DISMISSED, {
        trigger_source: 'post_copy',
        dismissal_method: 'close_button',
        time_shown_ms: timeShown,
      });
    }

    onOpenChange(open);
    if (!open) {
      setEmail('');
    }
  };

  const isLoading = status === 'executing';

  return (
    <Sheet open={open} onOpenChange={handleDismiss}>
      <SheetContent side="bottom" className="sm:max-w-md sm:mx-auto">
        <SheetHeader>
          <SheetTitle>Want more like this?</SheetTitle>
          <SheetDescription>
            Get the best Claude resources delivered to your inbox. No spam, unsubscribe anytime.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="text-base"
              autoComplete="email"
              aria-label="Email address"
              required
            />
          </div>

          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              type="submit"
              disabled={isLoading || !email.trim()}
              className={cn('flex-1', isLoading && 'opacity-50')}
            >
              {isLoading ? 'Subscribing...' : 'Subscribe'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleMaybeLater}
              disabled={isLoading}
              className="flex-1 sm:flex-initial"
            >
              Maybe later
            </Button>
          </div>
        </form>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          By subscribing, you agree to receive updates about Claude tools and resources.
        </p>
      </SheetContent>
    </Sheet>
  );
}
