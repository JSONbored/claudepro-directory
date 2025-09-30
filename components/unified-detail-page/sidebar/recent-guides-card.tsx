'use client';

/**
 * RecentGuidesCard - Recent content display card
 *
 * Extracted from unified-sidebar.tsx (lines 402-423)
 * Displays recently updated guides/content with dates
 *
 * @see components/unified-sidebar.tsx - Original implementation
 */

import { Clock } from 'lucide-react';
import Link from 'next/link';
import { memo } from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { nonEmptyString } from '@/lib/schemas/primitives';

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
 * RecentGuidesCard Component
 *
 * Displays a list of recently updated guides with dates.
 * Simple display card with no loading states.
 */
export const RecentGuidesCard = memo(function RecentGuidesCard({
  guides,
  title = 'Recent Guides',
}: RecentGuidesCardProps) {
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
            <Link key={guide.slug} href={guide.slug} className="group block">
              <div className="text-[11px] text-muted-foreground group-hover:text-primary transition-colors py-0.5">
                <div className="truncate">{guide.title}</div>
                <div className="text-[10px] text-muted-foreground/60">{guide.date}</div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});
