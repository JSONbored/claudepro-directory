'use client';

/**
 * Search Page Skeleton
 * 
 * Perfectly matches the structure of /search page:
 * - Header with title
 * - Two-column layout: Main (ContentSearchClient) + Sidebar (ContentSidebar)
 * - ContentSearchClient has search bar, filters, results grid
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_9 = Array.from({ length: 9 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Search page skeleton matching exact layout
 */
export function SearchPageSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.main
      className="container mx-auto px-4 py-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header */}
      <motion.h1
        className="mb-8 text-4xl font-bold"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="xl" width="lg" className="h-10" />
      </motion.h1>

      {/* Two-column layout: Main + Sidebar */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Main Content - ContentSearchClient */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.2 }}
        >
          <div className="space-y-6">
            {/* Search bar */}
            <Skeleton size="xl" width="3xl" className="h-14" />

            {/* Filters/Quick tags */}
            <div className="flex flex-wrap gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} size="sm" width="xs" rounded="full" className="h-8" />
              ))}
            </div>

            {/* Results grid */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {KEYS_9.map((key, i) => {
                return (
                  <motion.div
                    key={key}
                    initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      ...SPRING.loading,
                      mass: 0.5,
                      delay: 0.3 + i * STAGGER.micro,
                    }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Skeleton size="md" width="md" rounded="md" className="h-8 w-8 shrink-0" />
                            <div className="flex flex-col gap-2 flex-1">
                              <Skeleton size="md" width="3/4" />
                              <Skeleton size="sm" width="3xl" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Skeleton size="xs" width="xs" rounded="full" />
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
          </div>
        </motion.div>

        {/* Sidebar - ContentSidebar */}
        <motion.aside
          className="hidden xl:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.4 }}
        >
          <div className="space-y-6">
            {/* Jobs Promo Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  <Skeleton size="sm" width="sm" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton size="md" width="3xl" />
                <Skeleton size="sm" width="3xl" />
                <Skeleton size="sm" width="2/3" />
              </CardContent>
            </Card>

            {/* Recently Viewed */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  <Skeleton size="sm" width="sm" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Skeleton size="sm" width="sm" rounded="md" className="h-10 w-10" />
                    <div className="flex flex-col gap-1 flex-1">
                      <Skeleton size="sm" width="2/3" />
                      <Skeleton size="xs" width="xs" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </motion.aside>
      </div>
    </motion.main>
  );
}
