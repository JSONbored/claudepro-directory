'use client';

/**
 * Homepage Skeleton
 * 
 * Perfectly matches the structure of / page:
 * - Hero section: Title, description, search bar
 * - RecentlyViewedRail (horizontal scroll)
 * - HomepageContentServer: Category sections with featured items
 * - TopContributors (lazy loaded)
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { motion } from 'motion/react';
import { Card, CardContent } from '@heyclaude/web-runtime/ui';

const KEYS_9 = Array.from({ length: 9 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Homepage Skeleton
 */
export function HomepageSkeleton() {
  return (
    <motion.div
      className="bg-background min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      <div className="relative overflow-hidden">
        {/* Hero Section */}
        <motion.section
          className="border-border/50 relative border-b"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          <div className="relative z-10 container mx-auto px-4 py-10 sm:py-16 lg:py-24">
            <div className="mx-auto max-w-3xl text-center space-y-6">
              {/* Title */}
              <div className="space-y-3">
                <Skeleton size="xl" width="lg" className="mx-auto h-10" />
                <Skeleton size="xl" width="md" className="mx-auto h-10" />
              </div>
              
              {/* Description */}
              <Skeleton size="md" width="2xl" className="mx-auto h-6" />
              
              {/* Search bar */}
              <Skeleton size="xl" width="3xl" className="mx-auto h-14" />
            </div>
          </div>
        </motion.section>

        {/* Recently Viewed Rail */}
        <motion.section
          className="border-border/50 border-b bg-muted/30 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING.smooth, delay: 0.2 }}
        >
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 overflow-x-auto">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  size="md"
                  width="md"
                  rounded="lg"
                  className="h-32 w-48 shrink-0"
                />
              ))}
            </div>
          </div>
        </motion.section>

        {/* Homepage Content Sections */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
        >
          <div className="container mx-auto px-4 py-12 space-y-16">
            {/* Category Sections */}
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
              <motion.section
                key={sectionIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.loading,
                  delay: 0.4 + sectionIndex * 0.1,
                }}
              >
                {/* Section Header */}
                <div className="mb-8 flex items-center justify-between">
                  <Skeleton size="lg" width="lg" className="h-8" />
                  <Skeleton size="sm" width="xs" rounded="md" className="h-8" />
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {KEYS_9.map((key, i) => {
                    const prefersReducedMotion =
                      typeof window !== 'undefined' &&
                      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

                    return (
                      <motion.div
                        key={key}
                        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                        transition={{
                          ...SPRING.loading,
                          mass: 0.5,
                          delay: 0.5 + sectionIndex * 0.1 + i * STAGGER.micro,
                        }}
                      >
                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-start gap-3">
                                <Skeleton size="md" width="md" rounded="md" className="h-12 w-12 shrink-0" />
                                <div className="flex-1 space-y-2">
                                  <Skeleton size="md" width="3/4" />
                                  <Skeleton size="sm" width="3xl" />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Skeleton size="xs" width="xs" rounded="full" />
                                <Skeleton size="xs" width="xs" rounded="full" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            ))}
          </div>
        </motion.div>

        {/* Top Contributors - Lazy loaded */}
        <motion.section
          className="border-border/50 border-t bg-muted/30 py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING.smooth, delay: 0.7 }}
        >
          <div className="container mx-auto px-4">
            <Skeleton size="lg" width="lg" className="mb-8 mx-auto h-8" />
            <div className="flex flex-wrap justify-center gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton
                  key={i}
                  size="md"
                  width="md"
                  rounded="full"
                  className="h-16 w-16"
                />
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
