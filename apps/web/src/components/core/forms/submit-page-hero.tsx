/**
 * Submit Page Hero Component
 * Animated header section for the /submit page
 * Uses Motion.dev for staggered entrance animations
 */

'use client';

import { CheckCircle, Clock, Send, Sparkles, Users } from '@heyclaude/web-runtime/icons';
import { cn, UI_CLASSES, BorderBeam } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';

interface SubmitPageHeroProps {
  className?: string;
  stats: {
    merged_this_week: number;
    pending: number;
    total: number;
  };
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
      duration: DURATION.moderate,
      staggerChildren: STAGGER.fast,
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
    transition: { duration: DURATION.slow },
  },
};

/**
 * Icon animation: Scale in with spring
 */
const iconVariants = {
  hidden: { scale: 0 },
  visible: {
    scale: 1,
    transition: SPRING.icon,
  },
};

/**
 * Renders the animated hero section for the /submit page showing contribution messaging, feature badges, and a decorative illustration.
 *
 * @param stats - Aggregated contribution statistics
 * @param stats.merged_this_week - Number of configurations merged this week
 * @param stats.pending - Number of pending contributions
 * @param stats.total - Total number of contributed configurations (displayed in the UI)
 * @param className - Optional additional className applied to the root container
 *
 * @returns A React element representing the Submit page hero section
 *
 * @see BorderBeam
 * @see UI_CLASSES
 * @see cn
 */
export function SubmitPageHero({ stats, className }: SubmitPageHeroProps) {
  return (
    <motion.div
      className={cn(
        'border-border/50 bg-card relative overflow-hidden rounded-2xl border',
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
                'border-primary/20 bg-primary/10 inline-flex rounded-full border',
                UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2,
                UI_CLASSES.PADDING_X_DEFAULT,
                'py-1.5',
                UI_CLASSES.TEXT_SM
              )}
            >
              <motion.div variants={iconVariants}>
                <Sparkles className={cn(UI_CLASSES.ICON_SM, 'text-primary')} />
              </motion.div>
              <span className="text-primary font-medium">Community Contributions</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 className="text-4xl font-bold lg:text-5xl" variants={itemVariants}>
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
            transition={SPRING.smooth}
          >
            <div
              className={cn(
                'border-primary/20 bg-primary/10 h-32 w-32 rounded-2xl border',
                UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_CENTER
              )}
            >
              <Send className="text-primary h-16 w-16" />
            </div>

            {/* Animated pulse ring */}
            <motion.div
              className="border-primary/30 absolute inset-0 rounded-2xl border-2"
              initial={{ scale: 1, opacity: 1 }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: DURATION.maximum,
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