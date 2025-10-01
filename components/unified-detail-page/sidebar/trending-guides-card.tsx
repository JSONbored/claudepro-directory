/**
 * TrendingGuidesCard - Server Component for trending content
 *
 * CONVERTED: Client → Server component (Link works in server components)
 * Pure rendering of trending guides with view counts
 *
 * Extracted from unified-sidebar.tsx (lines 292-324)
 * Performance: Eliminated from client bundle, server-rendered
 *
 * @see components/unified-sidebar.tsx - Original implementation
 */

import Link from 'next/link';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from '@/lib/icons';
import { nonEmptyString } from '@/lib/schemas/primitives';
import { UI_CLASSES } from '@/lib/ui-constants';

/**
 * Schema for trending guide item
 */
const trendingGuideSchema = z.object({
  title: nonEmptyString,
  slug: nonEmptyString,
  views: z.string(), // Display format (e.g., "1,234 views")
});

/**
 * Schema for TrendingGuidesCard props
 */
const trendingGuidesCardPropsSchema = z.object({
  guides: z.array(trendingGuideSchema),
  isLoading: z.boolean().optional(),
  title: nonEmptyString.optional(),
});

export type TrendingGuidesCardProps = z.infer<typeof trendingGuidesCardPropsSchema>;

/**
 * TrendingGuidesCard Component (Server Component)
 *
 * Displays a list of trending guides with view counts.
 * Shows loading state and numbered list of trending items.
 * No React.memo needed - server components don't re-render
 */
export function TrendingGuidesCard({
  guides,
  isLoading = false,
  title = 'Trending Now',
}: TrendingGuidesCardProps) {
  // Validate props
  const validated = trendingGuidesCardPropsSchema.parse({ guides, isLoading, title });

  // Don't render if no guides and not loading
  if (validated.guides.length === 0 && !validated.isLoading) {
    return null;
  }

  return (
    <Card className="border-muted/40 shadow-sm">
      <CardHeader className="pb-2 pt-3 px-3">
        <CardTitle className="text-xs font-medium flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 text-primary" />
          <span>{validated.title}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3 px-3">
        <div className="space-y-1.5">
          {validated.isLoading ? (
            <div className={UI_CLASSES.TEXT_XS_MUTED}>Loading trending guides...</div>
          ) : (
            validated.guides.map((guide, index) => (
              <Link
                key={guide.slug}
                href={guide.slug}
                className={`${UI_CLASSES.GROUP} ${UI_CLASSES.FLEX_ITEMS_CENTER_JUSTIFY_BETWEEN} text-xs ${UI_CLASSES.HOVER_BG_MUTED_50} rounded px-1.5 ${UI_CLASSES.PY_1} ${UI_CLASSES.TRANSITION_COLORS}`}
              >
                <span
                  className={`text-muted-foreground group-hover:text-foreground truncate ${UI_CLASSES.FLEX_1}`}
                >
                  <span className="text-muted-foreground/60 mr-1.5">{index + 1}.</span>
                  {guide.title}
                </span>
                <Badge variant="secondary" className="text-2xs h-4 px-1 bg-muted/50">
                  {guide.views}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
