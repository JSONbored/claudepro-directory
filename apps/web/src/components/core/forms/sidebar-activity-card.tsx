/**
 * Sidebar Activity Card
 * Combines Recent Submissions and Tips into a tabbed interface
 * Saves vertical space while maintaining information density
 */

'use client';

import type { content_category } from '@heyclaude/data-layer/prisma';
import { CheckCircle, Clock, Lightbulb } from '@heyclaude/web-runtime/icons';
import {
  cn,
  UnifiedBadge,
  NavLink,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@heyclaude/web-runtime/ui';
import { cluster, iconSize, padding, spaceY, size, muted, gap, paddingBottom, marginTop } from '@heyclaude/web-runtime/design-system';
import { DURATION } from '@heyclaude/web-runtime/design-system';
import { useReducedMotion } from '@heyclaude/web-runtime/hooks/motion';
import { motion } from 'motion/react';

interface SidebarActivityCardProps {
  recentMerged: Array<{
    content_name: string;
    content_type: content_category;
    id: number | string;
    merged_at: string;
    merged_at_formatted?: string;
    user?: null | { name: string; slug: string };
  }>;
  tips: string[];
  typeLabels: Partial<Record<content_category, string>>;
}

/**
 * Fade-in animation for tab content
 */
const createTabContentVariants = (shouldReduceMotion: boolean) => ({
  hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 },
  visible: shouldReduceMotion
    ? {
        opacity: 1,
        transition: { duration: DURATION.default, ease: 'easeOut' as const },
      }
    : {
        opacity: 1,
        y: 0,
        transition: { duration: DURATION.default, ease: 'easeOut' as const },
      },
} as const);

/**
 * Sidebar card displaying recent merged submissions and tips in two tabs.
 *
 * Renders a "Recent" tab that lists submissions with name, type label, optional author link, and timestamp,
 * and a "Tips" tab that shows a vertical list of tip strings.
 *
 * @param recentMerged - Array of recent submission objects. Each item should include:
 *   - id: number | string
 *   - content_name: string
 *   - content_type: string
 *   - merged_at: string
 *   - merged_at_formatted?: string
 *   - user?: null | { name: string; slug: string }
 * @param tips - Array of tip strings to display under the "Tips" tab.
 * @param typeLabels - Mapping from content type keys to human-readable label strings used for the submission badges.
 *
 * @returns A React element rendering the activity card with tabbed "Recent" and "Tips" content.
 *
 * @see UnifiedBadge
 * @see NavLink
 */
export function SidebarActivityCard({ recentMerged, tips, typeLabels }: SidebarActivityCardProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <Card>
      <Tabs defaultValue="recent" className={`w-full`}>
        <CardHeader className={`${paddingBottom.compact}`}>
          <TabsList className={`grid w-full grid-cols-2`}>
            <TabsTrigger value="recent" className={cn(cluster.tight, gap['1.5'])}>
              <Clock className={iconSize.xs} />
              Recent
            </TabsTrigger>
            <TabsTrigger value="tips" className={cn(cluster.tight, gap['1.5'])}>
              <Lightbulb className={iconSize.xs} />
              Tips
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className={padding.comfortable}>
          {/* Recent Submissions Tab */}
          <TabsContent value="recent" className={`${marginTop.default}`}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={createTabContentVariants(shouldReduceMotion)}
              className={spaceY.default}
            >
              {recentMerged.length === 0 ? (
                <p className={cn(`${size.sm} ${muted.default}`, 'py-4 text-center')}>
                  No recent submissions yet
                </p>
              ) : (
                recentMerged.map((submission) => (
                  <div
                    key={submission.id}
                    className={cn(
                      `flex items-start ${gap.compact}`,
                      'border-border/50 border-b pb-3 last:border-0 last:pb-0'
                    )}
                  >
                    <CheckCircle
                      className={cn(marginTop.micro, 'shrink-0', iconSize.sm, 'text-green-500 dark:text-green-400')}
                    />
                    <div className={`min-w-0 flex-1`}>
                      <p className={cn('truncate font-medium', size.sm)}>
                        {submission.content_name}
                      </p>
                      <div className={cn(cluster.compact, marginTop.tight, 'flex-wrap')}>
                        <UnifiedBadge variant="base" style="outline" className={size.xs}>
                          {typeLabels[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user ? (
                          <span className={`${size.xs} ${muted.default}`}>
                            by{' '}
                            <NavLink href={`/u/${submission.user.slug}`}>
                              @{submission.user.name}
                            </NavLink>
                          </span>
                        ) : null}
                      </div>
                      <p className={cn(marginTop.tight, `${size.xs} ${muted.default}`)}>
                        {submission.merged_at_formatted || submission.merged_at}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className={`${marginTop.default}`}>
            <motion.div initial="hidden" animate="visible" variants={createTabContentVariants(shouldReduceMotion)}>
              <ul className={`list-none ${spaceY.compact}`}>
                {tips.map((tip) => (
                  <li key={tip} className={`flex items-start ${gap.compact}`}>
                    <span className={cn(marginTop['4.5'], size.xs, 'text-blue-400')}>•</span>
                    <span className={`${size.xs} ${muted.default}`}>{tip}</span>
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