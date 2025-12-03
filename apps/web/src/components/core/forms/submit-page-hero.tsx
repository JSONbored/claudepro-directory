/**
 * Submit Page Hero Component
 * Animated header section for the /submit page
 * Uses Motion.dev for staggered entrance animations
 */

'use client';

import { CheckCircle, Clock, Send, Sparkles, Users } from '@heyclaude/web-runtime/icons';
import {
  bgColor,
  borderColor,
  cluster,
  flexWrap,
  gap,
  grid,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  muted,
  overflow,
  padding,
  radius,
  size,
  stack,
  textColor,
  weight,
  zLayer,
  squareSize,
  maxWidth,
  display,
  position,
  absolute,
  borderWidth,
} from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { BorderBeam } from '@heyclaude/web-runtime/ui';

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

/**
 * Renders the hero section for the /submit page with animated visuals, feature badges, and contribution statistics.
 *
 * @param stats - Statistics shown in the hero: `{ total, pending, merged_this_week }`. `total` is displayed as the total number of contributed configs.
 * @param className - Optional additional className applied to the root card container.
 * @returns The hero React element for the /submit page.
 *
 * @see BorderBeam
 * @see motion
 * @see cn
 */
export function SubmitPageHero({ stats, className }: SubmitPageHeroProps) {
  return (
    <motion.div
      className={cn(
        position.relative,
        overflow.hidden,
        radius['2xl'],
        'border',
        borderColor['border/50'],
        bgColor.card,
        padding.relaxed,
        marginBottom.relaxed,
        className
      )}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* BorderBeam animation for visual interest */}
      <BorderBeam size={250} duration={20} colorFrom="#9333ea" colorTo="#a855f7" borderWidth={1} />

      <div className={cn(`${position.relative} ${grid.hero}`, zLayer.raised, gap.relaxed)}>
        {/* Left: Content */}
        <div className={stack.default}>
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div
              className={cn(
                `${display.inlineFlex} border ${padding.ySnug} ${size.sm}`,
                radius.full,
                borderColor['primary/20'],
                bgColor['primary/10'],
                cluster.compact,
                padding.xDefault
              )}
            >
              <motion.div variants={iconVariants}>
                <Sparkles className={cn(iconSize.sm, textColor.primary)} />
              </motion.div>
              <span className={cn(weight.medium, textColor.primary)}>Community Contributions</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 className={cn(weight.bold, size['4xl'], `lg:${size['5xl']}`)} variants={itemVariants}>
            Share Your Configuration
          </motion.h1>

          {/* Description */}
          <motion.p
            className={cn(maxWidth['2xl'], size.lg, muted.default)}
            variants={itemVariants}
          >
            Contribute to the largest Claude configuration library. No JSON formatting required - we
            handle the technical details!
          </motion.p>

          {/* Feature badges */}
          <motion.div
            className={cn(display.flex, flexWrap.wrap, alignItems.center, gap.default, muted.sm)}
            variants={itemVariants}
          >
            <div className={cluster.snug}>
              <CheckCircle className={cn(iconSize.sm, textColor.green)} />
              <span>Auto PR creation</span>
            </div>
            <div className={cluster.snug}>
              <Clock className={cn(iconSize.sm, textColor.blue)} />
              <span>Fast review</span>
            </div>
            <div className={cluster.snug}>
              <Users className={cn(iconSize.sm, textColor.purple500)} />
              <span>{stats.total}+ configs</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Illustration (hidden on mobile) */}
        <motion.div
          className={cn(`${display.none} lg:${display.flex}`, alignItems.center, justify.center)}
          variants={itemVariants}
        >
          <motion.div
            className={position.relative}
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={cn(
                `${squareSize.avatar4xl} ${display.flex} border`,
                radius['2xl'],
                borderColor['primary/20'],
                bgColor['primary/10'],
                alignItems.center,
                justify.center
              )}
            >
              <Send className={cn(iconSize['4xl'], textColor.primary)} />
            </div>

            {/* Animated pulse ring */}
            <motion.div
              className={cn(`${absolute.inset} ${borderWidth['2']}`, radius['2xl'], borderColor['primary/30'])}
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