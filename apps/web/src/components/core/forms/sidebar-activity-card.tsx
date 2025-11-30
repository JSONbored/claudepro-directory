/**
 * Sidebar Activity Card
 * Combines Recent Submissions and Tips into a tabbed interface
 * Saves vertical space while maintaining information density
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { CheckCircle, Clock, Lightbulb } from '@heyclaude/web-runtime/icons';
import { cluster, iconSize, muted, padding, stack } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { motion } from 'motion/react';
import { UnifiedBadge } from '@heyclaude/web-runtime/ui';
import { NavLink } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader } from '@heyclaude/web-runtime/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@heyclaude/web-runtime/ui';

interface SidebarActivityCardProps {
  recentMerged: Array<{
    id: string | number;
    content_name: string;
    content_type: Database['public']['Enums']['content_category'];
    merged_at: string;
    merged_at_formatted?: string;
    user?: { name: string; slug: string } | null;
  }>;
  tips: string[];
  typeLabels: Partial<Record<Database['public']['Enums']['content_category'], string>>;
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
        <CardHeader className="pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className={cluster.snug}>
              <Clock className={iconSize.xs} />
              Recent
            </TabsTrigger>
            <TabsTrigger value="tips" className={cluster.snug}>
              <Lightbulb className={iconSize.xs} />
              Tips
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className={padding.comfortable}>
          {/* Recent Submissions Tab */}
          <TabsContent value="recent" className="mt-0">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabContentVariants}
              className={stack.snug}
            >
              {recentMerged.length === 0 ? (
                <p className={cn(`${muted.default} text-sm`, 'py-4 text-center')}>
                  No recent submissions yet
                </p>
              ) : (
                recentMerged.map((submission) => (
                  <div
                    key={submission.id}
                    className={cn(
                      'flex items-start gap-2',
                      'border-border/50 border-b pb-3 last:border-0 last:pb-0'
                    )}
                  >
                    <CheckCircle
                      className={cn('mt-0.5 shrink-0', iconSize.sm, 'text-green-600')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn('truncate font-medium text-sm')}>
                        {submission.content_name}
                      </p>
                      <div className={cn(cluster.compact, 'mt-1 flex-wrap')}>
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {typeLabels[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user && (
                          <span className={`${muted.default} text-xs`}>
                            by{' '}
                            <NavLink href={`/u/${submission.user.slug}`}>
                              @{submission.user.name}
                            </NavLink>
                          </span>
                        )}
                      </div>
                      <p className={cn('mt-1', `${muted.default} text-xs`)}>
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
                  <li key={tip} className="flex items-start gap-2">
                    <span className="mt-0.5 text-blue-400 text-xs">•</span>
                    <span className={`${muted.default} text-xs`}>{tip}</span>
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
