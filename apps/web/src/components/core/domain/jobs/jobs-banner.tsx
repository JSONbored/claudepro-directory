/**
 * JobsPromo - Consolidated job board promotion with newsletter signup
 * Combines job posting promotion with job alerts newsletter signup
 * Uses highlight border/glow pattern and enhanced microinteractions
 */

'use client';

import type { newsletter_source } from '@prisma/client';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useConfetti } from '@heyclaude/web-runtime/hooks/use-confetti';
import { useNewsletter } from '@heyclaude/web-runtime/hooks/use-newsletter';
import { Check, ChevronUp, Loader2, Mail, Send, TrendingUp } from '@heyclaude/web-runtime/icons';
import { cn, Button, Card, CardContent, Input } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useBoolean } from '@heyclaude/web-runtime/hooks/use-boolean';
import { useId, useMemo } from 'react';

/**
 * Email validation regex - simple but effective
 */
const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

/**
 * Promotional card for hiring Claude developers with an integrated newsletter signup.
 *
 * Renders a styled promo card that presents community metrics, value propositions, a CTA to post jobs,
 * and an optional collapsible email signup for job alerts that validates input, displays submission state
 * and errors, and triggers a success handler (including subtle confetti) on successful subscription.
 *
 * @returns The rendered JobsPromo JSX element.
 *
 * @see useNewsletter
 * @see useConfetti
 * @see isValidEmail
 */
