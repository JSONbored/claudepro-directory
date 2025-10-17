/**
 * Collection Detail View Component
 *
 * @server This is a SERVER-ONLY component (imports batch.utils → cache.server)
 *
 * Extracted from src/app/collections/[slug]/page.tsx for reuse in UnifiedDetailPage.
 * Renders collection-specific sections: prerequisites, embedded items, installation order, compatibility.
 *
 * **Architecture:**
 * - Server Component: Uses batchFetch from batch.utils (imports cache.server)
 * - NOT Storybook-compatible (requires server-side execution)
 * - Follows composition pattern from unified-detail-page
 * - Reuses ConfigCard for embedded item display
 * - Preserves all collection-specific UI features
 *
 * **Production Standards:**
 * - Type-safe with CollectionContent schema
 * - Lazy loading with Suspense for embedded items
 * - Accessible with proper ARIA labels
 *
 * @see src/lib/schemas/content/collection.schema.ts - CollectionContent type
 * @see src/components/features/content/config-card.tsx - Embedded item cards
 */

import { Suspense } from 'react';
import { ConfigCard } from '@/src/components/cards/config-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/card';
import { getContentBySlug } from '@/src/lib/content/content-loaders';
import { AlertTriangle, CheckCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type {
  CollectionContent,
  CollectionItemReference,
} from '@/src/lib/schemas/content/collection.schema';
import type { CategoryId } from '@/src/lib/schemas/shared.schema';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import { batchMap } from '@/src/lib/utils/batch.utils';

/**
 * Item with loaded content data
 */
interface ItemWithData extends CollectionItemReference {
  data: UnifiedContentItem;
}

import { UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';

/**
 * Collection Detail View Props
 */
export interface CollectionDetailViewProps {
  /** Collection content with all metadata */
  collection: CollectionContent;
}

/**
 * Collection Detail View Component
 *
 * Renders collection-specific sections in a consistent, accessible layout.
 * Uses Suspense for lazy loading of embedded item content.
 *
 * @param props - Component props with collection data
 * @returns Collection detail view JSX
 */
export async function CollectionDetailView({ collection }: CollectionDetailViewProps) {
  // Load all referenced items with full content (parallel batch operation)
  const itemsWithContent = await batchMap(
    collection.items,
    async (itemRef: CollectionItemReference): Promise<ItemWithData | null> => {
      try {
        const item = await getContentBySlug(itemRef.category as CategoryId, itemRef.slug);
        return item ? { ...itemRef, data: item } : null;
      } catch (error) {
        logger.error('Failed to load collection item', error as Error, {
          category: itemRef.category,
          slug: itemRef.slug,
        });
        return null;
      }
    }
  );

  // Filter out failed loads
  const validItems = itemsWithContent.filter(
    (item: ItemWithData | null): item is ItemWithData => item !== null
  );

  // Group items by category for organized display
  const itemsByCategory = validItems.reduce(
    (acc: Record<string, ItemWithData[]>, item: ItemWithData) => {
      if (!item) return acc;
      const category = item.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} as Record<string, ItemWithData[]>
  );

  logger.info('Collection detail view rendered', {
    slug: collection.slug,
    itemCount: validItems.length,
    categories: Object.keys(itemsByCategory).length,
  });

  return (
    <div className="space-y-12">
      {/* Prerequisites Section */}
      {collection.prerequisites && collection.prerequisites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {collection.prerequisites.map((prereq: string) => (
                <li key={prereq} className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <CheckCircle
                    className={`h-4 w-4 text-muted-foreground ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    aria-hidden="true"
                  />
                  <span className="text-sm text-muted-foreground">{prereq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What's Included Section - Embedded ConfigCards */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">
          What's Included ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
        </h2>

        <Suspense
          fallback={
            <output className="space-y-6" aria-busy="true" aria-label="Loading collection items">
              <div
                className="h-48 rounded-lg border border-border bg-card/50 animate-pulse"
                aria-hidden="true"
              />
              <div
                className="h-48 rounded-lg border border-border bg-card/50 animate-pulse"
                aria-hidden="true"
              />
              <div
                className="h-48 rounded-lg border border-border bg-card/50 animate-pulse"
                aria-hidden="true"
              />
            </output>
          }
        >
          <div className="space-y-8">
            {(Object.entries(itemsByCategory) as [string, ItemWithData[]][]).map(
              ([category, items]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    {UNIFIED_CATEGORY_REGISTRY[category as keyof typeof UNIFIED_CATEGORY_REGISTRY]
                      ?.pluralTitle || category}{' '}
                    ({items.length})
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-1">
                    {items.map((item: ItemWithData) =>
                      item?.data ? (
                        <ConfigCard
                          key={item.slug}
                          item={item.data}
                          showCategory={false}
                          variant="default"
                        />
                      ) : null
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </Suspense>
      </div>

      {/* Installation Order Section */}
      {collection.installationOrder && collection.installationOrder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recommended Installation Order</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {collection.installationOrder.map((slug: string, index: number) => {
                const item = validItems.find((i: ItemWithData) => i?.slug === slug);
                return (
                  <li key={slug} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <span
                      className={
                        'flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-semibold'
                      }
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground mt-0.5">
                      {item?.data?.title || slug}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Compatibility Section */}
      {collection.compatibility && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                {collection.compatibility.claudeDesktop ? (
                  <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                <span className="text-sm text-muted-foreground">
                  Claude Desktop{' '}
                  {collection.compatibility.claudeDesktop ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                {collection.compatibility.claudeCode ? (
                  <CheckCircle className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" aria-hidden="true" />
                )}
                <span className="text-sm text-muted-foreground">
                  Claude Code{' '}
                  {collection.compatibility.claudeCode ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
