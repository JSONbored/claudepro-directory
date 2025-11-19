'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/src/components/primitives/ui/button';
import { Input } from '@/src/components/primitives/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/src/components/primitives/ui/sheet';
import { useNewsletter } from '@/src/hooks/use-newsletter';
import { usePulse } from '@/src/hooks/use-pulse';
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/data/config/category';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import { logUnhandledPromise } from '@/src/lib/utils/error.utils';
import { toasts } from '@/src/lib/utils/toast.utils';
import type { Database } from '@/src/types/database.types';
import type { CopyType } from '@/src/types/database-overrides';

export interface NewsletterModalProps {
  source: Database['public']['Enums']['newsletter_source'];
  category?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  copyType: CopyType;
  slug?: string;
}

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
      <SheetContent side="bottom" className="sm:mx-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{NEWSLETTER_CTA_CONFIG.headline}</SheetTitle>
          <SheetDescription>{NEWSLETTER_CTA_CONFIG.description}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="h-12 text-base"
              autoComplete="email"
              aria-label="Email address"
              required={true}
            />
          </div>

          <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
            <Button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className={cn(
                'flex-1 bg-linear-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90',
                isSubmitting && 'opacity-50'
              )}
            >
              {isSubmitting ? 'Joining...' : NEWSLETTER_CTA_CONFIG.buttonText}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleMaybeLater}
              disabled={isSubmitting}
              className="flex-1 sm:flex-initial"
            >
              Maybe later
            </Button>
          </div>
        </form>

        <p className="mt-4 text-center text-muted-foreground text-xs">
          By subscribing, you agree to receive updates about Claude tools and resources.
        </p>
      </SheetContent>
    </Sheet>
  );
}
