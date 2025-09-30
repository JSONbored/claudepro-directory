'use client';

/**
 * Content Detail Page Sidebar
 *
 * REFACTORED to use modular sidebar components from unified-detail-page
 * Replaces 179 lines of duplicate code with reusable components
 *
 * @see components/unified-detail-page/sidebar - Modular sidebar components
 */

import { DetailSidebar } from '@/components/unified-detail-page/sidebar';
import { getContentTypeConfig } from '@/lib/config/content-type-configs';
import type { UnifiedContentItem } from '@/lib/schemas';

export interface ContentSidebarProps<T extends UnifiedContentItem> {
  item: T;
  relatedItems?: T[] | undefined;
  type: 'agents' | 'commands' | 'hooks' | 'mcp' | 'rules' | 'guides';
  typeName: string;
}

export function ContentSidebar<T extends UnifiedContentItem>({
  item,
  relatedItems = [],
  type,
}: ContentSidebarProps<T>) {
  // Get configuration for this content type
  const config = getContentTypeConfig(type);

  if (!config) {
    return null;
  }

  // Transform item to UnifiedContentItem if needed (it should already be compatible)
  const unifiedItem: UnifiedContentItem = {
    ...item,
    category: type,
  };

  return <DetailSidebar item={unifiedItem} relatedItems={relatedItems} config={config} />;
}
