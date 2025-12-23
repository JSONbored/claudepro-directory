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

import type { Prisma, content_category } from '@prisma/client';

type contentModel = Prisma.contentGetPayload<{}>;
import { ensureStringArray, getMetadata } from '@heyclaude/web-runtime/utils/content-helpers';
import { isValidCategory } from '@heyclaude/web-runtime/utils/category-validation';
import { getCategoryConfigs } from '@heyclaude/web-runtime/data/config/category';
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
import { cn } from '@heyclaude/web-runtime/ui';
import { Suspense } from 'react';

interface ItemWithData {
  category: string;
  data: contentModel;
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
  function isCollectionItem(
    value: unknown
  ): value is { category: string; reason?: string; slug: string } {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    // Type narrowing: value is object, check properties
    const obj = value as Record<string, unknown>;
    return typeof obj['category'] === 'string' && typeof obj['slug'] === 'string';
  }

  const items = Array.isArray(metadata['items']) ? metadata['items'].filter(isCollectionItem) : [];

  // OPTIMIZATION: Batch fetch all collection items in single RPC call(s) instead of N+1 queries
  // This reduces database calls from N (one per item) to C (one per category)
  const validItemRefs = items.filter((itemRef) => {
    if (!isValidCategory(itemRef.category)) {
      logger.error(
        {
          err: new Error('Invalid category'),
          category: itemRef.category,
          slug: itemRef.slug,
        },
        'Invalid category in collection item reference'
      );
      return false;
    }
    return true;
  });

  let itemsWithContent: Array<ItemWithData | null> = [];

  if (validItemRefs.length > 0) {
    try {
      // Import batch fetch function
      const { getContentBatchBySlugs } = await import('@heyclaude/web-runtime/data/content');

      // Batch fetch all items by category
      const contentMap = await getContentBatchBySlugs(
        validItemRefs.map((ref) => ({
          category: ref.category as content_category,
          slug: ref.slug,
        }))
      );

      // Map fetched content to items
      itemsWithContent = validItemRefs.map((refData): ItemWithData | null => {
        const item = contentMap.get(refData.slug);
        return item ? { ...refData, data: item } : null;
      });
    } catch (error) {
      const normalized = normalizeError(error, 'Failed to batch load collection items');
      logger.error(
        {
          err: normalized,
          itemCount: validItemRefs.length,
        },
        'Failed to batch load collection items'
      );
      // Fallback to empty array on error
      itemsWithContent = [];
    }
  }

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
        logger.warn({ category, slug: item.slug }, 'CollectionView: Invalid category in item');
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
            <CardTitle className="flex items-center gap-1 text-lg">
              <AlertTriangle className="h-5 w-5 text-[var(--color-warning)]" aria-hidden="true" />
              Prerequisites
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {prerequisites.map((prereq: string) => (
                <li key={prereq} className="flex items-start gap-2">
                  <CheckCircle
                    className="text-muted-foreground mt-0.5 h-4 w-4 flex-shrink-0"
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
        <h2 className="text-foreground mb-6 text-2xl font-bold">
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
            {Object.entries(itemsByCategory).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-foreground mb-4 text-lg font-semibold">
                  {(isValidCategory(category) && category in categoryConfigs
                    ? categoryConfigs[category]?.pluralTitle
                    : null) || category}{' '}
                  ({items.length})
                </h3>
                <div className="grid gap-3 sm:grid-cols-1">
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
            <CardTitle className="text-lg">Recommended Installation Order</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {installationOrder.map((slug: string, index: number) => {
                const item = validItems.find((i: ItemWithData) => i?.slug === slug);
                return (
                  <li key={slug} className="flex items-start gap-3">
                    <span
                      className="bg-primary/10 text-primary flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className={cn('text-foreground', 'mt-[18px]', 'text-sm')}>
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
            <CardTitle className="text-lg">Compatibility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                {compatibility.claudeDesktop ? (
                  <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-error" aria-hidden="true" />
                )}
                <span className="text-muted-foreground text-sm">
                  Claude Desktop {compatibility.claudeDesktop ? '(Supported)' : '(Not Supported)'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {compatibility.claudeCode ? (
                  <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-error" aria-hidden="true" />
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
