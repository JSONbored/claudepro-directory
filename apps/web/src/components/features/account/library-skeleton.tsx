'use client';

/**
 * Library Page Skeleton
 * 
 * Perfectly matches /account/library structure:
 * - Header (title + counts + "New Collection" button)
 * - Tabs (Bookmarks/Collections)
 * - Content cards (bookmarks list or collections grid)
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';

const KEYS_6 = Array.from({ length: 6 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Library page skeleton matching exact layout
 */
export function LibrarySkeleton() {
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

      {/* Tabs */}
      <motion.div
        initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        <div className="grid w-full max-w-md grid-cols-2 gap-2 rounded-lg border p-1">
          <Skeleton size="md" width="3xl" rounded="md" className="h-10" />
          <Skeleton size="md" width="3xl" rounded="md" className="h-10" />
        </div>
      </motion.div>

      {/* Content - Bookmarks list (default tab) */}
      <motion.div
        className="grid gap-4"
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.3 }}
      >
        {KEYS_6.map((key, i) => (
          <motion.div
            key={key}
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.4 + i * STAGGER.micro }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
                      <Skeleton size="md" width="md" className="h-6" />
                    </div>
                    <Skeleton size="sm" width="2xl" className="h-4" />
                  </div>
                  <Skeleton size="sm" width="xs" rounded="md" className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton size="xs" width="xs" className="h-3" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
