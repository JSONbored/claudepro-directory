/**
 * Submit Page Hero Component
 * Animated header section for the /submit page
 * Uses Motion.dev for staggered entrance animations
 */

'use client';

import { CheckCircle, Clock, Send, Sparkles, Users } from '@heyclaude/web-runtime/icons';
import { cn, BorderBeam } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, DURATION, paddingY, marginBottom, spaceY, cluster, paddingX, size, muted, leading, wrap, gap, iconSize, center, weight } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
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
const createContainerVariants = (shouldReduceMotion: boolean) => ({
  hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 },
  visible: shouldReduceMotion
    ? {
        opacity: 1,
        transition: {
          duration: DURATION.moderate,
        },
      }
    : {
        opacity: 1,
        y: 0,
        transition: {
          duration: DURATION.moderate,
          staggerChildren: STAGGER.fast,
        },
      },
});

/**
 * Child animation: Fade in
 */
const createItemVariants = (shouldReduceMotion: boolean) => ({
  hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
  visible: shouldReduceMotion
    ? {
        opacity: 1,
        transition: { duration: DURATION.slow },
      }
    : {
        opacity: 1,
        y: 0,
        transition: { duration: DURATION.slow },
      },
});

/**
 * Icon animation: Scale in with spring
 */
const createIconVariants = (shouldReduceMotion: boolean) => ({
  hidden: shouldReduceMotion ? { opacity: 0 } : { scale: 0 },
  visible: shouldReduceMotion
    ? {
        opacity: 1,
        transition: SPRING.icon,
      }
    : {
        scale: 1,
        transition: SPRING.icon,
      },
});

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
 * @see cn
 */
export function SubmitPageHero({ stats, className }: SubmitPageHeroProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(
        'border-border/50 bg-card relative overflow-hidden rounded-2xl border',
        paddingY.relaxed,
        marginBottom.relaxed,
        className
      )}
      initial="hidden"
      animate="visible"
      variants={createContainerVariants(shouldReduceMotion)}
    >
      {/* BorderBeam animation for visual interest */}
      <BorderBeam size={250} duration={20} colorFrom="#9333ea" colorTo="#a855f7" borderWidth={1} />

      <div className={`relative z-10 grid ${gap.comfortable} lg:grid-cols-[1fr_auto]`}>
        {/* Left: Content */}
        <div className={spaceY.comfortable}>
          {/* Badge */}
          <motion.div variants={createItemVariants(shouldReduceMotion)}>
            <div
              className={cn(
                'border-primary/20 bg-primary/10 inline-flex rounded-full border',
                cluster.compact,
                paddingX.default,
                'py-1.5',
                size.sm
              )}
            >
              <motion.div variants={createIconVariants(shouldReduceMotion)}>
                <Sparkles className={cn(iconSize.sm, 'text-primary')} />
              </motion.div>
              <span className={`text-primary ${weight.medium}`}>Community Contributions</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1 className={`${size['4xl']} ${weight.bold} lg:text-5xl`} variants={createItemVariants(shouldReduceMotion)}>
            Share Your Configuration
          </motion.h1>

          {/* Description */}
          <motion.p
            className={cn('max-w-2xl', `${size.lg} ${leading.relaxed}`, muted.default)}
            variants={createItemVariants(shouldReduceMotion)}
          >
            Contribute to the largest Claude configuration library. No JSON formatting required - we
            handle the technical details!
          </motion.p>

          {/* Feature badges */}
          <motion.div
            className={cn(`${wrap} items-center ${gap.default}`, `${size.sm} ${muted.default}`)}
            variants={createItemVariants(shouldReduceMotion)}
          >
            <div className={cn(cluster.tight, gap['1.5'])}>
              <CheckCircle className={cn(iconSize.sm, 'text-green-500 dark:text-green-400')} />
              <span>Auto PR creation</span>
            </div>
            <div className={cn(cluster.tight, gap['1.5'])}>
              <Clock className={cn(iconSize.sm, 'text-blue-500 dark:text-blue-400')} />
              <span>Fast review</span>
            </div>
            <div className={cn(cluster.tight, gap['1.5'])}>
              <Users className={cn(iconSize.sm, 'text-purple-500')} />
              <span>{stats.total}+ configs</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Illustration (hidden on mobile) */}
        <motion.div
          className={cn('hidden lg:flex', center)}
          variants={createItemVariants(shouldReduceMotion)}
        >
          <motion.div
            className="relative"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={SPRING.smooth}
          >
            <div
              className={cn(
                'border-primary/20 bg-primary/10 h-32 w-32 rounded-2xl border',
                center
              )}
            >
              <Send className="text-primary h-16 w-16" />
            </div>

            {/* Animated pulse ring */}
            {!shouldReduceMotion && (
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
            )}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}