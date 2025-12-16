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
import { SPRING, STAGGER, wrap, gap, spaceY, paddingBottom, marginBottom, paddingLeft } from '@heyclaude/web-runtime/design-system';
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
      className={`${spaceY.default}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {KEYS_6.map((key, index) => {

        return (
          <motion.div
            key={key}
            className={`relative ${paddingBottom.default} last:${paddingBottom.default}`}
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
                <div className={`${paddingBottom.default} md:sticky md:top-8`}>
                  {/* Date */}
                  <Skeleton size="sm" width="xs" className={`${marginBottom.compact}`} />
                  {/* Version badge */}
                  <Skeleton size="md" width="md" rounded="lg" className="h-10 w-10" />
                </div>
              </div>

              {/* Right: Content */}
              <div className={`relative flex-1 ${paddingBottom.default} ${paddingLeft.default} md:${paddingLeft.relaxed}`}>
                {/* Vertical timeline line */}
                <div className="hidden md:block absolute top-2 left-0 w-px h-full bg-border">
                  {/* Timeline dot */}
                  <div className={`hidden md:block absolute -translate-x-1/2 size-3 bg-primary rounded-full z-10`} />
                </div>

                <div className={`relative z-10 ${spaceY.relaxed}`}>
                  {/* Title */}
                  <div className={`flex flex-col ${gap.tight}`}>
                    <Skeleton size="lg" width="3/4" className="h-8" />
                    
                    {/* Tags */}
                    <div className={`${wrap} ${gap.compact}`}>
                      <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                      <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                      <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                    </div>
                  </div>

                  {/* Content prose */}
                  <div className={`${spaceY.default}`}>
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
