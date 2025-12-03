'use client';

import type { Database } from '@heyclaude/database-types';
import { responsive, spaceY, marginTop, muted ,size, bgGradient, gradientFrom, gradientTo, maxWidth, flexGrow, display, marginX, textAlign, height, opacityLevel } from '@heyclaude/web-runtime/design-system';
import { logUnhandledPromise, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { usePulse } from '@heyclaude/web-runtime/hooks';
import { cn, toasts } from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';
import { Button } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@heyclaude/web-runtime/ui';
import { useNewsletter } from '@heyclaude/web-runtime/hooks';

export interface NewsletterModalProps {
  source: Database['public']['Enums']['newsletter_source'];
  category?: Database['public']['Enums']['content_category'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyType: Database['public']['Enums']['copy_type'];
  slug?: string;
}

/**
 * Newsletter signup modal rendered as a bottom sheet that collects an email and emits telemetry for impressions, submissions, and dismissals.
 *
 * @param source - Identifier for the newsletter source; attached to subscription metadata and telemetry.
 * @param category - Optional content category to include in subscription metadata and telemetry.
 * @param open - Whether the modal is visible.
 * @param onOpenChange - Callback invoked with the new open state when the modal is opened or closed.
 * @param copyType - Copy/telemetry variant to include in subscription metadata and analytics.
 * @param slug - Optional content slug to include in subscription metadata and telemetry.
 * @returns The rendered newsletter modal element.
 *
 * @see useNewsletter
 * @see usePulse
 */
export function NewsletterModal({
  source,
  category,
  open,
  onOpenChange,
  copyType,
  slug,
}: NewsletterModalProps) {
  const [showTime, setShowTime] = useState<number | null>(null);
  const pulse = usePulse();

  const { email, setEmail, isSubmitting, subscribe } = useNewsletter({
    source,
    metadata: {
      copy_type: copyType,
      ...(category && { copy_category: category }),
      ...(slug && { copy_slug: slug }),
    },
    successMessage: 'Check your inbox for a welcome email',
    showToasts: true,
    logContext: {
      variant: 'modal',
      copyType,
      ...(category && { category }),
      ...(slug && { slug }),
    },
    onSuccess: () => {
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (open) {
      const now = Date.now();
      setShowTime(now);

      pulse
        .click({
          category: null,
          slug: null,
          metadata: {
            action: 'email_modal_shown',
            trigger_source: 'post_copy',
            copy_type: copyType,
            session_copy_count: 1,
          },
        })
        .catch((error) => {
          logUnhandledPromise('NewsletterModal: modal shown tracking failed', error, {
            copyType,
          });
        });
    }
  }, [open, copyType, pulse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toasts.raw.error('Email required', {
        description: 'Please enter your email address',
        duration: 3000,
      });
      return;
    }

    await subscribe();
  };

  const handleMaybeLater = () => {
    if (showTime) {
      const timeShown = Date.now() - showTime;

      pulse
        .click({
          category: null,
          slug: null,
          metadata: {
            action: 'email_modal_dismissed',
            trigger_source: 'post_copy',
            dismissal_method: 'maybe_later',
            time_shown_ms: timeShown,
          },
        })
        .catch((error) => {
          logUnhandledPromise('NewsletterModal: maybe later tracking failed', error, {
            copyType,
          });
        });
    }

    onOpenChange(false);
    setEmail('');
  };

  const handleDismiss = (open: boolean) => {
    if (!open && showTime) {
      const timeShown = Date.now() - showTime;

      pulse
        .click({
          category: null,
          slug: null,
          metadata: {
            action: 'email_modal_dismissed',
            trigger_source: 'post_copy',
            dismissal_method: 'close_button',
            time_shown_ms: timeShown,
          },
        })
        .catch((error) => {
          logUnhandledPromise('NewsletterModal: close tracking failed', error, {
            copyType,
          });
        });
    }

    onOpenChange(open);
    if (!open) {
      setEmail('');
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleDismiss}>
      <SheetContent side="bottom" className={`sm:${marginX.auto} ${maxWidth.smMd}`}>
        <SheetHeader>
          <SheetTitle>{NEWSLETTER_CTA_CONFIG.headline}</SheetTitle>
          <SheetDescription>{NEWSLETTER_CTA_CONFIG.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className={`${marginTop.comfortable} ${spaceY.comfortable}`}>
          <div className={spaceY.compact}>
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className={`${height.search} ${size.base}`}
              autoComplete="email"
              aria-label="Email address"
              required={true}
            />
          </div>

          <div className={responsive.smRowGap}>
            <Button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className={cn(
                `${flexGrow['1']} ${bgGradient.toR} ${gradientFrom.accent} ${gradientTo.primary} hover:${gradientFrom.accent90} hover:${gradientTo.primary90}`,
                isSubmitting && opacityLevel[50]
              )}
            >
              {isSubmitting ? 'Joining...' : NEWSLETTER_CTA_CONFIG.buttonText}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleMaybeLater}
              disabled={isSubmitting}
              className={`${flexGrow['1']} sm:${display.flex}-initial`}
            >
              Maybe later
            </Button>
          </div>
        </form>

        <p className={`${marginTop.default} ${textAlign.center} ${muted.default} ${size.xs}`}>
          By subscribing, you agree to receive updates about Claude tools and resources.
        </p>
      </SheetContent>
    </Sheet>
  );
}