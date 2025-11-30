'use client';

import type { Database } from '@heyclaude/database-types';
import { iconSize, responsive, stack } from '@heyclaude/web-runtime/design-system';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { Mail } from '@heyclaude/web-runtime/icons';
import { cn, DIMENSIONS } from '@heyclaude/web-runtime/ui';
import { useId, useState } from 'react';
import { InlineSpinner } from '@heyclaude/web-runtime/ui';
import { Button } from '@heyclaude/web-runtime/ui';
import { Input } from '@heyclaude/web-runtime/ui';
import { useConfetti } from '@heyclaude/web-runtime/hooks';
import { useNewsletter } from '@heyclaude/web-runtime/hooks';

export interface NewsletterFormProps {
  source: Database['public']['Enums']['newsletter_source'];
  className?: string;
}

/**
 * Renders a newsletter subscription form with email input, submit button, inline validation, and optional confetti on successful subscription.
 *
 * The form manages email state, shows a loading spinner while submitting, displays an error message when subscription fails, and fires subtle confetti if enabled in configuration after a successful subscription.
 *
 * @param source - Source identifier to annotate where the newsletter signup originated (used by the subscription hook).
 * @param className - Optional additional CSS class names to apply to the form container.
 * @returns The newsletter form element ready to be embedded in a React tree.
 *
 * @see useNewsletter
 * @see useConfetti
 * @see NEWSLETTER_CTA_CONFIG
 */
export function NewsletterForm({ source, className }: NewsletterFormProps) {
  const { fireConfetti } = useConfetti();
  const { email, setEmail, isSubmitting, subscribe, error } = useNewsletter({
    source,
    onSuccess: async () => {
      // Check confetti enabled (static config)
      const confettiEnabled = checkConfettiEnabled();
      if (confettiEnabled) {
        fireConfetti('subtle');
      }
    },
  });
  const errorId = useId();
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await subscribe();
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className={stack.default}>
        <div className={responsive.smRowGap}>
          <div className="relative flex-1">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required={true}
              disabled={isSubmitting}
              className={cn(
                `${DIMENSIONS.BUTTON_LG} min-w-0 px-5 text-base`,
                'border-border/40 bg-background/95 backdrop-blur-sm',
                'transition-all duration-200 ease-out',
                'focus:border-accent/50 focus:ring-2 focus:ring-accent/20',
                error && 'border-destructive/50 focus:border-destructive focus:ring-destructive/20',
                isSubmitting && 'cursor-not-allowed opacity-60'
              )}
              aria-label="Email address"
              aria-invalid={!!error}
              aria-describedby={error ? errorId : undefined}
            />
            <div
              className={cn(
                'absolute bottom-0 left-0 h-0.5 bg-linear-to-r from-accent to-primary transition-all duration-300 ease-out',
                isFocused && !error ? 'w-full opacity-100' : 'w-0 opacity-0'
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            size="lg"
            className={cn(
              `${DIMENSIONS.BUTTON_LG} shrink-0 whitespace-nowrap px-8`,
              'bg-linear-to-rrom-accent via-accent to-primary font-semibold text-accent-foreground',
              'shadow-md transition-all duration-200 ease-out',
              'hover:scale-[1.02] hover:from-accent/90 hover:via-accent/90 hover:to-primary/90 hover:shadow-lg',
              'active:scale-[0.98]',
              'focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100',
              `w-full sm:w-auto sm:${DIMENSIONS.MIN_W_NEWSLETTER_BUTTON}`
            )}
          >
            {isSubmitting ? (
              <InlineSpinner size="sm" message="Subscribing..." />
            ) : (
              <span className="flex items-center gap-2">
                {NEWSLETTER_CTA_CONFIG.buttonText}
                <Mail className={iconSize.sm} aria-hidden="true" />
              </span>
            )}
          </Button>
        </div>
        {error && (
          <p
            id={errorId}
            className="slide-in-from-top-1 fade-in animate-in text-destructive text-sm"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </form>
  );
}