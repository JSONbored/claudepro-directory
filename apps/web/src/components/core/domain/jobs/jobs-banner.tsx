/**
 * JobsPromo - Consolidated job board promotion with newsletter signup
 * Combines job posting promotion with job alerts newsletter signup
 * Uses highlight border/glow pattern and enhanced microinteractions
 */

'use client';

import { type Database } from '@heyclaude/database-types';
import { checkConfettiEnabled } from '@heyclaude/web-runtime/config/static-configs';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { useConfetti, useNewsletter } from '@heyclaude/web-runtime/hooks';
import { Check, ChevronUp, Loader2, Mail, Send, TrendingUp } from '@heyclaude/web-runtime/icons';
import {
  cn,
  UI_CLASSES,
  Button,
  Card,
  CardContent,
  Input,
} from '@heyclaude/web-runtime/ui';
import { SPRING } from '@heyclaude/web-runtime/design-system';
import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { useId, useMemo, useState } from 'react';

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
  const [showNewsletterForm, setShowNewsletterForm] = useState(false);

  const { email, setEmail, isSubmitting, subscribe, error, reset } = useNewsletter({
    source: 'inline' as Database['public']['Enums']['newsletter_source'],
    successMessage: 'You will receive email updates when new AI roles are posted.',
    onSuccess: async () => {
      const confettiEnabled = checkConfettiEnabled();
      if (confettiEnabled) {
        fireConfetti('subtle');
      }
      // Reset form after success
      reset();
      setShowNewsletterForm(false);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ...SPRING.smooth }}
    >
      <Card
        className={cn(
          'group relative overflow-hidden rounded-xl border transition-all duration-300',
          'border-accent/70 shadow-[0_10px_40px_-20px_rgba(255,138,76,0.8)]',
          'hover:border-accent/40 hover:shadow-[0_10px_40px_-20px_rgba(255,138,76,0.6)]'
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

        <CardContent className={cn(UI_CLASSES.SPACE_Y_4, UI_CLASSES.PADDING_COMFORTABLE, 'relative')}>
          {/* Header Section - Job Posting Promotion */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h3 className={cn(UI_CLASSES.MARGIN_TIGHT, 'text-xl leading-tight font-bold')}>
              Hire Claude Developers
            </h3>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>
              Growing community of AI engineers actively building with Claude
            </p>
          </motion.div>

          {/* Growth Metrics */}
          <motion.div
            className={cn(
              UI_CLASSES.SPACE_Y_2,
              'bg-card/50 rounded-lg border border-border/50',
              UI_CLASSES.PADDING_COMPACT
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, ...SPRING.smooth }}
          >
            <div className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN, UI_CLASSES.TEXT_SM)}>
              <span className={UI_CLASSES.TEXT_MUTED}>Active community</span>
              <motion.span
                className="font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                1,700/month
              </motion.span>
            </div>
            <div className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN, UI_CLASSES.TEXT_SM)}>
              <span className={UI_CLASSES.TEXT_MUTED}>Growth rate</span>
              <motion.span
                className={cn(
                  UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1,
                  'font-semibold',
                  UI_CLASSES.ICON_SUCCESS
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <TrendingUp className={UI_CLASSES.ICON_XS} />
                Month 2
              </motion.span>
            </div>
          </motion.div>

          {/* Value Props */}
          <div className={UI_CLASSES.SPACE_Y_2}>
            {[
              'Specialized AI talent pool',
              '30-day featured visibility',
              'Early-stage pricing advantage',
            ].map((text, i) => (
              <motion.div
                key={text}
                className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Check
                  className={cn(UI_CLASSES.FLEX_SHRINK_0_MT_0_5, UI_CLASSES.ICON_SM, 'text-accent')}
                />
                <span className={UI_CLASSES.TEXT_SM}>{text}</span>
              </motion.div>
            ))}
          </div>

          {/* Newsletter Form Section - Collapsible (Simple email-only) */}
          <AnimatePresence mode="wait">
            {showNewsletterForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{
                  ...SPRING.gentle,
                  mass: 0.8,
                }}
                style={{ overflow: 'hidden' }}
                className="border-border/50 space-y-3 rounded-lg border bg-card/30 p-4"
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
                            'flex h-8 w-8 items-center justify-center rounded-md',
                            'bg-[#F6F8F4] text-background',
                            'cursor-not-allowed'
                          )}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.2 }}
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
                            'flex h-8 w-8 items-center justify-center rounded-md',
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
                          aria-label="Subscribe to job alerts"
                        >
                          <motion.div
                            initial={{ rotate: 0 }}
                            whileHover={{ rotate: 15 }}
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
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      {error}
                    </motion.p>
                  ) : null}

                  <p className={cn(UI_CLASSES.TEXT_XS_MUTED, 'leading-snug')}>
                    We only send relevant AI roles. Unsubscribe anytime.
                  </p>
                </form>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className={cn(UI_CLASSES.SPACE_Y_2)}>
            {/* Post Job CTA */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                asChild
                className="w-full bg-[#F6F8F4] text-background hover:bg-[#F6F8F4]/90"
              >
                <Link href={ROUTES.PARTNER}>View Pricing & Post Job</Link>
              </Button>
            </motion.div>

            {/* Toggle Newsletter Form Button */}
            <motion.button
              type="button"
              onClick={() => setShowNewsletterForm(!showNewsletterForm)}
              className={cn(
                'w-full',
                'flex items-center justify-center gap-2',
                'text-muted-foreground hover:text-foreground',
                'text-sm font-medium',
                'transition-colors duration-200',
                'hover:bg-accent/5 rounded-md py-1.5'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              <span>{showNewsletterForm ? 'Hide job alerts' : 'Get job alerts by email'}</span>
              <motion.div
                animate={{ rotate: showNewsletterForm ? 180 : 0 }}
                transition={SPRING.smooth}
              >
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              </motion.div>
            </motion.button>
          </div>

          {/* Trust Signal */}
          <motion.p
            className={cn('text-center', UI_CLASSES.TEXT_XS_MUTED)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Live in 5 minutes • Growing community
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
}