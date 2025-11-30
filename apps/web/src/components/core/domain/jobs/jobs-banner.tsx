/**
 * JobsPromo - Sticky sidebar promotion for job board listings
 * Uses animations instead of gradients
 */

'use client';

import {
  between,
  cluster,
  iconSize,
  marginBottom,
  muted,
  padding,
  stack,
} from '@heyclaude/web-runtime/design-system';
import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Check, TrendingUp } from '@heyclaude/web-runtime/icons';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@heyclaude/web-runtime/ui';
import { Card, CardContent } from '@heyclaude/web-runtime/ui';

export function JobsPromo() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card className="overflow-hidden border-accent/20">
        <CardContent className={cn(stack.default, padding.comfortable)}>
          {/* Hook with honest growth story */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className={cn(marginBottom.tight, 'font-bold text-xl leading-tight')}>
              Hire Claude Developers
            </h3>
            <p className={cn(muted.default, 'text-sm')}>
              Growing community of AI engineers actively building with Claude
            </p>
          </motion.div>

          {/* Real growth metrics (honest but positive) */}
          <motion.div
            className={cn(
              stack.compact,
              'rounded-lg border bg-card/50',
              padding.compact
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          >
            <div className={cn(between.center, 'text-sm')}>
              <span className={muted.default}>Active community</span>
              <motion.span
                className="font-semibold"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                1,700/month
              </motion.span>
            </div>
            <div className={cn(between.center, 'text-sm')}>
              <span className={muted.default}>Growth rate</span>
              <motion.span
                className={cn(
                  cluster.tight,
                  'font-semibold',
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
                className="flex items-start gap-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <Check
                  className={cn('mt-0.5 shrink-0', iconSize.sm, 'text-accent')}
                />
                <span className="text-sm">{text}</span>
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
            className={cn('text-center', muted.default, 'text-xs')}
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
