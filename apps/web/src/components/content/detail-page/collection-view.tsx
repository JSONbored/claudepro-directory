/**
 * Collection Detail View Component
 *
 * @server This is a SERVER-ONLY component (async server component)
 *
 * Extracted from src/app/collections/[slug]/page.tsx for reuse in UnifiedDetailPage.
 * Renders collection-specific sections: prerequisites, embedded, items, installation order, compatibility.
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

import type { Database } from '@heyclaude/database-types';
import {
  ensureStringArray,
  getMetadata,
  isValidCategory,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/core';
import { getCategoryConfigs, getContentBySlug } from '@heyclaude/web-runtime/data';
import { AlertTriangle, CheckCircle } from '@heyclaude/web-runtime/icons';
import {
  bgColor,
  cluster,
  flexGrow,
  gap,
  iconSize,
  alignItems,
  justify,
  marginBottom,
  marginTop,
  muted,
  radius,
  row,
  size,
  spaceY,
  textColor,
  weight,
} from '@heyclaude/web-runtime/design-system';
import { Suspense } from 'react';
import { ConfigCard } from '@heyclaude/web-runtime/ui';
import { Skeleton } from '@heyclaude/web-runtime/ui';
import { Card, CardContent, CardHeader, CardTitle } from '@heyclaude/web-runtime/ui';

interface ItemWithData {
  category: string;
  slug: string;
  reason?: string;
  data: Database['public']['CompositeTypes']['enriched_content_item'];
}

/**
 * Collection Detail View Props
 */
export interface CollectionDetailViewProps {
  /** Collection content with all metadata */
  collection: Database['public']['Tables']['content']['Row'] & { category: 'collections' };
}

/**
 * Render collection detail sections including prerequisites, embedded, items, installation order, and compatibility.
 *
 * This server component performs server-side data fetching for category configurations and the embedded items referenced by the collection metadata, then renders accessible UI sections for prerequisites, "What's Included" (grouped by category), recommended installation order, and compatibility indicators.
 *
 * @param props - Component props
 * @param props.collection - Database content row representing a collection (category `"collections"`)
 * @returns JSX element for the collection detail view
 *
 * @see getCategoryConfigs
 * @see getContentBySlug
 * @see ConfigCard
 */
export async function CollectionDetailView({ collection }: CollectionDetailViewProps) {
  // Load category configs once (single RPC call)
  const categoryConfigs = await getCategoryConfigs();

  const metadata = getMetadata(collection);
  const items = Array.isArray(metadata['items'])
    ? (metadata['items'] as Array<{ category: string; slug: string; reason?: string }>)
    : [];

  const itemsWithContent = await Promise.all(
    items.map(async (itemRef): Promise<ItemWithData | null> => {
      const refData = itemRef;

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
        const normalized = normalizeError(error, 'Failed to load collection item');
        logger.error('Failed to load collection item', normalized, {
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
  // Validate category before using as property key to prevent property injection
  const itemsByCategory = validItems.reduce(
    (acc: Record<string, ItemWithData[]>, item: ItemWithData) => {
      if (!item) return acc;
      const category = item.category;
      // Validate category is safe before using as property key
      if (!isValidCategory(category)) {
        logger.warn('CollectionView: Invalid category in item', { category, slug: item.slug });
        return acc;
      }
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
    categories: Object.keys(itemsByCategory), // Array of category names - better for querying
    categoryCount: Object.keys(itemsByCategory).length,
  });

  const prerequisites = ensureStringArray(metadata['prerequisites']);
  const installationOrder = ensureStringArray(metadata['installation_order']);
  const compatibility =
    typeof metadata['compatibility'] === 'object' &&
    metadata['compatibility'] !== null &&
    !Array.isArray(metadata['compatibility'])
      ? (metadata['compatibility'] as { claudeDesktop?: boolean; claudeCode?: boolean })
      : undefined;

  return (
    <>
      {/* Prerequisites Section */}
      {prerequisites && prerequisites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className={`${cluster.compact} ${size.xl}`}>
              <AlertTriangle
                className={`${iconSize.md} ${textColor.yellow}`}
                aria-hidden="true"
              />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={spaceY.compact}>
              {prerequisites.map((prereq: string) => (
                <li key={prereq} className={`${row.compact}`}>
                  <CheckCircle
                    className={`${iconSize.sm} ${muted.default} ${marginTop.micro} ${flexGrow.shrink0}`}
                    aria-hidden="true"
                  />
                  <span className={muted.sm}>{prereq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What's Included Section - Embedded ConfigCards */}
      <div>
        <h2 className={`${marginBottom.comfortable} ${weight.bold} ${size['2xl']} ${textColor.foreground}`}>
          What's Included ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
        </h2>

        <Suspense
          fallback={
            <output className={spaceY.relaxed} aria-busy="true" aria-label="Loading collection items">
              <Skeleton size="xl" width="3xl" className="h-48" />
              <Skeleton size="xl" width="3xl" className="h-48" />
              <Skeleton size="xl" width="3xl" className="h-48" />
            </output>
          }
        >
          <div className={spaceY.loose}>
            {(Object.entries(itemsByCategory) as [string, ItemWithData[]][]).map(
              ([category, items]) => (
                <div key={category}>
                  <h3 className={`${marginBottom.default} ${weight.semibold} ${textColor.foreground} ${size.lg}`}>
                    {categoryConfigs[category as keyof typeof categoryConfigs]?.pluralTitle ||
                      category}{' '}
                    ({items.length})
                  </h3>
                  <div className={`grid ${gap.comfortable} sm:grid-cols-1`}>
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
            <CardTitle className={size.xl}>Recommended Installation Order</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className={spaceY.compact}>
              {installationOrder.map((slug: string, index: number) => {
                const item = validItems.find((i: ItemWithData) => i?.slug === slug);
                return (
                  <li key={slug} className={`${row.default}`}>
                    <span
                      className={`flex ${iconSize.lg} ${flexGrow.shrink0} ${alignItems.center} ${justify.center} ${radius.full} ${bgColor['primary/10']} ${weight.semibold} ${textColor.primary} ${size.sm}`}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className={`${marginTop.micro} ${textColor.foreground} ${size.sm}`}>
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
            <CardTitle className={size.xl}>Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-2 ${gap.comfortable}`}>
              <div className={cluster.compact}>
                {compatibility.claudeDesktop ? (
                  <CheckCircle
                    className={`${iconSize.sm} ${textColor.green}`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`${iconSize.sm} ${textColor.red}`}
                    aria-hidden="true"
                  />
                )}
                <span className={muted.sm}>
                  Claude Desktop {compatibility.claudeDesktop ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
              <div className={cluster.compact}>
                {compatibility.claudeCode ? (
                  <CheckCircle
                    className={`${iconSize.sm} ${textColor.green}`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`${iconSize.sm} ${textColor.red}`}
                    aria-hidden="true"
                  />
                )}
                <span className={muted.sm}>
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