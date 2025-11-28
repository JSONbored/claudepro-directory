/**
 * JobsPromo - Sticky sidebar promotion for job board listings
 * Uses animations instead of gradients
 */

'use client';

import { ROUTES } from '@heyclaude/web-runtime/data/config/constants';
import { Check, TrendingUp } from '@heyclaude/web-runtime/icons';
import { cn, UI_CLASSES } from '@heyclaude/web-runtime/ui';
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
        <CardContent className={cn(UI_CLASSES.SPACE_Y_4, UI_CLASSES.PADDING_COMFORTABLE)}>
          {/* Hook with honest growth story */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <h3 className={cn(UI_CLASSES.MARGIN_TIGHT, 'font-bold text-xl leading-tight')}>
              Hire Claude Developers
            </h3>
            <p className={UI_CLASSES.TEXT_SM_MUTED}>
              Growing community of AI engineers actively building with Claude
            </p>
          </motion.div>

          {/* Real growth metrics (honest but positive) */}
          <motion.div
            className={cn(
              UI_CLASSES.SPACE_Y_2,
              'rounded-lg border bg-card/50',
              UI_CLASSES.PADDING_COMPACT
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
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

          {/* Value props (factual, not fake) */}
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
