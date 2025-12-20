'use client';

import type { newsletter_source } from '@prisma/client';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/config/marketing-client';
import { useConfetti } from '@heyclaude/web-runtime/hooks/use-confetti';
import { useNewsletter } from '@heyclaude/web-runtime/hooks/use-newsletter';
import { ArrowRight, Loader2 } from '@heyclaude/web-runtime/icons';
import { cn, Input } from '@heyclaude/web-runtime/ui';
import { SPRING, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo } from 'react';

export interface NewsletterFormProps {
  className?: string;
  source: newsletter_source;
}

/**
 * Email validation regex - simple but effective
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

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
  const shouldReduceMotion = useReducedMotion();

  // Determine if email is valid and button should be visible
  const isValid = useMemo(() => isValidEmail(email), [email]);
  const showSubmitButton = isValid && !isSubmitting && email.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid && !isSubmitting) {
      await subscribe();
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('w-full', className)}>
      <div className="flex flex-col gap-3">
        {/* Integrated input with submit button inside */}
        <div className={`relative w-full`}>
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
              'transition-all duration-200 ease-out',
              'focus:border-color-newsletter-border focus:ring-color-newsletter-ring focus:ring-2 focus:outline-none',
              error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
              isSubmitting && 'cursor-not-allowed opacity-60',
              showSubmitButton && 'pr-14'
            )}
            aria-label="Email address"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />

          {/* Integrated submit button - appears when email is valid */}
          <AnimatePresence mode="wait">
            {isSubmitting ? (
              <motion.button
                key="loading"
                type="button"
                disabled
                className={cn(
                  'absolute top-1/2 right-2 -translate-y-1/2',
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  'bg-color-newsletter-bg text-background',
                  'cursor-not-allowed'
                )}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: DURATION.quick }}
                aria-label="Subscribing..."
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              </motion.button>
            ) : showSubmitButton ? (
              <motion.button
                key="submit"
                type="submit"
                className={cn(
                  'absolute top-1/2 right-2 -translate-y-1/2',
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  'bg-color-newsletter-bg text-background',
                  'shadow-sm transition-all duration-200',
                  'hover:bg-color-newsletter-bg-hover hover:shadow-md',
                  'focus-visible:ring-color-newsletter-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                  'active:scale-95'
                )}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.8 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.8 }}
                transition={SPRING.loading}
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                aria-label={NEWSLETTER_CTA_CONFIG.buttonText}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  whileHover={shouldReduceMotion ? {} : { rotate: 15 }}
                  transition={SPRING.bouncy}
                >
                  <ArrowRight className="h-5 w-5" aria-hidden="true" />
                </motion.div>
              </motion.button>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Error message */}
        {error ? (
          <motion.p
            id={errorId}
            className="text-destructive text-sm"
            role="alert"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: DURATION.quick }}
          >
            {error}
          </motion.p>
        ) : null}
      </div>
    </form>
  );
}
