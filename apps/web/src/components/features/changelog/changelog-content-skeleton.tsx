'use client';

/**
 * Changelog Content Skeleton
 *
 * Perfectly matches ChangelogTimelineView structure:
 * - Two-column layout: Left (sticky timeline markers) + Right (content)
 * - Each entry: date, version badge, title, tags, content
 * - Beautiful animations with staggered mount
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';

const KEYS_6 = Array.from({ length: 6 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Renders a skeleton UI that perfectly mirrors the changelog timeline layout.
 *
 * Two-column layout:
 * - Left: Sticky timeline markers (date + version badge)
 * - Right: Changelog entry content (title, tags, prose)
 *
 * @returns The React element containing skeleton placeholders for the timeline view.
 *
 * @see ChangelogTimelineView
 */
export function ChangelogContentSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {KEYS_6.map((key, index) => {
        return (
          <motion.div
            key={key}
            className="relative pb-4 last:pb-4"
            initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{
              ...SPRING.loading,
              mass: 0.5,
              delay: index * STAGGER.micro,
            }}
          >
            <div className="flex flex-col gap-y-6 md:flex-row">
              {/* Left: Timeline markers (sticky) */}
              <div className="flex-shrink-0 md:w-48">
                <div className="pb-4 md:sticky md:top-8">
                  {/* Date */}
                  <Skeleton size="sm" width="xs" className="mb-2" />
                  {/* Version badge */}
                  <Skeleton size="md" width="md" rounded="lg" className="h-10 w-10" />
                </div>
              </div>

              {/* Right: Content */}
              <div className="relative flex-1 pb-4 pl-4 md:pl-8">
                {/* Vertical timeline line */}
                <div className="bg-border absolute top-2 left-0 hidden h-full w-px md:block">
                  {/* Timeline dot */}
                  <div className="bg-primary absolute z-10 size-3 -translate-x-1/2 rounded-full md:block" />
                </div>

                <div className="relative z-10 space-y-6">
                  {/* Title */}
                  <div className="flex flex-col gap-1">
                    <Skeleton size="lg" width="3/4" className="h-8" />

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                      <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                      <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                    </div>
                  </div>

                  {/* Content prose */}
                  <div className="space-y-3">
                    <Skeleton size="md" width="3xl" />
                    <Skeleton size="sm" width="3xl" />
                    <Skeleton size="sm" width="3xl" />
                    <Skeleton size="sm" width="2/3" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
