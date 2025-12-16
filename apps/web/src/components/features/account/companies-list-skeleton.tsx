'use client';

/**
 * Companies List Skeleton
 * 
 * Perfectly matches /account/companies structure:
 * - Header (title + count + "Add Company" button)
 * - List of company cards with logo, name, description, featured badge, stats, actions
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, spaceY, marginBottom, gap, iconSize } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';

const KEYS_5 = Array.from({ length: 5 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Companies list skeleton matching exact layout
 */
export function CompaniesListSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      className={`${spaceY.relaxed}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={SPRING.smooth}
    >
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={!prefersReducedMotion ? { opacity: 0, y: -20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.1 }}
      >
        <div>
          <Skeleton size="xl" width="lg" className={`${marginBottom.compact} h-9`} />
          <Skeleton size="sm" width="md" className="h-5" />
        </div>
        <Skeleton size="md" width="lg" rounded="md" className="h-10" />
      </motion.div>

      {/* Companies list */}
      <motion.div
        className={`grid ${gap.default}`}
        initial={!prefersReducedMotion ? { opacity: 0, y: 20 } : false}
        animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
        transition={{ ...SPRING.smooth, delay: 0.2 }}
      >
        {KEYS_5.map((key, i) => (
          <motion.div
            key={key}
            initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
            animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
            transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`flex flex-1 items-start ${gap.default}`}>
                    {/* Logo */}
                    <Skeleton size="lg" width="lg" rounded="lg" className={`${iconSize['3xl']}`} />
                    <div className={`flex-1 ${spaceY.compact}`}>
                      <div className={`flex items-center ${gap.tight}`}>
                        <Skeleton size="lg" width="md" className="h-7" />
                        <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
                      </div>
                      <Skeleton size="sm" width="2xl" className="h-4" />
                    </div>
                  </div>
                  <div className={`flex items-center ${gap.tight}`}>
                    <Skeleton size="sm" width="xs" rounded="md" className="h-8" />
                    <Skeleton size="sm" width="xs" rounded="md" className="h-8" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Skeleton size="xs" width="xs" className="h-3" />
                  <Skeleton size="xs" width="xs" className="h-3" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
