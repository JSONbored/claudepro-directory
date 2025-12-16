'use client';

/**
 * Submit Page Sidebar Skeleton
 * 
 * Perfectly matches SubmitPageSidebar structure:
 * - SidebarActivityCard with tabs (Recent/Tips)
 * - Recent submissions list
 * - Tips list
 */

import { Skeleton } from '@heyclaude/web-runtime/ui';
import { SPRING, STAGGER, paddingBottom, padding, gap, spaceY } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';

const KEYS_5 = Array.from({ length: 5 }, (_, i) => `skeleton-${i + 1}`);

/**
 * Submit page sidebar skeleton matching exact layout
 */
export function SubmitPageSidebarSkeleton() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={!prefersReducedMotion ? { opacity: 0, x: 20 } : false}
      animate={!prefersReducedMotion ? { opacity: 1, x: 0 } : {}}
      transition={{ ...SPRING.smooth, delay: 0.2 }}
    >
      <Card>
        {/* Tabs */}
        <CardHeader className={`${paddingBottom.compact}`}>
          <div className={`grid w-full grid-cols-2 ${gap.tight} rounded-lg border ${padding.micro}`}>
            <Skeleton size="sm" width="3xl" rounded="md" className="h-9" />
            <Skeleton size="sm" width="3xl" rounded="md" className="h-9" />
          </div>
        </CardHeader>

        <CardContent className={`${spaceY.default}`}>
          {/* Recent submissions list */}
          {KEYS_5.map((key, i) => (
            <motion.div
              key={key}
              className={`flex items-start ${gap.compact}`}
              initial={!prefersReducedMotion ? { opacity: 0, y: 10 } : false}
              animate={!prefersReducedMotion ? { opacity: 1, y: 0 } : {}}
              transition={{ ...SPRING.loading, delay: 0.3 + i * STAGGER.micro }}
            >
              <Skeleton size="sm" width="xs" rounded="full" className="h-6" />
              <div className={`flex-1 ${spaceY.tight}`}>
                <Skeleton size="sm" width="2/3" className="h-4" />
                <Skeleton size="xs" width="xs" className="h-3" />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
