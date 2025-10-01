'use client';

/**
 * DetailSidebar - Sidebar orchestrator for detail pages
 *
 * Consolidates sidebar rendering logic from unified-detail-page.tsx (lines 434-507)
 * and custom-sidebars.tsx (renderAgentSidebar, renderMCPSidebar)
 *
 * Uses composition of sidebar cards for clean, reusable structure
 *
 * @see components/unified-detail-page.tsx - Original implementation
 * @see lib/config/custom-sidebars.tsx - Custom sidebar renderers
 */

import { useRouter } from 'next/navigation';
import { memo } from 'react';
import type { UnifiedContentItem } from '@/lib/schemas/component.schema';
import type { ContentTypeConfig } from '@/lib/types/content-type-config';
import { SidebarDetailsCard } from './sidebar-details-card';
import { SidebarRelatedItemsCard } from './sidebar-related-items-card';
import { SidebarResourcesCard } from './sidebar-resources-card';

/**
 * Props for DetailSidebar
 */
export interface DetailSidebarProps {
  item: UnifiedContentItem;
  relatedItems: UnifiedContentItem[];
  config: ContentTypeConfig;
  customRenderer?:
    | ((
        item: UnifiedContentItem,
        relatedItems: UnifiedContentItem[],
        router: ReturnType<typeof useRouter>
      ) => React.ReactNode)
    | undefined;
}

/**
 * DetailSidebar Component
 *
 * Orchestrates sidebar rendering using composable sidebar cards.
 * Supports custom renderers for special cases (agents, MCP with extra metadata)
 */
export const DetailSidebar = memo(function DetailSidebar({
  item,
  relatedItems,
  config,
  customRenderer,
}: DetailSidebarProps) {
  const router = useRouter();

  // Use custom renderer if provided
  if (customRenderer) {
    return <div className="space-y-6">{customRenderer(item, relatedItems, router)}</div>;
  }

  // Default sidebar using composable cards
  return (
    <div className="space-y-6">
      {/* Resources Card */}
      <SidebarResourcesCard
        githubPath={config.metadata?.githubPathPrefix}
        documentationUrl={item.documentationUrl}
        slug={item.slug}
        category={item.category}
        showGitHubLink={config.metadata?.showGitHubLink ?? true}
      />

      {/* Type-specific Details Card */}
      <SidebarDetailsCard item={item} title={`${config.typeName} Details`} />

      {/* Related Items Card */}
      {relatedItems.length > 0 && (
        <SidebarRelatedItemsCard
          items={relatedItems}
          typeName={config.typeName}
          category={item.category}
          maxItems={5}
        />
      )}
    </div>
  );
});
