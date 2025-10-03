/**
 * RecentGuidesCard - Server Component for recent content
 *
 * CONVERTED: Client → Server component (Link works in server components)
 * Pure rendering of recent guides with dates
 *
 * Extracted from unified-sidebar.tsx (lines 402-423)
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see components/unified-sidebar.tsx - Original implementation
 */

import Link from 'next/link';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Clock } from '@/src/lib/icons';
import { nonEmptyString } from '@/src/lib/schemas/primitives/base-strings';
import { UI_CLASSES } from '@/src/lib/ui-constants';

/**
 * Schema for recent guide item
 */
const recentGuideSchema = z.object({
  title: nonEmptyString,
  slug: nonEmptyString,
  date: z.string(), // Display format (e.g., "2023-12-01")
});

/**
 * Schema for RecentGuidesCard props
 */
const recentGuidesCardPropsSchema = z.object({
  guides: z.array(recentGuideSchema),
  title: nonEmptyString.optional(),
});

export type RecentGuidesCardProps = z.infer<typeof recentGuidesCardPropsSchema>;

/**
 * RecentGuidesCard Component (Server Component)
 *
 * Displays a list of recently updated guides with dates.
 * Simple display card with no loading states.
 * No React.memo needed - server components don't re-render
 */
export function RecentGuidesCard({ guides, title = 'Recent Guides' }: RecentGuidesCardProps) {
  // Validate props
  const validated = recentGuidesCardPropsSchema.parse({ guides, title });

  // Don't render if no guides
  if (validated.guides.length === 0) {
    return null;
  }

  return (
    <Card className="border-muted/40 shadow-sm">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span>{validated.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <div className="space-y-1.5">
          {validated.guides.map((guide) => (
            <Link
              key={guide.slug}
              href={guide.slug}
              className={`${UI_CLASSES.GROUP} ${UI_CLASSES.BLOCK}`}
            >
              <div
                className={`text-3xs text-muted-foreground ${UI_CLASSES.GROUP_HOVER_TEXT_PRIMARY} ${UI_CLASSES.TRANSITION_COLORS} py-0.5`}
              >
                <div className="truncate">{guide.title}</div>
                <div className="text-2xs text-muted-foreground/60">{guide.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
