'use client';

import { type Database } from '@heyclaude/database-types';
import { logUnhandledPromise, NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { usePulse, useNewsletter } from '@heyclaude/web-runtime/hooks';
import {
  cn,
  toasts,
  UI_CLASSES,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export interface NewsletterModalProps {
  category?: Database['public']['Enums']['content_category'];
  copyType: Database['public']['Enums']['copy_type'];
  onOpenChange: (open: boolean) => void;
  open: boolean;
  slug?: string;
  source: Database['public']['Enums']['newsletter_source'];
}

export function NewsletterModal({
  source,
  category,
  open,
  onOpenChange,
  copyType,
  slug,
}: NewsletterModalProps) {
  const [showTime, setShowTime] = useState<null | number>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
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

      // Focus input field after modal animation completes
      const focusTimer = setTimeout(() => {
        inputRef.current?.focus();
        setIsInputFocused(true);
      }, 300); // Wait for dialog animation

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

      return () => {
        clearTimeout(focusTimer);
      };
    }
    setIsInputFocused(false);
    return undefined;
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
    <Dialog open={open} onOpenChange={handleDismiss}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{NEWSLETTER_CTA_CONFIG.headline}</DialogTitle>
          <DialogDescription>{NEWSLETTER_CTA_CONFIG.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <motion.div
              initial={false}
              animate={
                isInputFocused
                  ? {
                      scale: 1.02,
                      transition: {
                        type: 'spring',
                        stiffness: 400,
                        damping: 25,
                      },
                    }
                  : { scale: 1 }
              }
            >
              <Input
                ref={inputRef}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                disabled={isSubmitting}
                className={cn(
                  'h-12 text-base',
                  'border-border bg-background',
                  'focus:border-accent focus:ring-accent/20 focus:ring-2',
                  'transition-all duration-200',
                  isInputFocused && 'shadow-lg shadow-accent/10',
                  isSubmitting && 'cursor-not-allowed opacity-60'
                )}
                autoComplete="email"
                aria-label="Email address"
                required
              />
            </motion.div>
          </div>

          <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
            <Button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className={cn(
                'bg-accent text-white font-semibold flex-1',
                'hover:bg-accent/90 transition-all duration-200',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                isSubmitting && 'opacity-60'
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

        <p className="text-muted-foreground mt-4 text-center text-xs">
          By subscribing, you agree to receive updates about Claude tools and resources.
        </p>
      </DialogContent>
    </Dialog>
  );
}
