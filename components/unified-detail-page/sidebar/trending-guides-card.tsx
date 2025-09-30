'use client';

/**
 * TrendingGuidesCard - Trending content display card
 *
 * Extracted from unified-sidebar.tsx (lines 292-324)
 * Displays trending guides/content with view counts
 *
 * @see components/unified-sidebar.tsx - Original implementation
 */

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { z } from 'zod';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { nonEmptyString } from '@/lib/schemas/primitives';

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
 * TrendingGuidesCard Component
 *
 * Displays a list of trending guides with view counts.
 * Shows loading state and numbered list of trending items.
 */
export const TrendingGuidesCard = memo(function TrendingGuidesCard({
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
            <div className="text-xs text-muted-foreground">Loading trending guides...</div>
          ) : (
            validated.guides.map((guide, index) => (
              <Link
                key={guide.slug}
                href={guide.slug}
                className="group flex items-center justify-between text-xs hover:bg-muted/50 rounded px-1.5 py-1 transition-colors"
              >
                <span className="text-muted-foreground group-hover:text-foreground truncate flex-1">
                  <span className="text-muted-foreground/60 mr-1.5">{index + 1}.</span>
                  {guide.title}
                </span>
                <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-muted/50">
                  {guide.views}
                </Badge>
              </Link>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
});
