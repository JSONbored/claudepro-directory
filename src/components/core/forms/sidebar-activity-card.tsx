/**
 * Sidebar Activity Card
 * Combines Recent Submissions and Tips into a tabbed interface
 * Saves vertical space while maintaining information density
 */

'use client';

import { motion } from 'motion/react';
import { UnifiedBadge } from '@/src/components/core/domain/unified-badge';
import { NavLink } from '@/src/components/core/shared/nav-link';
import { Card, CardContent, CardHeader } from '@/src/components/primitives/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/primitives/tabs';
import { CheckCircle, Clock, Lightbulb } from '@/src/lib/icons';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { cn } from '@/src/lib/utils';
import type { Database } from '@/src/types/database.types';

interface SidebarActivityCardProps {
  recentMerged: Array<{
    id: string | number;
    content_name: string;
    content_type: Database['public']['Enums']['submission_type'];
    merged_at: string;
    merged_at_formatted?: string;
    user?: { name: string; slug: string } | null;
  }>;
  tips: string[];
  typeLabels: Record<Database['public']['Enums']['submission_type'], string>;
}

/**
 * Fade-in animation for tab content
 */
const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
} as const;

export function SidebarActivityCard({ recentMerged, tips, typeLabels }: SidebarActivityCardProps) {
  return (
    <Card>
      <Tabs defaultValue="recent" className="w-full">
        <CardHeader className={UI_CLASSES.CARD_HEADER_TIGHT}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
              <Clock className={UI_CLASSES.ICON_XS} />
              Recent
            </TabsTrigger>
            <TabsTrigger value="tips" className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1_5}>
              <Lightbulb className={UI_CLASSES.ICON_XS} />
              Tips
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className={UI_CLASSES.PADDING_COMFORTABLE}>
          {/* Recent Submissions Tab */}
          <TabsContent value="recent" className="mt-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabContentVariants}
              className={UI_CLASSES.SPACE_Y_3}
            >
              {recentMerged.length === 0 ? (
                <p className={cn(UI_CLASSES.TEXT_SM_MUTED, 'py-4 text-center')}>
                  No recent submissions yet
                </p>
              ) : (
                recentMerged.map((submission) => (
                  <div
                    key={submission.id}
                    className={cn(
                      UI_CLASSES.FLEX_ITEMS_START_GAP_2,
                      'border-border/50 border-b pb-3 last:border-0 last:pb-0'
                    )}
                  >
                    <CheckCircle
                      className={cn(
                        'mt-0.5 flex-shrink-0',
                        UI_CLASSES.ICON_SM,
                        UI_CLASSES.ICON_SUCCESS
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium', UI_CLASSES.TEXT_SM)}>
                        {submission.content_name}
                      </p>
                      <div className={cn(UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2, 'mt-1 flex-wrap')}>
                        <UnifiedBadge variant="base" style="outline" className={UI_CLASSES.TEXT_XS}>
                          {typeLabels[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user && (
                          <span className={UI_CLASSES.TEXT_XS_MUTED}>
                            by{' '}
                            <NavLink href={`/u/${submission.user.slug}`}>
                              @{submission.user.name}
                            </NavLink>
                          </span>
                        )}
                      </div>
                      <p className={cn('mt-1', UI_CLASSES.TEXT_XS_MUTED)}>
                        {submission.merged_at_formatted || submission.merged_at}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="mt-0">
            <motion.div initial="hidden" animate="visible" variants={tabContentVariants}>
              <ul className="list-none space-y-2">
                {tips.map((tip) => (
                  <li key={tip} className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <span className="mt-0.5 text-blue-400 text-xs">•</span>
                    <span className={UI_CLASSES.TEXT_XS_MUTED}>{tip}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
