'use client';

/**
 * Exit Intent Newsletter Modal
 *
 * Displays a newsletter signup modal when the user is about to leave the page
 * (detected via mouse movement towards the top of the browser window).
 *
 * Best practices:
 * - High conversion rate (last chance to capture)
 * - Only shows once per session (localStorage)
 * - Respects user preferences (do not disturb)
 * - Non-intrusive timing (only on exit intent)
 */

import type { newsletter_source } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
} from '@heyclaude/web-runtime/ui';
import { useEffect, useState } from 'react';
import { ArrowRight, Loader2 } from '@heyclaude/web-runtime/icons';
import { useNewsletter } from '@heyclaude/web-runtime/hooks/use-newsletter';
import { useNewsletterCount } from '@/src/hooks/use-newsletter-count';
import { formatSubscriberCount } from './newsletter-utils';
import { cn } from '@heyclaude/web-runtime/ui';

export interface ExitIntentNewsletterModalProps {
  /**
   * Newsletter source identifier
   */
  source: newsletter_source;

  /**
   * Optional category for contextual messaging
   */
  category?: string;

  /**
   * Whether to enable the exit intent detection (default: true)
   */
  enabled?: boolean;
}

const STORAGE_KEY = 'exit-intent-newsletter-shown';
const SESSION_KEY = 'exit-intent-newsletter-session';

/**
 * Exit Intent Newsletter Modal Component
 *
 * Detects when the user is about to leave the page (mouse moves towards top of window)
 * and displays a newsletter signup modal. Only shows once per session and respects
 * localStorage to avoid showing too frequently.
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export function ExitIntentNewsletterModal({
  source,
  category,
  enabled = true,
}: ExitIntentNewsletterModalProps) {
  const [open, setOpen] = useState(false);
  const { count } = useNewsletterCount();
  const subscriberCountLabel = formatSubscriberCount(count);

  const newsletterOptions: Parameters<typeof useNewsletter>[0] = {
    source,
    ...(category && { metadata: { copy_category: category } }),
    onSuccess: () => {
      // Close modal after successful subscription
      setOpen(false);
    },
  } as Parameters<typeof useNewsletter>[0];

  const { email, setEmail, isSubmitting, subscribe, error } = useNewsletter(newsletterOptions);

  useEffect(() => {
    if (!enabled) return;

    // Check if we've already shown this modal in this session
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      return;
    }

    // Check if we've shown this recently (within last 7 days)
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown) {
      const daysSinceShown = (Date.now() - parseInt(lastShown, 10)) / (1000 * 60 * 60 * 24);
      if (daysSinceShown < 7) {
        return;
      }
    }

    let mouseY = 0;
    let hasTriggered = false;

    const handleMouseMove = (e: MouseEvent) => {
      // Track mouse Y position
      mouseY = e.clientY;

      // Trigger if mouse moves to top 5% of window (exit intent)
      // Only trigger once per session
      if (mouseY <= window.innerHeight * 0.05 && !hasTriggered) {
        hasTriggered = true;
        setOpen(true);
        sessionStorage.setItem(SESSION_KEY, 'true');
        localStorage.setItem(STORAGE_KEY, Date.now().toString());
      }
    };

    // Add event listener
    document.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled]);

  const handleClose = () => {
    setOpen(false);
  };

  const isValid = isValidEmail(email);
  const showSubmitButton = isValid && !isSubmitting && email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid && !isSubmitting) {
      await subscribe();
    }
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Wait! Don't miss out</DialogTitle>
          <DialogDescription>
            Join {subscriberCountLabel} developers staying updated on the latest Claude content,
            tools, and resources.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4">
          <div className="flex flex-col gap-3">
            <div className="relative w-full">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                className={cn(
                  'h-12 w-full pr-14 text-base',
                  'border-border bg-background',
                  error && 'border-destructive focus:border-destructive focus:ring-destructive/20'
                )}
                aria-label="Email address"
                aria-invalid={!!error}
              />
              {showSubmitButton && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="icon"
                  className="absolute top-1/2 right-2 h-8 w-8 -translate-y-1/2"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  <span className="sr-only">Subscribe</span>
                </Button>
              )}
            </div>
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </form>

        <div className="text-muted-foreground mt-4 text-center text-sm">
          <p>Get weekly updates on new agents, MCP servers, rules, and more.</p>
          <p className="mt-1">Unsubscribe anytime. No spam, ever.</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
