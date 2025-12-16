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
import { SPRING, STAGGER, paddingX, marginX, paddingTop, gap, marginTop, spaceY, paddingY, padding, marginBottom, paddingBottom, size, iconSize } from '@heyclaude/web-runtime/design-system';
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
      <section className={`relative`}>
        <motion.div
          className={`container ${marginX.auto} ${paddingX.default}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          <div className={`flex items-start justify-between ${paddingTop.default}`}>
            <div className={`flex items-start ${gap.default}`}>
              {/* Avatar */}
              <Skeleton size="xl" width="xl" rounded="full" className={`${iconSize['24']} shrink-0`} />
              
              {/* Content */}
              <div className={`${marginTop.default} ${spaceY.default}`}>
                <Skeleton size="xl" width="lg" className="h-9" />
                <Skeleton size="md" width="2xl" className="h-5" />
                
                {/* Social Stats */}
                <div className={`flex items-center ${gap.default}`}>
                  <div className={`flex items-center ${gap.micro}`}>
                    <Skeleton size="sm" width="xs" />
                    <Skeleton size="xs" width="xs" />
                  </div>
                  <span>•</span>
                  <div className={`flex items-center ${gap.micro}`}>
                    <Skeleton size="sm" width="xs" />
                    <Skeleton size="xs" width="xs" />
                  </div>
                </div>
                
                {/* Website link */}
                <div className={`flex items-center ${gap.default}`}>
                  <span>•</span>
                  <div className={`flex items-center ${gap.micro}`}>
                    <Skeleton size="sm" width="xs" rounded="full" className={`${iconSize.sm}`} />
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
      <section className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
        <div className={`${spaceY.relaxed}`}>
          {/* Profile Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            <Card>
              <CardContent className={`${padding.comfortable}`}>
                <div className={`grid grid-cols-2 ${gap.default} md:grid-cols-4`}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="text-center">
                      <Skeleton size="xl" width="md" className={`${marginX.auto} ${marginBottom.compact} h-8`} />
                      <Skeleton size="xs" width="xs" className={`${marginX.auto}`} />
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
                <div className={`flex ${gap.tight} border-b ${paddingBottom.tight}`}>
                  <Skeleton size="md" width="lg" rounded="md" className="h-10" />
                  <Skeleton size="md" width="xl" rounded="md" className="h-10" />
                  <Skeleton size="md" width="xl" rounded="md" className="h-10" />
                </div>
              </CardHeader>
              <CardContent className={`${marginTop.comfortable}`}>
                {/* Content grid - Collections/Contributions */}
                <div className={`grid ${gap.default} sm:grid-cols-2`}>
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
                            <div className={`flex items-center ${gap.tight}`}>
                              <Skeleton size="sm" width="xs" rounded="full" className={`${iconSize.md}`} />
                              <CardTitle className={`${size.sm}`}>
                                <Skeleton size="sm" width="sm" />
                              </CardTitle>
                            </div>
                            <Skeleton size="xs" width="xs" className={`${marginTop.tight}`} />
                          </CardHeader>
                          <CardContent>
                            <div className={`flex items-center ${gap.tight}`}>
                              <Skeleton size="sm" width="xs" rounded="full" className={`${iconSize.sm}`} />
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
