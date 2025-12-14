'use client';

/**
 * Account Dashboard Skeleton
 * 
 * Perfectly matches the structure of /account page:
 * - Header with title and welcome message
 * - 3 AnimatedStatsCard components in grid (Bookmarks, Tier, Member Since)
 * - AnimatedCard with Quick Actions (3 action rows)
 * - DashboardTabs with bookmarks and recommendations sections
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_3 = Array.from({ length: 3 }, (_, i) => `skeleton-${i + 1}`);
const KEYS_6 = Array.from({ length: 6 }, (_, i) => `skeleton-${i + 1}`);

/**
 * AnimatedStatsCard skeleton matching AnimatedStatsCard structure
 */
function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">
          <Skeleton size="sm" width="sm" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Skeleton size="md" width="md" rounded="md" className="h-5 w-5" />
          <Skeleton size="xl" width="md" className="h-8" />
        </div>
        <Skeleton size="xs" width="xs" className="mt-2" />
      </CardContent>
    </Card>
  );
}

/**
 * Quick action row skeleton
 */
function QuickActionRowSkeleton() {
  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex-1 space-y-1">
        <Skeleton size="sm" width="2/3" />
        <Skeleton size="xs" width="xs" />
      </div>
      <Skeleton size="sm" width="xs" rounded="md" className="h-6 w-6" />
    </div>
  );
}

/**
 * Account Dashboard Skeleton
 */
export function AccountDashboardSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="xl" width="lg" className="mb-2 h-9" />
        <Skeleton size="md" width="md" className="h-6" />
      </motion.div>

      {/* Stats cards - 3 in grid */}
      <motion.div
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        {KEYS_3.map((key, i) => {
          return (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...SPRING.loading,
                mass: 0.5,
                delay: 0.25 + i * STAGGER.micro,
              }}
            >
              <StatsCardSkeleton />
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {KEYS_3.map((key, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  ...SPRING.loading,
                  mass: 0.5,
                  delay: 0.45 + i * STAGGER.micro,
                }}
              >
                <QuickActionRowSkeleton />
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Dashboard Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            {/* Tabs */}
            <div className="flex gap-2 border-b pb-2">
              <Skeleton size="md" width="lg" rounded="md" className="h-10" />
              <Skeleton size="md" width="xl" rounded="md" className="h-10" />
            </div>
          </CardHeader>
          <CardContent className="mt-6">
            {/* Content grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {KEYS_6.map((key, i) => {
                return (
                  <motion.div
                    key={key}
                    initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      ...SPRING.loading,
                      mass: 0.5,
                      delay: 0.6 + i * STAGGER.micro,
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
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
