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

import type { EnrichedContentItem } from '@heyclaude/database-types/postgres-types';
import type { contentModel } from '@heyclaude/data-layer/prisma';
import { ensureStringArray, getMetadata, isValidCategory } from '@heyclaude/web-runtime/core';
import { getCategoryConfigs, getContentBySlug } from '@heyclaude/web-runtime/data';
import { AlertTriangle, CheckCircle } from '@heyclaude/web-runtime/icons';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import {
  ConfigCard,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@heyclaude/web-runtime/ui';
import { iconSize, cluster, gap, marginTop, spaceY, marginBottom } from '@heyclaude/web-runtime/design-system';
import { cn } from '@heyclaude/web-runtime/ui';
import { Suspense } from 'react';

interface ItemWithData {
  category: string;
  data: EnrichedContentItem;
  reason?: string;
  slug: string;
}

/**
 * Collection Detail View Props
 */
export interface CollectionDetailViewProps {
  /** Collection content with all metadata */
  collection: contentModel & { category: 'collections' };
}

/**
 * Render a collection's detail view with prerequisites, embedded items, installation order, and compatibility sections.
 *
 * Fetches category configurations and embedded item content server-side to populate and group items for display.
 *
 * @param collection - Content row for the collection (category fixed to `'collections'`) used to derive metadata and embedded item references
 * @returns A JSX element representing the collection detail view
 *
 * @see ConfigCard
 * @see getCategoryConfigs
 * @see getContentBySlug
 */
export async function CollectionDetailView({ collection }: CollectionDetailViewProps) {
  // Load category configs once (single RPC call)
  const categoryConfigs = await getCategoryConfigs();

  const metadata = getMetadata(collection);
  // Type guard for collection items
  function isCollectionItem(value: unknown): value is { category: string; reason?: string; slug: string } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    // Type narrowing: value is object, check properties
    const obj = value as Record<string, unknown>;
    return typeof obj['category'] === 'string' && typeof obj['slug'] === 'string';
  }

  const items = Array.isArray(metadata['items'])
    ? metadata['items'].filter(isCollectionItem)
    : [];

  const itemsWithContent = await Promise.all(
    items.map(async (itemRef): Promise<ItemWithData | null> => {
      const refData = itemRef;

      try {
        // Type guard validation
        if (!isValidCategory(refData.category)) {
          logger.error(
            {
              err: new Error('Invalid category'),
              category: refData.category,
              slug: refData.slug,
            },
            'Invalid category in collection item reference'
          );
          return null;
        }

        const item = await getContentBySlug(refData.category, refData.slug);
        return item ? { ...refData, data: item } : null;
      } catch (error) {
        const normalized = normalizeError(error, 'Failed to load collection item');
        logger.error(
          {
            err: normalized,
            category: refData.category,
            slug: refData.slug,
          },
          'Failed to load collection item'
        );
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
        logger.warn(
          { category, slug: item.slug },
          'CollectionView: Invalid category in item'
        );
        return acc;
      }
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    },
    {} satisfies Record<string, ItemWithData[]>
  );

  logger.info(
    {
      slug: collection.slug,
      itemCount: validItems.length,
      categories: Object.keys(itemsByCategory), // Array of category names - better for querying
      categoryCount: Object.keys(itemsByCategory).length,
    },
    'Collection detail view rendered'
  );

  const prerequisites = ensureStringArray(metadata['prerequisites']);
  const installationOrder = ensureStringArray(metadata['installation_order']);
  // Type narrowing: compatibility is object with optional boolean properties
  const compatibilityRaw = metadata['compatibility'];
  const compatibility: { claudeCode?: boolean; claudeDesktop?: boolean } | undefined =
    typeof compatibilityRaw === 'object' &&
    compatibilityRaw !== null &&
    !Array.isArray(compatibilityRaw) &&
    ('claudeCode' in compatibilityRaw || 'claudeDesktop' in compatibilityRaw)
      ? (() => {
          const result: { claudeCode?: boolean; claudeDesktop?: boolean } = {};
          const rawObj = compatibilityRaw as Record<string, unknown>;
          if (typeof rawObj['claudeCode'] === 'boolean') {
            result.claudeCode = rawObj['claudeCode'];
          }
          if (typeof rawObj['claudeDesktop'] === 'boolean') {
            result.claudeDesktop = rawObj['claudeDesktop'];
          }
          return Object.keys(result).length > 0 ? result : undefined;
        })()
      : undefined;

  return (
    <>
      {/* Prerequisites Section */}
      {prerequisites && prerequisites.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className={`flex items-center ${gap.tight} text-xl`}>
              <AlertTriangle
                className={`${iconSize.md} text-yellow-500`}
                aria-hidden="true"
              />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className={`${spaceY.compact}`}>
              {prerequisites.map((prereq: string) => (
                <li key={prereq} className={`flex items-start ${gap.compact}`}>
                  <CheckCircle
                    className={`text-muted-foreground h-4 w-4 flex-shrink-0 ${marginTop.micro}`}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground text-sm">{prereq}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/* What's Included Section - Embedded ConfigCards */}
      <div>
        <h2 className={`text-foreground ${marginBottom.comfortable} text-2xl font-bold`}>
          What's Included ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
        </h2>

        <Suspense
          fallback={
            <output className={`${spaceY.relaxed}`} aria-busy="true" aria-label="Loading collection items">
              <Skeleton size="xl" width="3xl" className="h-48" />
              <Skeleton size="xl" width="3xl" className="h-48" />
              <Skeleton size="xl" width="3xl" className="h-48" />
            </output>
          }
        >
          <div className={`${spaceY.loose}`}>
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className={`text-foreground ${marginBottom.default} text-lg font-semibold`}>
                  {(isValidCategory(category) && category in categoryConfigs
                    ? categoryConfigs[category]?.pluralTitle
                    : null) ||
                    category}{' '}
                  ({items.length})
                </h3>
                <div className={`grid ${gap.default} sm:grid-cols-1`}>
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
            ))}
          </div>
        </Suspense>
      </div>

      {/* Installation Order Section */}
      {installationOrder && installationOrder.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Recommended Installation Order</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className={`${spaceY.compact}`}>
              {installationOrder.map((slug: string, index: number) => {
                const item = validItems.find((i: ItemWithData) => i?.slug === slug);
                return (
                  <li key={slug} className={`flex items-start ${gap.default}`}>
                    <span
                      className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className={cn('text-foreground', marginTop['4.5'], 'text-sm')}>
                      {item?.data?.title || slug}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      ) : null}

      {/* Compatibility Section */}
      {compatibility ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-2 ${gap.default}`}>
              <div className={cluster.compact}>
                {compatibility.claudeDesktop ? (
                  <CheckCircle
                    className={`${iconSize.sm} text-green-500`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`${iconSize.sm} text-red-500`}
                    aria-hidden="true"
                  />
                )}
                <span className="text-muted-foreground text-sm">
                  Claude Desktop {compatibility.claudeDesktop ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
              <div className={cluster.compact}>
                {compatibility.claudeCode ? (
                  <CheckCircle
                    className={`${iconSize.sm} text-green-500`}
                    aria-hidden="true"
                  />
                ) : (
                  <AlertTriangle
                    className={`${iconSize.sm} text-red-500`}
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
      ) : null}
    </>
  );
}