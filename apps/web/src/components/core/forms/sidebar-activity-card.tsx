/**
 * Sidebar Activity Card
 * Combines Recent Submissions and Tips into a tabbed interface
 * Saves vertical space while maintaining information density
 */

'use client';

import type { Database } from '@heyclaude/database-types';
import { CheckCircle, Clock, Lightbulb } from '@heyclaude/web-runtime/icons';
import {
  borderBottom,
  cluster,
  flexGrow,
  iconSize,
  marginTop,
  muted,
  padding,
  row,
  size,
  spaceY,
  stack,
  weight,
} from '@heyclaude/web-runtime/design-system';
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

/**
 * Renders a sidebar card with two tabs: "Recent" (merged submissions) and "Tips".
 *
 * Displays a list of recent merged submissions with name, content type badge, optional author link, and merged date; the Tips tab shows a vertical list of short guidance strings.
 *
 * @param recentMerged - Array of recent merged submissions to display; each item should include `id`, `content_name`, `content_type`, `merged_at`, optional `merged_at_formatted`, and optional `user` with `name` and `slug`.
 * @param tips - List of short tip strings to render in the Tips tab.
 * @param typeLabels - Mapping from content type keys to user-facing label strings used for the content-type badge.
 * @returns The SidebarActivityCard JSX element.
 *
 * @see tabContentVariants
 * @see UnifiedBadge
 * @see NavLink
 */
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
          <TabsContent value="recent" className={marginTop.none}>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={tabContentVariants}
              className={stack.snug}
            >
              {recentMerged.length === 0 ? (
                <p className={cn(`${muted.sm}`, 'py-4 text-center')}>
                  No recent submissions yet
                </p>
              ) : (
                recentMerged.map((submission) => (
                  <div
                    key={submission.id}
                    className={cn(
                      `${row.compact}`,
                      `${borderBottom.light} pb-3 last:border-0 last:pb-0`
                    )}
                  >
                    <CheckCircle
                      className={cn(marginTop.micro, 'shrink-0', iconSize.sm, 'text-green-600')}
                    />
                    <div className={`min-w-0 ${flexGrow['1']}`}>
                      <p className={cn(`truncate ${weight.medium} ${size.sm}`)}>
                        {submission.content_name}
                      </p>
                      <div className={cn(cluster.compact, marginTop.tight, 'flex-wrap')}>
                        <UnifiedBadge variant="base" style="outline" className={size.xs}>
                          {typeLabels[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user && (
                          <span className={`${muted.default} ${size.xs}`}>
                            by{' '}
                            <NavLink href={`/u/${submission.user.slug}`}>
                              @{submission.user.name}
                            </NavLink>
                          </span>
                        )}
                      </div>
                      <p className={cn(marginTop.tight, `${muted.default} ${size.xs}`)}>
                        {submission.merged_at_formatted || submission.merged_at}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className={marginTop.none}>
            <motion.div initial="hidden" animate="visible" variants={tabContentVariants}>
              <ul className={`list-none ${spaceY.compact}`}>
                {tips.map((tip) => (
                  <li key={tip} className={`${row.compact}`}>
                    <span className={`${marginTop.micro} text-blue-400 ${size.xs}`}>•</span>
                    <span className={`${muted.default} ${size.xs}`}>{tip}</span>
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