/**
 * Submit Page Hero Component
 * Animated header section for the /submit page
 * Uses Motion.dev for staggered entrance animations
 */

'use client';

import { CheckCircle, Clock, Send, Sparkles, Users } from '@heyclaude/web-runtime/icons';
import { cn, BorderBeam } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, DURATION } from '@heyclaude/web-runtime/design-system';
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
        'border-border/50 bg-card relative mb-8 overflow-hidden rounded-2xl border py-8',
        className
      )}
      initial="hidden"
      animate="visible"
      variants={createContainerVariants(shouldReduceMotion)}
    >
      {/* BorderBeam animation for visual interest */}
      <BorderBeam size={250} duration={20} colorFrom="#9333ea" colorTo="#a855f7" borderWidth={1} />

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Left: Content */}
        <div className="space-y-6">
          {/* Badge */}
          <motion.div variants={createItemVariants(shouldReduceMotion)}>
            <div
              className={cn(
                'border-primary/20 bg-primary/10 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm'
              )}
            >
              <motion.div variants={createIconVariants(shouldReduceMotion)}>
                <Sparkles className="text-primary h-4 w-4" />
              </motion.div>
              <span className="text-primary font-medium">Community Contributions</span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.h1
            className="text-4xl font-bold lg:text-5xl"
            variants={createItemVariants(shouldReduceMotion)}
          >
            Share Your Configuration
          </motion.h1>

          {/* Description */}
          <motion.p
            className={cn('text-muted-foreground max-w-2xl text-lg leading-relaxed')}
            variants={createItemVariants(shouldReduceMotion)}
          >
            Contribute to the largest Claude configuration library. No JSON formatting required - we
            handle the technical details!
          </motion.p>

          {/* Feature badges */}
          <motion.div
            className={cn('text-muted-foreground flex flex-wrap items-center gap-3 text-sm')}
            variants={createItemVariants(shouldReduceMotion)}
          >
            <div className="flex items-center gap-1.5"> {/* 6px ≈ 0.375rem (gap-1.5) */}
              <CheckCircle className="h-4 w-4 text-success" />
              <span>Auto PR creation</span>
            </div>
            <div className="flex items-center gap-1.5"> {/* 6px ≈ 0.375rem (gap-1.5) */}
              <Clock className="h-4 w-4 text-info" />
              <span>Fast review</span>
            </div>
            <div className="flex items-center gap-1.5"> {/* 6px ≈ 0.375rem (gap-1.5) */}
              <Users className="h-4 w-4 text-primary" />
              <span>{stats.total}+ configs</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Illustration (hidden on mobile) */}
        <motion.div
          className={cn('hidden items-center justify-center lg:flex')}
          variants={createItemVariants(shouldReduceMotion)}
        >
          <motion.div
            className="relative"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            transition={SPRING.smooth}
          >
            <div
              className={cn(
                'border-primary/20 bg-primary/10 flex h-32 w-32 items-center justify-center rounded-2xl border'
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
