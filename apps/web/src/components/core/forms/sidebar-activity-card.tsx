/**
 * Sidebar Activity Card
 * Combines Recent Submissions and Tips into a tabbed interface
 * Saves vertical space while maintaining information density
 */

'use client';

import type { content_category } from '@prisma/client';
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
const createTabContentVariants = (shouldReduceMotion: boolean) =>
  ({
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
  }) as const;

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
      <Tabs defaultValue="recent" className="w-full">
        <CardHeader className="pb-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="recent" className={cn('flex items-center gap-1.5')}> {/* 6px = gap-1.5 */}
              <Clock className="h-3 w-3" />
              Recent
            </TabsTrigger>
            <TabsTrigger value="tips" className={cn('flex items-center gap-1.5')}> {/* 6px = gap-1.5 */}
              <Lightbulb className="h-3 w-3" />
              Tips
            </TabsTrigger>
          </TabsList>
        </CardHeader>

        <CardContent className="p-6">
          {/* Recent Submissions Tab */}
          <TabsContent value="recent" className="mt-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={createTabContentVariants(shouldReduceMotion)}
              className="space-y-3"
            >
              {recentMerged.length === 0 ? (
                <p className={cn('text-muted-foreground py-4 text-center text-sm')}>
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
                      className={cn('mt-0.5 h-4 w-4 shrink-0 text-success')}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-sm-medium truncate')}>{submission.content_name}</p>
                      <div className={cn('mt-1 flex flex-wrap items-center gap-2')}>
                        <UnifiedBadge variant="base" style="outline" className="text-xs">
                          {typeLabels[submission.content_type]}
                        </UnifiedBadge>
                        {submission.user ? (
                          <span className="text-muted-foreground text-xs">
                            by{' '}
                            <NavLink href={`/u/${submission.user.slug}`}>
                              @{submission.user.name}
                            </NavLink>
                          </span>
                        ) : null}
                      </div>
                      <p className={cn('text-muted-foreground mt-1 text-xs')}>
                        {submission.merged_at_formatted || submission.merged_at}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          </TabsContent>

          {/* Tips Tab */}
          <TabsContent value="tips" className="mt-4">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={createTabContentVariants(shouldReduceMotion)}
            >
              <ul className="list-none space-y-2">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-2">
                    <span className={cn('mt-4 text-xs text-info')}>•</span> {/* 18px ≈ 1rem (mt-4) */}
                    <span className="text-muted-foreground text-xs">{tip}</span>
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
