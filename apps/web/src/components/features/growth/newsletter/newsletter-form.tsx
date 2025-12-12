'use client';

import { type Database } from '@heyclaude/database-types';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { NEWSLETTER_CTA_CONFIG } from '@heyclaude/web-runtime/core';
import { useConfetti, useNewsletter } from '@heyclaude/web-runtime/hooks';
import { ArrowRight, Loader2 } from '@heyclaude/web-runtime/icons';
import {
  cn,
  UI_CLASSES,
  Input,
} from '@heyclaude/web-runtime/ui';
import { SPRING, DURATION } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import { useId, useMemo } from 'react';

export interface NewsletterFormProps {
  className?: string;
  source: Database['public']['Enums']['newsletter_source'];
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
      <div className={UI_CLASSES.FLEX_COL_GAP_3}>
        {/* Integrated input with submit button inside */}
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
              'transition-all duration-200 ease-out',
              'focus:border-[#F6F8F4]/50 focus:ring-2 focus:ring-[#F6F8F4]/20 focus:outline-none',
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
                  'absolute right-2 top-1/2 -translate-y-1/2',
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  'bg-[#F6F8F4] text-background',
                  'cursor-not-allowed'
                )}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
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
                  'absolute right-2 top-1/2 -translate-y-1/2',
                  'flex h-10 w-10 items-center justify-center rounded-lg',
                  'bg-[#F6F8F4] text-background',
                  'shadow-sm transition-all duration-200',
                  'hover:bg-[#F6F8F4]/90 hover:shadow-md',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6F8F4] focus-visible:ring-offset-2',
                  'active:scale-95'
                )}
                initial={{ opacity: 0, x: -8, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -8, scale: 0.8 }}
                transition={SPRING.loading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={NEWSLETTER_CTA_CONFIG.buttonText}
              >
                <motion.div
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: 15 }}
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: DURATION.quick }}
          >
            {error}
          </motion.p>
        ) : null}
      </div>
    </form>
  );
}
