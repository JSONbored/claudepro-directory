'use client';

/**
 * Company Profile Skeleton
 * 
 * Perfectly matches the structure of /companies/[slug] page:
 * - Header section: Logo, name, badges, description, metadata links
 * - Main content: Active jobs list (JobCard grid)
 * - Sidebar: Company stats (sticky)
 */

import { Skeleton, cn } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, between, paddingX, paddingY, marginX, gap, spaceY, padding, size, iconSize } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

const KEYS_6 = Array.from({ length: 6 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Company header skeleton matching CompanyHeader structure
 */
function CompanyHeaderSkeleton() {
  return (
    <div className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
      <div className={`flex items-start ${gap.comfortable}`}>
        {/* Logo */}
        <Skeleton size="xl" width="xl" rounded="lg" className={cn(iconSize['24'], 'shrink-0')} />
        
        {/* Content */}
        <div className={`flex-1 ${spaceY.comfortable}`}>
          <div className={`flex items-center ${gap.compact}`}>
            <Skeleton size="xl" width="lg" className="h-9" />
            <Skeleton size="sm" width="xs" rounded="full" />
          </div>
          <Skeleton size="md" width="3xl" className="h-5" />
          <Skeleton size="md" width="2xl" className="h-5" />
          
          {/* Metadata links */}
          <div className={`flex flex-wrap items-center ${gap.default}`}>
            <div className={`flex items-center ${gap.micro}`}>
              <Skeleton size="sm" width="xs" rounded="full" className={iconSize.sm} />
              <Skeleton size="sm" width="xs" />
            </div>
            <div className={`flex items-center ${gap.micro}`}>
              <Skeleton size="sm" width="xs" rounded="full" className={iconSize.sm} />
              <Skeleton size="sm" width="xs" />
            </div>
            <div className={`flex items-center ${gap.micro}`}>
              <Skeleton size="sm" width="xs" rounded="full" className={iconSize.sm} />
              <Skeleton size="sm" width="xs" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Job card skeleton matching JobCard structure
 */
function JobCardSkeleton() {
  return (
    <Card>
      <CardContent className={`${padding.comfortable}`}>
        <div className={`${spaceY.comfortable}`}>
          {/* Header with logo and title */}
          <div className={`flex items-start ${gap.default}`}>
            <Skeleton size="md" width="md" rounded="md" className={cn(iconSize['2xl'], 'shrink-0')} />
            <div className={`flex-1 ${spaceY.compact}`}>
              <Skeleton size="md" width="3/4" />
              <Skeleton size="sm" width="2xl" />
            </div>
          </div>
          
          {/* Metadata row */}
          <div className={`flex flex-wrap items-center ${gap.compact}`}>
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" />
          </div>
          
          {/* Description */}
          <div className={`${spaceY.compact}`}>
            <Skeleton size="sm" width="3xl" />
            <Skeleton size="sm" width="3xl" />
            <Skeleton size="sm" width="2/3" />
          </div>
          
          {/* Tags */}
          <div className={`flex flex-wrap ${gap.tight}`}>
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
            <Skeleton size="xs" width="xs" rounded="full" />
          </div>
          
          {/* Actions */}
          <div className={`flex ${gap.tight}`}>
            <Skeleton size="md" width="lg" rounded="md" className="h-10" />
            <Skeleton size="md" width="lg" rounded="md" className="h-10" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Company stats skeleton matching CompanyStats structure
 */
function CompanyStatsSkeleton() {
  return (
    <div className={`${spaceY.relaxed}`}>
      <Card>
        <CardHeader>
          <CardTitle className={`${size.sm}`}>
            <Skeleton size="sm" width="sm" />
          </CardTitle>
        </CardHeader>
        <CardContent className={`${spaceY.comfortable}`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={between.center}>
              <Skeleton size="sm" width="xs" />
              <Skeleton size="sm" width="xs" rounded="full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Company Profile Skeleton
 */
export function CompanyProfileSkeleton() {
  const prefersReducedMotion = useReducedMotion();
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header Section */}
      <section className={`border-border relative border-b`}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.smooth, delay: 0.1 }}
        >
          <CompanyHeaderSkeleton />
        </motion.div>
      </section>

      {/* Content Section */}
      <section className={`container ${marginX.auto} ${paddingX.default} ${paddingY.section}`}>
        <div className={`grid grid-cols-1 ${gap.relaxed} lg:grid-cols-[1fr_320px]`}>
          {/* Main Content - Active Jobs */}
          <motion.div
            className={`${spaceY.relaxed}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.2 }}
          >
            {/* Section Header */}
            <div className={between.center}>
              <Skeleton size="lg" width="lg" className="h-8" />
            </div>
            
            {/* Jobs Grid */}
            <div className={`${spaceY.comfortable}`}>
              {KEYS_6.map((key, i) => {
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
                    <JobCardSkeleton />
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Sidebar - Company Stats */}
          <motion.aside
            className={`${spaceY.relaxed} lg:sticky lg:top-24 lg:h-fit`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...SPRING.smooth, delay: 0.4 }}
          >
            <CompanyStatsSkeleton />
          </motion.aside>
        </div>
      </section>
    </motion.div>
  );
}
