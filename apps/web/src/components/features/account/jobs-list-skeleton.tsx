'use client';

/**
 * Jobs List Skeleton
 * 
 * Perfectly matches /account/jobs structure:
 * - Header (title + count + "Post a Job" button)
 * - List of job cards with status badges, title, company, description, actions
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';

const KEYS_5 = Array.from({ length: 5 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Jobs list skeleton matching exact layout
 */
export function JobsListSkeleton() {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <div>
          <Skeleton size="xl" width="lg" className="mb-2 h-9" />
          <Skeleton size="sm" width="md" className="h-5" />
        </div>
        <Skeleton size="md" width="lg" rounded="md" className="h-10" />
      </motion.div>

      {/* Jobs list */}
      <motion.div
        className="grid gap-4"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        {KEYS_5.map((key, i) => (
          <motion.div
            key={key}
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
                      <Skeleton size="md" width="md" className="h-6" />
                      <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
                    </div>
                    <Skeleton size="lg" width="lg" className="h-7" />
                    <div className="flex items-center gap-2">
                      <Skeleton size="sm" width="xs" className="h-4" />
                      <Skeleton size="sm" width="xs" className="h-4" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton size="sm" width="xs" rounded="md" className="h-8" />
                    <Skeleton size="sm" width="xs" rounded="md" className="h-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton size="sm" width="3xl" className="h-4" />
                  <Skeleton size="sm" width="2xl" className="h-4" />
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <Skeleton size="xs" width="xs" className="h-3" />
                  <div className="flex items-center gap-2">
                    <Skeleton size="xs" width="xs" rounded="md" className="h-6" />
                    <Skeleton size="xs" width="xs" rounded="md" className="h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
