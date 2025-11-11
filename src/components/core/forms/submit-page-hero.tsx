/**
 * Submit Page Hero Component
 * Animated header section for the /submit page
 * Uses Motion.dev for staggered entrance animations
 */

'use client';

import { motion } from 'motion/react';
import { BorderBeam } from '@/src/components/core/magic/border-beam';
import { CheckCircle, Clock, Send, Sparkles, Users } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';

interface SubmitPageHeroProps {
  stats: {
    total: number;
    pending: number;
    merged_this_week: number;
  };
  className?: string;
}

/**
 * Container animation: Fade in + slide up
 */
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
};

/**
 * Child animation: Fade in
 */
const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4 },
  },
};

/**
 * Icon animation: Scale in with spring
 */
const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 15,
    },
  },
};

export function SubmitPageHero({ stats, className }: SubmitPageHeroProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-card',
        UI_CLASSES.PADDING_RELAXED,
        UI_CLASSES.MARGIN_RELAXED,
        className
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* BorderBeam animation for visual interest */}
      <BorderBeam size={250} duration={20} colorFrom="#9333ea" colorTo="#a855f7" borderWidth={1} />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Left: Content */}
        <div className={UI_CLASSES.SPACE_Y_4}>
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div
              className={cn(
                'inline-flex rounded-full border border-primary/20 bg-primary/10',
                UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2,
                UI_CLASSES.PADDING_X_DEFAULT,
                'py-1.5',
                UI_CLASSES.TEXT_SM
              )}
            >
              <motion.div variants={iconVariants}>
                <Sparkles className={cn(UI_CLASSES.ICON_SM, 'text-primary')} />
              </motion.div>
              <span className="font-medium text-primary">Community Contributions</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 className="font-bold text-4xl lg:text-5xl" variants={itemVariants}>
            Share Your Configuration
          </motion.h1>

          {/* Description */}
          <motion.p
            className={cn('max-w-2xl', UI_CLASSES.TEXT_BODY_LG, UI_CLASSES.TEXT_MUTED)}
            variants={itemVariants}
          >
            Contribute to the largest Claude configuration library. No JSON formatting required - we
            handle the technical details!
          </motion.p>

          {/* Feature badges */}
          <motion.div
            className={cn(UI_CLASSES.FLEX_WRAP_ITEMS_CENTER_GAP_3, UI_CLASSES.TEXT_SM_MUTED)}
            variants={itemVariants}
          >
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
              <CheckCircle className={cn(UI_CLASSES.ICON_SM, UI_CLASSES.ICON_SUCCESS)} />
              <span>Auto PR creation</span>
            </div>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
              <Clock className={cn(UI_CLASSES.ICON_SM, UI_CLASSES.ICON_INFO)} />
              <span>Fast review</span>
            </div>
            <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
              <Users className={cn(UI_CLASSES.ICON_SM, 'text-purple-500')} />
              <span>{stats.total}+ configs</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Illustration (hidden on mobile) */}
        <motion.div
          className={cn('hidden lg:flex', UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER)}
          variants={itemVariants}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={cn(
                'h-32 w-32 rounded-2xl border border-primary/20 bg-primary/10',
                UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER
              )}
            >
              <Send className="h-16 w-16 text-primary" />
            </div>

            {/* Animated pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-2xl border-2 border-primary/30"
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
