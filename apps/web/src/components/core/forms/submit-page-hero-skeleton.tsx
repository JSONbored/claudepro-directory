'use client';

/**
 * Submit Page Hero Skeleton
 * 
 * Perfectly matches SubmitPageHero structure:
 * - BorderBeam animated border
 * - Badge with icon
 * - Title
 * - Description
 * - Feature badges (3 items)
 * - Illustration (right side, desktop only)
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';

/**
 * Submit page hero skeleton matching exact layout
 */
export function SubmitPageHeroSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="border-border/50 bg-card relative overflow-hidden rounded-2xl border p-8 mb-8"
      initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
      animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
      transition={{ ...SPRING.smooth, delay: 0.1 }}
    >
      <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto]">
        {/* Left: Content */}
        <div className="space-y-4">
          {/* Badge */}
          <motion.div
            initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
            transition={{ ...SPRING.loading, delay: 0.2 }}
          >
            <Skeleton size="sm" width="md" rounded="full" className="h-7" />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.25 }}
          >
            <Skeleton size="xl" width="xl" className="h-12" />
          </motion.div>

          {/* Description */}
          <motion.div
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.3 }}
          >
            <Skeleton size="md" width="3xl" className="h-6" />
          </motion.div>

          {/* Feature badges */}
          <motion.div
            className="flex flex-wrap items-center gap-3"
            initial={!prefersReducedMotion ? { opacity: 0 } : false}
            animate={!prefersReducedMotion ? { opacity: 1 } : {}}
            transition={{ ...SPRING.loading, delay: 0.35 }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                transition={{ ...SPRING.loading, delay: 0.4 + i * STAGGER.micro }}
                className="flex items-center gap-1.5"
              >
                <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
                <Skeleton size="sm" width="xs" className="h-4" />
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Right: Illustration (hidden on mobile) */}
        <motion.div
          className="hidden lg:flex lg:items-center lg:justify-center"
          initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
          transition={{ ...SPRING.loading, delay: 0.4 }}
        >
          <Skeleton size="xl" width="xl" rounded="xl" className="h-32 w-32 rounded-2xl" />
        </motion.div>
      </div>
    </motion.div>
  );
}
