'use client';

import { useId, useState } from 'react';
import { InlineSpinner } from '@/src/components/primitives/feedback/loading-factory';
import { Button } from '@/src/components/primitives/ui/button';
import { Input } from '@/src/components/primitives/ui/input';
import { useConfetti } from '@/src/hooks/use-confetti';
import type { NewsletterSource } from '@/src/hooks/use-newsletter';
import { useNewsletter } from '@/src/hooks/use-newsletter';
import { NEWSLETTER_CTA_CONFIG } from '@/src/lib/config/category-config';
import { Mail } from '@/src/lib/icons';
import { DIMENSIONS, UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

export interface NewsletterFormProps {
  source: NewsletterSource;
  className?: string;
}

export function NewsletterForm({ source, className }: NewsletterFormProps) {
  const { celebrateSignup } = useConfetti();
  const { email, setEmail, isSubmitting, subscribe, error } = useNewsletter({
    source,
    onSuccess: () => {
      // Celebrate newsletter signup! 🎉
      celebrateSignup();
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
      <div className={UI_CLASSES.FLEX_COL_GAP_3}>
        <div className={UI_CLASSES.FLEX_COL_SM_ROW_GAP_3}>
          <div className="relative flex-1">
            <Input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              required
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
                'absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-accent to-primary transition-all duration-300 ease-out',
                isFocused && !error ? 'w-full opacity-100' : 'w-0 opacity-0'
              )}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || !email.trim()}
            size="lg"
            className={cn(
              `${DIMENSIONS.BUTTON_LG} flex-shrink-0 whitespace-nowrap px-8`,
              'bg-gradient-to-r from-accent via-accent to-primary font-semibold text-accent-foreground',
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
                <Mail className={UI_CLASSES.ICON_SM} aria-hidden="true" />
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