export function JobsPromo() {
  const { fireConfetti } = useConfetti();
  const {
    value: showNewsletterForm,
    toggle: toggleShowNewsletterForm,
    setFalse: setShowNewsletterFormFalse,
  } = useBoolean();
  const shouldReduceMotion = useReducedMotion();

  const { email, setEmail, isSubmitting, subscribe, error, reset } = useNewsletter({
    source: 'inline' as newsletter_source,
    successMessage: 'You will receive email updates when new AI roles are posted.',
    onSuccess: async () => {
      const confettiEnabled = checkConfettiEnabled();
      if (confettiEnabled) {
        fireConfetti('subtle');
      }
      // Reset form after success
      reset();
      setShowNewsletterFormFalse();
    },
    logContext: {
      component: 'JobsPromo',
    },
  });

  const errorId = useId();
  const isValid = useMemo(() => isValidEmail(email), [email]);
  const showSubmitButton = isValid && !isSubmitting && email.trim().length > 0;

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isValid && !isSubmitting) {
      await subscribe();
    }
  };

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      transition={{ duration: DURATION.moderate, delay: STAGGER.default, ...SPRING.smooth }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden rounded-xl border transition-all duration-300',
          'border-accent/70 shadow-shadow-glow-orange-large',
          'hover:border-accent/40 hover:shadow-shadow-glow-orange-large-hover'
        )}
      >
        {/* Gradient overlay on hover */}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100',
            'from-accent/10 bg-gradient-to-br via-transparent to-transparent'
          )}
          aria-hidden="true"
        />

        <CardContent className={cn('space-y-4', 'p-6', 'relative')}>
          {/* Header Section - Job Posting Promotion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: STAGGER.slow }}
          >
            <h3 className={cn('mb-1', 'text-xl leading-tight font-bold')}>
              Hire Claude Developers
            </h3>
            <p className="text-muted-foreground text-sm">
              Growing community of AI engineers actively building with Claude
            </p>
          </motion.div>

          {/* Growth Metrics */}
          <motion.div
            className={cn('space-y-2', 'bg-card/50 card-base border-border/50', 'p-3')}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1 }}
            transition={{ delay: STAGGER.relaxed, ...SPRING.smooth }}
          >
            <div className={cn('flex items-center justify-between', 'text-sm')}>
              <span className="text-muted-foreground">Active community</span>
              <motion.span
                className="font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: STAGGER.loose }}
              >
                1,700/month
              </motion.span>
            </div>
            <div className={cn('flex items-center justify-between', 'text-sm')}>
              <span className="text-muted-foreground">Growth rate</span>
              <motion.span
                className={cn(
                  'flex items-center gap-1',
                  'font-semibold',
                  'text-success'
                )}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                transition={{ delay: STAGGER.extended }}
              >
                <TrendingUp className="h-3 w-3" />
                Month 2
              </motion.span>
            </div>
          </motion.div>

          {/* Value Props */}
          <div className="space-y-2">
            {[
              'Specialized AI talent pool',
              '30-day featured visibility',
              'Early-stage pricing advantage',
            ].map((text, i) => (
              <motion.div
                key={text}
                className="flex items-start gap-2"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -10 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
                transition={{ delay: STAGGER.loose + i * STAGGER.fast }}
              >
                <Check className={cn('flex-shrink-0', 'mt-0.5', 'h-4 w-4', 'text-accent')} />
                <span className="text-sm">{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Form Section - Collapsible (Simple email-only) */}
          <AnimatePresence mode="wait">
            {showNewsletterForm ? (
              <motion.div
                key="form"
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
                animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto', y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0, y: -10 }}
                transition={{
                  ...SPRING.gentle,
                  mass: 0.8,
                }}
                className="border-border/50 card-base bg-card/30 space-y-3 overflow-hidden p-4"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">Get job alerts</h4>
                  <p className="text-muted-foreground text-xs">
                    Get email updates when new AI roles are posted.
                  </p>
                </div>

                <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                  {/* Email Input with integrated submit button (same as NewsletterForm) */}
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
                        'focus:border-accent focus:ring-accent/20 focus:ring-2',
                        error &&
                          'border-destructive focus:border-destructive focus:ring-destructive/20',
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
                            'flex h-8 w-8 items-center justify-center rounded-md',
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
                            'flex h-8 w-8 items-center justify-center rounded-md',
                            'bg-color-newsletter-bg text-background',
                            'shadow-sm transition-all duration-200',
                            'hover:bg-color-newsletter-bg-hover hover:shadow-md',
                            'focus-visible:ring-color-newsletter-bg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                            'active:scale-95'
                          )}
                          initial={
                            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.8 }
                          }
                          animate={
                            shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, scale: 1 }
                          }
                          exit={
                            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8, scale: 0.8 }
                          }
                          transition={SPRING.loading}
                          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                          aria-label="Subscribe to job alerts"
                        >
                          <motion.div
                            initial={{ rotate: 0 }}
                            whileHover={shouldReduceMotion ? {} : { rotate: 15 }}
                            transition={SPRING.bouncy}
                          >
                            <Send className="h-4 w-4" aria-hidden="true" />
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

                  <p className={cn('text-xs', 'text-muted-foreground', 'leading-snug')}>
                    We only send relevant AI roles. Unsubscribe anytime.
                  </p>
                </form>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className={cn('space-y-2')}>
            {/* Post Job CTA */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
              transition={{ delay: STAGGER.maximum }}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <Button
                asChild
                className="bg-color-newsletter-bg text-background hover:bg-color-newsletter-bg-hover w-full"
              >
                <Link href={ROUTES.PARTNER}>View Pricing & Post Job</Link>
              </Button>
            </motion.div>

            {/* Toggle Newsletter Form Button */}
            <motion.button
              type="button"
              onClick={toggleShowNewsletterForm}
              className={cn(
                'w-full',
                'flex-center gap-2',
                'text-muted-foreground hover:text-foreground',
                'text-sm-medium',
                'transition-colors duration-200',
                'hover:bg-accent/5 rounded-md py-1.5'
              )}
              whileHover={shouldReduceMotion ? {} : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>{showNewsletterForm ? 'Hide job alerts' : 'Get job alerts by email'}</span>
              <motion.div
                animate={shouldReduceMotion ? {} : { rotate: showNewsletterForm ? 180 : 0 }}
                transition={SPRING.smooth}
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </motion.div>
            </motion.button>
          </div>

          {/* Trust Signal */}
          <motion.p
            className={cn('text-center', 'text-xs', 'text-muted-foreground')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: STAGGER.ultimate }}
          >
            Live in 5 minutes • Growing community
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
