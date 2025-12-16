'use client';

/**
 * Community Directory Skeleton
 * 
 * Perfectly matches the structure of /community/directory page:
 * - Header with title and description (centered, max-w-3xl)
 * - Two-column layout: Main (3 cols) + Sidebar (1 col, desktop only)
 * - Main: DirectoryTabs with 3 tabs + ProfileSearchClient grid
 * - Sidebar: ContributorsSidebar with trending/new members cards
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, padding, gap, spaceY, marginBottom, paddingX, paddingY, marginX, size } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_9 = Array.from({ length: 9 }, (_, i) => `skeleton-${i + 1}`);
const KEYS_5 = Array.from({ length: 5 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Profile card skeleton matching ProfileCard structure
 */
function ProfileCardSkeleton() {
  return (
    <Card>
      <CardContent className={`${padding.default}`}>
        <div className={`flex items-start ${gap.compact}`}>
          {/* Avatar */}
          <Skeleton size="lg" width="lg" rounded="full" className="h-12 w-12 shrink-0" />
          {/* Content */}
          <div className={`flex-1 ${spaceY.compact}`}>
            <Skeleton size="md" width="2/3" />
            <Skeleton size="sm" width="3xl" />
            <div className={`flex ${gap.tight}`}>
              <Skeleton size="xs" width="xs" rounded="full" />
              <Skeleton size="xs" width="xs" rounded="full" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Directory tabs skeleton matching DirectoryTabs structure
 */
function DirectoryTabsSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <div className="w-full">
      {/* Tabs list */}
      <div className={`${marginBottom.comfortable} flex ${gap.tight}`}>
        <Skeleton size="md" width="lg" rounded="md" className="h-10" />
        <Skeleton size="md" width="xl" rounded="md" className="h-10" />
        <Skeleton size="md" width="lg" rounded="md" className="h-10" />
      </div>
      {/* Tab content - Profile grid */}
      <div className={`grid grid-cols-1 ${gap.default} sm:grid-cols-2 lg:grid-cols-3`}>
        {KEYS_9.map((key, i) => {
          return (
            <motion.div
              key={key}
              initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{
                ...SPRING.loading,
                mass: 0.5,
                delay: i * STAGGER.micro,
              }}
            >
              <ProfileCardSkeleton />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Contributors sidebar skeleton matching ContributorsSidebar structure
 */
function ContributorsSidebarSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <aside className={`${spaceY.relaxed}`}>
      {/* Trending Contributors Card */}
      <Card>
        <CardHeader>
          <div className={`flex items-center ${gap.tight}`}>
            <Skeleton size="sm" width="xs" rounded="full" className="h-4 w-4" />
            <CardTitle className={`${size.sm}`}>
              <Skeleton size="sm" width="sm" />
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className={`${spaceY.default}`}>
          {KEYS_5.map((key, i) => {
            return (
              <motion.div
                key={key}
                className={`flex items-center ${gap.compact} rounded-lg ${padding.tight}`}
                initial={!prefersReducedMotion ? { opacity: 0, x: -10 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                transition={{
                  ...SPRING.loading,
                  mass: 0.5,
                  delay: i * STAGGER.micro,
                }}
              >
                <div className="relative shrink-0">
                  <Skeleton size="lg" width="lg" rounded="full" className="h-10 w-10" />
                  {i < 3 && (
                    <Skeleton
                      size="xs"
                      width="xs"
                      rounded="full"
                      className="absolute -right-1 -bottom-1 h-3 w-3"
                    />
                  )}
                </div>
                <div className={`min-w-0 flex-1 ${spaceY.tight}`}>
                  <Skeleton size="sm" width="2/3" />
                  <Skeleton size="xs" width="xs" />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* New Members Card */}
      <Card>
        <CardHeader>
          <CardTitle className={`${size.sm}`}>
            <Skeleton size="sm" width="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className={`${spaceY.default}`}>
          {KEYS_5.map((key, i) => {
            return (
              <motion.div
                key={key}
                className={`flex items-center ${gap.compact} rounded-lg ${padding.tight}`}
                initial={!prefersReducedMotion ? { opacity: 0, x: -10 } : false}
                animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
                transition={{
                  ...SPRING.loading,
                  mass: 0.5,
                  delay: (KEYS_5.length + i) * STAGGER.micro,
                }}
              >
                <Skeleton size="md" width="md" rounded="full" className="h-8 w-8 shrink-0" />
                <div className={`min-w-0 flex-1 ${spaceY.tight}`}>
                  <Skeleton size="sm" width="2/3" />
                  <Skeleton size="xs" width="xs" />
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>

      {/* Community Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle className={`${size.sm}`}>
            <Skeleton size="sm" width="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className={`${spaceY.compact}`}>
          <div className="flex items-center justify-between">
            <Skeleton size="xs" width="xs" />
            <Skeleton size="xs" width="xs" rounded="full" />
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

/**
 * Community Directory Skeleton
 * Perfectly matches /community/directory page structure
 */
export function CommunityDirectorySkeleton() {
  return (
    <motion.div
      className={`container ${marginX.auto} ${paddingX.default} ${paddingY.relaxed}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header - Centered, max-w-3xl */}
      <motion.div
        className={`${marginX.auto} ${marginBottom.loose} max-w-3xl text-center`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <Skeleton size="xl" width="lg" className={`${marginBottom.default} ${marginX.auto} h-10`} />
        <Skeleton size="md" width="2xl" className={`${marginX.auto} h-6`} />
      </motion.div>

      {/* Two-column layout: Main (3 cols) + Sidebar (1 col) */}
      <div className={`grid grid-cols-1 ${gap.relaxed} lg:grid-cols-4`}>
        {/* Main Content - Tabbed User Grid */}
        <motion.div
          className="lg:col-span-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.2 }}
        >
          <DirectoryTabsSkeleton />
        </motion.div>

        {/* Sidebar - Desktop only */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
        >
          <ContributorsSidebarSkeleton />
        </motion.div>
      </div>
    </motion.div>
  );
}
