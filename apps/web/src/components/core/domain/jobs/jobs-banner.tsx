/**
 * JobsPromo - Sticky sidebar promotion for job board listings
 * Uses animations instead of gradients
 */

'use client';

import {
  between,
  bgColor,
  borderColor,
  cluster,
  flexGrow,
  iconSize,
  leading,
  marginBottom,
  marginTop,
  muted,
  padding,
  radius,
  row,
  size,
  stack,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Check, TrendingUp } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion, useReducedMotion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent } from '@heyclaude/web-runtime/ui';

/**
 * Render a promotional card highlighting hiring options for Claude developers.
 *
 * The component displays a title and subtitle, honest growth metrics, three concise
 * value propositions with check icons, a primary call-to-action button linking to
 * the partner pricing route, and a small trust signal. Animations are applied to
 * groups and individual elements for staged entrance and micro-interactions.
 *
 * @returns A React element containing the jobs promotional card.
 *
 * @see Card
 * @see CardContent
 * @see Button
 * @see ROUTES.PARTNER
 * @see https://www.framer.com/motion/ (motion animations used)
 */
export function JobsPromo() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, delay: 0.2 }}
    >
      <Card className={cn('overflow-hidden', borderColor['accent/20'])}>
        <CardContent className={cn(stack.default, padding.comfortable)}>
          {/* Hook with honest growth story */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className={cn(marginBottom.tight, weight.bold, size.xl, leading.tight)}>
              Hire Claude Developers
            </h3>
            <p className={cn(muted.default, size.sm)}>
              Growing community of AI engineers actively building with Claude
            </p>
          </motion.div>

          {/* Real growth metrics (honest but positive) */}
          <motion.div
            className={cn(
              stack.compact,
              radius.lg,
              'border',
              bgColor['card/50'],
              padding.compact
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <div className={cn(between.center, size.sm)}>
              <span className={muted.default}>Active community</span>
              <motion.span
                className={weight.semibold}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                1,700/month
              </motion.span>
            </div>
            <div className={cn(between.center, size.sm)}>
              <span className={muted.default}>Growth rate</span>
              <motion.span
                className={cn(
                  cluster.tight,
                  weight.semibold,
                  'text-green-600'
                )}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <TrendingUp className={iconSize.xs} />
                Month 2
              </motion.span>
            </div>
          </motion.div>

          {/* Value props (factual, not fake) */}
          <div className={stack.compact}>
            {[
              'Specialized AI talent pool',
              '30-day featured visibility',
              'Early-stage pricing advantage',
            ].map((text, i) => (
              <motion.div
                key={text}
                className={row.compact}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Check
                  className={cn(marginTop.micro, flexGrow.shrink0, iconSize.sm, 'text-accent')}
                />
                <span className={size.sm}>{text}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button asChild={true} className="w-full">
              <Link href={ROUTES.PARTNER}>View Pricing & Post Job</Link>
            </Button>
          </motion.div>

          {/* Soft trust signal */}
          <motion.p
            className={cn('text-center', muted.default, size.xs)}
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