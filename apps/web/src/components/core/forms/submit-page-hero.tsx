/**
 * Submit Page Hero Component
 * Animated header section for the /submit page
 * Uses Motion.dev for staggered entrance animations
 */

'use client';

import { CheckCircle, Clock, Send, Sparkles, Users } from '@heyclaude/web-runtime/icons';
import { cluster, iconSize, marginBottom, muted, padding, stack } from '@heyclaude/web-runtime/design-system';
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

export function SubmitPageHero({ stats, className }: SubmitPageHeroProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-card',
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

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Left: Content */}
        <div className={stack.default}>
          {/* Badge */}
          <motion.div variants={itemVariants}>
            <div
              className={cn(
                'inline-flex rounded-full border border-primary/20 bg-primary/10',
                cluster.compact,
                padding.xDefault,
                'py-1.5',
                'text-sm'
              )}
            >
              <motion.div variants={iconVariants}>
                <Sparkles className={cn(iconSize.sm, 'text-primary')} />
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
            className={cn('max-w-2xl text-lg', muted.default)}
            variants={itemVariants}
          >
            Contribute to the largest Claude configuration library. No JSON formatting required - we
            handle the technical details!
          </motion.p>

          {/* Feature badges */}
          <motion.div
            className={cn('flex flex-wrap items-center gap-3', `${muted.default} text-sm`)}
            variants={itemVariants}
          >
            <div className={cluster.snug}>
              <CheckCircle className={cn(iconSize.sm, 'text-green-600')} />
              <span>Auto PR creation</span>
            </div>
            <div className={cluster.snug}>
              <Clock className={cn(iconSize.sm, 'text-blue-600')} />
              <span>Fast review</span>
            </div>
            <div className={cluster.snug}>
              <Users className={cn(iconSize.sm, 'text-purple-500')} />
              <span>{stats.total}+ configs</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Illustration (hidden on mobile) */}
        <motion.div
          className={cn('hidden lg:flex items-center justify-center')}
          variants={itemVariants}
        >
          <motion.div
            className="relative"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <div
              className={cn(
                'h-32 w-32 rounded-2xl border border-primary/20 bg-primary/10 flex items-center justify-center'
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
