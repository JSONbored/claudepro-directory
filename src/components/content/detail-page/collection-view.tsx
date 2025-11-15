/**
 * Collection Detail View Component
 *
 * @server This is a SERVER-ONLY component (async server component)
 *
 * Extracted from src/app/collections/[slug]/page.tsx for reuse in UnifiedDetailPage.
 * Renders collection-specific sections: prerequisites, embedded items, installation order, compatibility.
 *
 * **Architecture:**
 * - Server Component: Parallel content loading with Promise.all
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
import { ConfigCard } from '@/src/components/core/domain/cards/config-card';
import { Skeleton } from '@/src/components/primitives/feedback/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/primitives/ui/card';
import { getCategoryConfigs, isValidCategory } from '@/src/lib/data/config/category';
import type { ContentItem } from '@/src/lib/data/content';
import { getContentBySlug } from '@/src/lib/data/content';
import { AlertTriangle, CheckCircle } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';

import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { Database } from '@/src/types/database.types';

interface ItemWithData {
  category: string;
  slug: string;
  reason?: string;
  data: ContentItem;
}

/**
 * Collection Detail View Props
 */
export interface CollectionDetailViewProps {
  /** Collection content with all metadata */
  collection: Database['public']['Tables']['content']['Row'] & { category: 'collections' };
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
  // Load category configs once (single RPC call)
  const categoryConfigs = await getCategoryConfigs();

  const metadata = (collection.metadata as Record<string, unknown>) || {};
  const items =
    (metadata.items as Array<{ category: string; slug: string; reason?: string }>) || [];

  const itemsWithContent = await Promise.all(
    items.map(async (itemRef): Promise<ItemWithData | null> => {
      const refData = itemRef as { category: string; slug: string; reason?: string };

      try {
        // Type guard validation
        if (!isValidCategory(refData.category)) {
          logger.error(
            'Invalid category in collection item reference',
            new Error('Invalid category'),
            {
              category: refData.category,
              slug: refData.slug,
            }
          );
          return null;
        }

        const item = await getContentBySlug(refData.category, refData.slug);
        return item ? { ...refData, data: item } : null;
      } catch (error) {
        logger.error('Failed to load collection item', error as Error, {
          category: refData.category,
          slug: refData.slug,
        });
        return null;
      }
    })
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

  const prerequisites = metadata.prerequisites as string[] | undefined;
  const installationOrder = metadata.installation_order as string[] | undefined;
  const compatibility = metadata.compatibility as
    | { claudeDesktop?: boolean; claudeCode?: boolean }
    | undefined;

  return (
    <>
      {/* Prerequisites Section */}
      {prerequisites && prerequisites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle
                className={`${UI_CLASSES.ICON_MD} text-yellow-500`}
                aria-hidden="true"
              />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prerequisites.map((prereq: string) => (
                <li key={prereq} className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <CheckCircle
                    className={`h-4 w-4 text-muted-foreground ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-sm">{prereq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What's Included Section - Embedded ConfigCards */}
      <div>
        <h2 className="mb-6 font-bold text-2xl text-foreground">
          What's Included ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
        </h2>

        <Suspense
          fallback={
            <output className="space-y-6" aria-busy="true" aria-label="Loading collection items">
              <Skeleton size="xl" width="3xl" className="h-48" />
              <Skeleton size="xl" width="3xl" className="h-48" />
              <Skeleton size="xl" width="3xl" className="h-48" />
            </output>
          }
        >
          <div className="space-y-8">
            {(Object.entries(itemsByCategory) as [string, ItemWithData[]][]).map(
              ([category, items]) => (
                <div key={category}>
                  <h3 className="mb-4 font-semibold text-foreground text-lg">
                    {categoryConfigs[category as keyof typeof categoryConfigs]?.pluralTitle ||
                      category}{' '}
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
      {installationOrder && installationOrder.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recommended Installation Order</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {installationOrder.map((slug: string, index: number) => {
                const item = validItems.find((i: ItemWithData) => i?.slug === slug);
                return (
                  <li key={slug} className={UI_CLASSES.FLEX_ITEMS_START_GAP_3}>
                    <span
                      className={
                        'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary text-sm'
                      }
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="mt-0.5 text-foreground text-sm">
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
      {compatibility && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                {compatibility.claudeDesktop ? (
                  <CheckCircle
                    className={`${UI_CLASSES.ICON_SM} text-green-500`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`${UI_CLASSES.ICON_SM} text-red-500`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-muted-foreground text-sm">
                  Claude Desktop {compatibility.claudeDesktop ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
              <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                {compatibility.claudeCode ? (
                  <CheckCircle
                    className={`${UI_CLASSES.ICON_SM} text-green-500`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`${UI_CLASSES.ICON_SM} text-red-500`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-muted-foreground text-sm">
                  Claude Code {compatibility.claudeCode ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
