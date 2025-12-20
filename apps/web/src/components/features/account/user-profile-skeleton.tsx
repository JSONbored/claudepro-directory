'use client';

/**
 * User Profile Skeleton
 *
 * Perfectly matches the structure of /u/[slug] page:
 * - Hero/Profile Header: Avatar, name, bio, ProfileSocialStats, website link, FollowButton
 * - ProfileStatsCard
 * - ProfileTabs with 3 tabs (Overview, Collections, Contributions)
 * - Each tab has different content sections
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_6 = Array.from({ length: 6 }, (_, i) => `skeleton-${i + 1}`);

/**
 * User Profile Skeleton
 */
export function UserProfileSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`bg-background min-h-screen`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Hero/Profile Header */}
      <section className="relative">
        <motion.div
          className="container mx-auto px-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          <div className="flex items-start justify-between pt-4">
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <Skeleton size="xl" width="xl" rounded="full" className="h-24 w-24 shrink-0" />

              {/* Content */}
              <div className="mt-4 space-y-3">
                <Skeleton size="xl" width="lg" className="h-9" />
                <Skeleton size="md" width="2xl" className="h-5" />

                {/* Social Stats */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-0.5">
                    <Skeleton size="sm" width="xs" />
                    <Skeleton size="xs" width="xs" />
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-0.5">
                    <Skeleton size="sm" width="xs" />
                    <Skeleton size="xs" width="xs" />
                  </div>
                </div>

                {/* Website link */}
                <div className="flex items-center gap-3">
                  <span>•</span>
                  <div className="flex items-center gap-0.5">
                    <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
                    <Skeleton size="sm" width="xs" />
                  </div>
                </div>
              </div>
            </div>

            {/* Follow Button */}
            <Skeleton size="md" width="lg" rounded="md" className="h-10" />
          </div>
        </motion.div>
      </section>

      {/* Content Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="space-y-6">
          {/* Profile Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton size="xl" width="md" className="mx-auto mb-2 h-8" />
                      <Skeleton size="xs" width="xs" className="mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profile Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                {/* Tabs */}
                <div className="flex gap-1 border-b pb-2">
                  <Skeleton size="md" width="lg" rounded="md" className="h-10" />
                  <Skeleton size="md" width="xl" rounded="md" className="h-10" />
                  <Skeleton size="md" width="xl" rounded="md" className="h-10" />
                </div>
              </CardHeader>
              <CardContent className="mt-6">
                {/* Content grid - Collections/Contributions */}
                <div className="grid gap-3 sm:grid-cols-2">
                  {KEYS_6.map((key, i) => {
                    return (
                      <motion.div
                        key={key}
                        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                        transition={{
                          ...SPRING.loading,
                          mass: 0.5,
                          delay: 0.4 + i * STAGGER.micro,
                        }}
                      >
                        <Card>
                          <CardHeader>
                            <div className="flex items-center gap-1">
                              <Skeleton size="sm" width="xs" rounded="full" className="h-5 w-5" />
                              <CardTitle className="text-sm">
                                <Skeleton size="sm" width="sm" />
                              </CardTitle>
                            </div>
                            <Skeleton size="xs" width="xs" className="mt-1" />
                          </CardHeader>
                          <CardContent>
                            <div className="flex items-center gap-1">
                              <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
                              <Skeleton size="xs" width="xs" />
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
        </div>
      </section>
    </motion.div>
  );
}
