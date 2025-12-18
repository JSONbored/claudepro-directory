'use client';

/**
 * Homepage Skeleton
 * 
 * Perfectly matches the structure of / page:
 * - Hero section: Title (2 lines), description, search bar, category stats, partner marquee
 * - Featured sections: 8 category sections (6 items each) + Featured Jobs (6 items)
 * - All Content Section: Header + infinite scroll grid
 * - New Community Members: Header + 6 profile cards in grid
 */

import { Skeleton, Card, CardContent, cn } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Users } from '@heyclaude/web-runtime/icons';

const HOMEPAGE_CATEGORIES = 8; // agents, collections, commands, hooks, mcp, rules, skills, statuslines
const ITEMS_PER_CATEGORY = 6;
const FEATURED_JOBS_COUNT = 6;
const COMMUNITY_MEMBERS_COUNT = 6;

/**
 * Homepage Skeleton
 * 
 * Matches the exact layout and structure of the homepage:
 * 1. Hero section with all elements
 * 2. Featured category sections (8 sections × 6 items)
 * 3. Featured Jobs section (6 items)
 * 4. All Content section (header + grid)
 * 5. New Community Members (6 profile cards)
 */
export function HomepageSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      className={`bg-background min-h-screen`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      <div className="relative overflow-hidden">
        {/* Hero Section - Matches HomepageHeroClient exactly */}
        <motion.section
          className="border-border/50 relative border-b overflow-hidden bg-background"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          <motion.div
            className="relative z-10 flex flex-col pt-16 pb-12 sm:pt-20 sm:pb-16 lg:pt-28 lg:pb-20"
          >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-4xl">
                <div className="text-center">
                  {/* Main Heading - 2 lines matching hero */}
                  <div className="mb-4 sm:mb-6 lg:mb-8">
                    <Skeleton 
                      size="xl" 
                      width="2xl" 
                      className="mx-auto h-7 sm:h-8 lg:h-12 mb-1 max-w-[600px]"
                    />
                    <Skeleton 
                      size="xl" 
                      width="xl" 
                      className="mx-auto h-7 sm:h-8 lg:h-12 max-w-[400px]"
                    />
                  </div>
                  
                  {/* Description */}
                  <Skeleton 
                    size="md" 
                    width="2xl" 
                    className="mx-auto h-5 sm:h-6 lg:h-7 mb-6 sm:mb-12 lg:mb-16 max-w-[700px]"
                  />
                  
                  {/* Search Bar */}
                  <Skeleton 
                    size="xl" 
                    width="2xl" 
                    className="mx-auto h-12 sm:h-14 mb-4 sm:mb-6 max-w-[700px]"
                  />
                  
                  {/* Category Stats Section - Mobile horizontal scroll */}
                  <div className="flex gap-1 overflow-x-auto pb-2 md:hidden">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton
                        key={`mobile-stat-${i}`}
                        size="sm"
                        width="md"
                        rounded="md"
                        className="h-8 min-w-fit"
                      />
                    ))}
                  </div>
                  
                  {/* Category Stats Section - Desktop flex-wrap */}
                  <div className="hidden flex-wrap justify-center gap-1 md:flex lg:gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton
                        key={`desktop-stat-${i}`}
                        size="sm"
                        width="md"
                        rounded="md"
                        className="h-8"
                      />
                    ))}
                  </div>
                  
                  {/* Partner Marquee - Feature-flagged, may not always show */}
                  <div className="mt-8">
                    <Skeleton size="xs" width="xs" className="mx-auto h-4 mb-4" />
                    <div className="flex items-center justify-center gap-8">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton
                          key={`partner-${i}`}
                          size="md"
                          width="lg"
                          className="h-12 w-32"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Homepage Content Sections - Matches HomePageClientContent exactly */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.3 }}
        >
          <div className="container mx-auto px-4 pb-4">
            {/* Featured Category Sections - 8 sections × 6 items each */}
            <div className={cn('mb-16', 'space-y-16')}>
              {Array.from({ length: HOMEPAGE_CATEGORIES }).map((_, sectionIndex) => (
                <motion.section
                  key={`category-${sectionIndex}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    ...SPRING.loading,
                    delay: 0.4 + sectionIndex * 0.1,
                  }}
                >
                  {/* Section Header - Matches FeaturedSection header */}
                  <div className={cn('mb-8', 'flex items-center justify-between')}>
                    <Skeleton size="lg" width="lg" className="h-8" />
                    <Skeleton size="sm" width="xs" rounded="md" className="h-6" />
                  </div>

                  {/* Content Grid - Matches UnifiedCardGrid variant="normal" (grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: ITEMS_PER_CATEGORY }).map((_, itemIndex) => (
                      <motion.div
                        key={`category-${sectionIndex}-item-${itemIndex}`}
                        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                        transition={{
                          ...SPRING.loading,
                          mass: 0.5,
                          delay: 0.5 + sectionIndex * 0.1 + itemIndex * STAGGER.micro,
                        }}
                      >
                        <Card>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-start gap-2">
                                <Skeleton size="md" width="md" rounded="md" className={cn('h-12 w-12', 'shrink-0')} />
                                <div className="flex flex-col gap-2 flex-1">
                                  <Skeleton size="md" width="3/4" />
                                  <Skeleton size="sm" width="3xl" />
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                <Skeleton size="xs" width="xs" rounded="full" />
                                <Skeleton size="xs" width="xs" rounded="full" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.section>
              ))}

              {/* Featured Jobs Section - Matches FeaturedSections featuredJobs */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  ...SPRING.loading,
                  delay: 0.4 + HOMEPAGE_CATEGORIES * 0.1,
                }}
              >
                {/* Section Header */}
                <div className={cn('mb-8', 'flex items-center justify-between')}>
                  <Skeleton size="lg" width="lg" className="h-8" />
                  <Skeleton size="sm" width="xs" rounded="md" className="h-6" />
                </div>

                {/* Jobs Grid - Matches featured jobs grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: FEATURED_JOBS_COUNT }).map((_, jobIndex) => (
                    <motion.div
                      key={`job-${jobIndex}`}
                      initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                      animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                      transition={{
                        ...SPRING.loading,
                        delay: 0.5 + HOMEPAGE_CATEGORIES * 0.1 + jobIndex * STAGGER.default,
                      }}
                    >
                      <Card>
                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <Skeleton size="lg" width="3xl" className="h-6" />
                            <Skeleton size="sm" width="2/3" className="h-4" />
                            <Skeleton size="xs" width="xs" rounded="full" className="h-6" />
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* All Content Section - Matches AllContentSection */}
            <motion.section
              className="container mx-auto px-4 pb-4 space-y-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...SPRING.smooth, delay: 0.6 }}
            >
              {/* Section Header */}
              <div className="mb-8">
                <Skeleton size="xl" width="lg" className="h-9 mb-1" />
                <Skeleton size="md" width="xl" className="h-5" />
              </div>

              {/* All Content Grid - Matches UnifiedCardGrid variant="normal" */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, itemIndex) => (
                  <motion.div
                    key={`all-content-${itemIndex}`}
                    initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                    animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      ...SPRING.loading,
                      delay: 0.7 + itemIndex * STAGGER.micro,
                    }}
                  >
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex items-start gap-2">
                            <Skeleton size="md" width="md" rounded="md" className={cn('h-12 w-12', 'shrink-0')} />
                            <div className="flex-1 space-y-2">
                              <Skeleton size="md" width="3/4" />
                              <Skeleton size="sm" width="3xl" />
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            <Skeleton size="xs" width="xs" rounded="full" />
                            <Skeleton size="xs" width="xs" rounded="full" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          </div>
        </motion.div>

        {/* New Community Members - Matches TopContributors exactly */}
        <motion.section
          className="border-border/50 border-t bg-muted/30 py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...SPRING.smooth, delay: 0.8 }}
        >
          <div className="container mx-auto px-4">
            {/* Section Header - Matches TopContributors header */}
            <div className="mb-6 flex items-center gap-2">
              <Users className="h-8 w-8 text-accent" />
              <Skeleton size="xl" width="lg" className="h-8" />
            </div>

            {/* Profile Cards Grid - Matches TopContributors grid: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: COMMUNITY_MEMBERS_COUNT }).map((_, memberIndex) => (
                <motion.div
                  key={`member-${memberIndex}`}
                  initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
                  animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    ...SPRING.loading,
                    delay: 0.9 + memberIndex * STAGGER.micro,
                  }}
                >
                  <Card>
                    <CardContent className="p-6">
                      {/* Profile Card Layout - Matches ProfileCard variant="compact" */}
                      <div className="flex flex-col items-center gap-3 text-center">
                        {/* Avatar */}
                        <Skeleton
                          size="md"
                          width="md"
                          rounded="full"
                          className={cn('h-12 w-12', 'ring-2 ring-accent/20 ring-offset-2 ring-offset-background')}
                        />
                        {/* Username */}
                        <div className="w-full min-w-0">
                          <Skeleton size="md" width="3xl" className="h-5 mb-0.5" />
                          <Skeleton size="sm" width="2/3" className="mx-auto h-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
