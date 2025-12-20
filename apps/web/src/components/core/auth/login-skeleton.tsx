'use client';

/**
 * Login Page Skeleton
 *
 * Perfectly matches /login structure:
 * - SplitAuthLayout: Brand panel (left) + Auth card (right) on desktop
 * - Stacked layout on mobile with mobile header
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';

/**
 * Login page skeleton matching exact layout
 */
export function LoginSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="bg-background relative min-h-dvh min-h-screen overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Desktop: Side-by-side layout */}
      <div className="hidden min-h-dvh min-h-screen lg:grid lg:grid-cols-2">
        {/* Left: Brand content */}
        <motion.div
          className="flex min-h-dvh min-h-screen items-center justify-center px-4 xl:px-4"
          initial={!prefersReducedMotion ? { opacity: 0, x: -30 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
          transition={SPRING.smooth}
        >
          <div className="flex max-w-2xl flex-col items-start justify-center gap-8">
            {/* Logo */}
            <motion.div
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.smooth, delay: 0.1 }}
            >
              <Skeleton size="xl" width="xl" rounded="lg" className="mb-6 h-16 w-16" />
            </motion.div>
            {/* Title */}
            <motion.div
              className="space-y-4"
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.smooth, delay: 0.2 }}
            >
              <Skeleton size="xl" width="3xl" className="h-14" />
              <Skeleton size="md" width="2xl" className="h-6" />
            </motion.div>
          </div>
        </motion.div>

        {/* Right: Auth card */}
        <div className="flex min-h-dvh min-h-screen items-center justify-center px-8">
          <motion.div
            className="bg-card border-color-accent-primary w-full max-w-md rounded-2xl border p-4 shadow-2xl xl:p-12"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.smooth, delay: STAGGER.fast }}
          >
            <div className="w-full space-y-8">
              {/* Title and description */}
              <div className="mb-12 space-y-4 text-center">
                <Skeleton size="xl" width="lg" className="mx-auto h-9" />
                <Skeleton size="sm" width="md" className="mx-auto h-5" />
              </div>

              {/* OAuth buttons */}
              <div className="flex-center gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={!prefersReducedMotion ? { opacity: 0, scale: 0.8 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, scale: 1 } : {}}
                    transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
                  >
                    <Skeleton size="lg" width="lg" rounded="lg" className="h-12 w-12" />
                  </motion.div>
                ))}
              </div>

              {/* Newsletter opt-in tile */}
              <motion.div
                className="card-base mt-8 space-y-3 p-4"
                initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                transition={{ ...SPRING.loading, delay: 0.5 }}
              >
                <Skeleton size="md" width="md" className="h-6" />
                <Skeleton size="sm" width="3xl" className="h-4" />
                <Skeleton size="sm" width="2xl" className="h-4" />
                <div className="flex items-center gap-1">
                  <Skeleton size="sm" width="xs" rounded="md" className="h-5 w-5" />
                  <Skeleton size="sm" width="xs" className="h-4" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Mobile: Stacked layout */}
      <div className="flex min-h-dvh min-h-screen flex-col lg:hidden">
        {/* Mobile header */}
        <motion.div
          className="border-b p-4"
          initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
          animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          <Skeleton size="md" width="md" className="h-8" />
        </motion.div>

        {/* Auth card */}
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="bg-card border-color-accent-primary w-full max-w-md rounded-2xl border p-8">
            <div className="w-full space-y-8">
              {/* Title and description */}
              <div className="mb-12 space-y-4 text-center">
                <Skeleton size="xl" width="lg" className="mx-auto h-9" />
                <Skeleton size="sm" width="md" className="mx-auto h-5" />
              </div>

              {/* OAuth buttons */}
              <div className="flex-center gap-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} size="lg" width="lg" rounded="lg" className="h-12 w-12" />
                ))}
              </div>

              {/* Newsletter opt-in tile */}
              <div className="card-base mt-8 space-y-3 p-4">
                <Skeleton size="md" width="md" className="h-6" />
                <Skeleton size="sm" width="3xl" className="h-4" />
                <Skeleton size="sm" width="2xl" className="h-4" />
                <div className="flex items-center gap-1">
                  <Skeleton size="sm" width="xs" rounded="md" className="h-5 w-5" />
                  <Skeleton size="sm" width="xs" className="h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
