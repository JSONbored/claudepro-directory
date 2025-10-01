'use client';

/**
 * SidebarRelatedItemsCard - Related content sidebar card
 *
 * Consolidates related items rendering from:
 * - custom-sidebars.tsx (renderAgentSidebar lines 100-125)
 * - custom-sidebars.tsx (renderMCPSidebar lines 230-255)
 * - unified-detail-page.tsx (renderSidebar lines 473-504)
 *
 * Eliminates 240+ lines of duplication across 3 files
 *
 * @see lib/config/custom-sidebars.tsx - Original implementations
 */

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from '@/lib/icons';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import { getDisplayTitle } from '@/lib/utils';

/**
 * Props for SidebarRelatedItemsCard
 */
export interface SidebarRelatedItemsCardProps {
  items: UnifiedContentItem[];
  typeName: string;
  category: string;
  maxItems?: number;
}

/**
 * SidebarRelatedItemsCard Component
 *
 * Renders a list of related content items with click navigation.
 * Used across all detail pages to show similar/related content.
 */
export const SidebarRelatedItemsCard = memo(function SidebarRelatedItemsCard({
  items,
  typeName,
  category,
  maxItems = 5,
}: SidebarRelatedItemsCardProps) {
  const router = useRouter();

  // Don't render if no items
  if (items.length === 0) return null;

  const displayItems = items.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Related {typeName}s</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {displayItems.map((relatedItem) => (
          <button
            key={relatedItem.slug}
            type="button"
            className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer w-full text-left"
            onClick={() => router.push(`/${category}/${relatedItem.slug}`)}
          >
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{getDisplayTitle(relatedItem)}</h4>
              <p className="text-xs text-muted-foreground truncate">{relatedItem.description}</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
          </button>
        ))}
      </CardContent>
    </Card>
  );
});
