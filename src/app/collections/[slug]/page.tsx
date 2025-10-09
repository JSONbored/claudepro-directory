/**
 * Collection Detail Page
 *
 * Displays a collection with all its included items as embedded cards.
 * This page showcases the unique value of collections: seeing multiple related
 * content items organized together in a cohesive, beautiful display.
 *
 * Features:
 * - Collection header with metadata (type, difficulty, setup time)
 * - Embedded cards for each item in the collection
 * - Items grouped by category for better organization
 * - Installation order guidance
 * - Prerequisites and compatibility info
 * - View tracking for analytics
 *
 * Performance:
 * - Static generation with ISR (4-hour revalidation)
 * - Lazy loading for item content
 * - Optimistic UI updates
 *
 * @see app/[category]/[slug]/page.tsx - Similar pattern for content items
 * @see components/features/content/config-card.tsx - Reused for embedded items
 */

import { AlertTriangle, CheckCircle, Clock, Layers } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { getCollectionFullContent, getCollections } from '@/generated/content';
import { ConfigCard } from '@/src/components/features/content/config-card';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card';
import { SourceBadge, TagBadge } from '@/src/components/ui/config-badge';
import { trackView } from '@/src/lib/actions/track-view';
import { getContentBySlug } from '@/src/lib/content/content-loaders';
import { logger } from '@/src/lib/logger';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import type { CollectionItemReference } from '@/src/lib/schemas/content/collection.schema';
import type { ContentCategory } from '@/src/lib/schemas/shared.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

interface ItemWithData extends CollectionItemReference {
  data: UnifiedContentItem;
}

/**
 * ISR revalidation (4 hours)
 */

/**
 * Difficulty colors
 */
const DIFFICULTY_COLORS = {
  beginner: 'bg-green-500/10 text-green-400 border-green-500/20',
  intermediate: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  advanced: 'bg-red-500/10 text-red-400 border-red-500/20',
} as const;

/**
 * Collection type labels
 */
const COLLECTION_TYPE_LABELS = {
  'starter-kit': 'Starter Kit',
  workflow: 'Workflow',
  'advanced-system': 'Advanced System',
  'use-case': 'Use Case',
} as const;

/**
 * Category display names
 */
const CATEGORY_NAMES: Record<string, string> = {
  agents: 'AI Agents',
  mcp: 'MCP Servers',
  rules: 'Rules',
  commands: 'Commands',
  hooks: 'Hooks',
  statuslines: 'Statuslines',
};

/**
 * Generate static params for all collections
 */
export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((collection: { slug: string }) => ({
    slug: collection.slug,
  }));
}

/**
 * Generate metadata for collection page
 * Uses centralized metadata system with CollectionPage schema for SEO
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await getCollectionFullContent(slug);

  if (!collection) {
    return {
      title: 'Collection Not Found',
      description: 'The requested collection could not be found.',
    };
  }

  // Use centralized metadata system with CollectionPage schema
  // Collections use special structured data for better discovery
  return await generatePageMetadata('/collections/:slug', {
    params: { slug },
    item: {
      title: collection.title || collection.slug,
      description: collection.description,
      tags: collection.tags,
      author: collection.author,
      dateAdded: collection.dateAdded,
      lastModified: collection.dateAdded,
    },
  });
}

/**
 * Collection detail page component
 */
export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Load collection
  const collection = await getCollectionFullContent(slug);

  if (!collection) {
    logger.warn('Collection not found', { slug });
    notFound();
  }

  // Track view (async, don't await)
  trackView({ category: 'collections', slug }).catch(() => {
    // Silent fail
  });

  // Load all referenced items with full content
  const itemsWithContent = await Promise.all(
    collection.items.map(async (itemRef: CollectionItemReference): Promise<ItemWithData | null> => {
      try {
        const item = await getContentBySlug(itemRef.category as ContentCategory, itemRef.slug);
        return item ? { ...itemRef, data: item } : null;
      } catch (error) {
        logger.error('Failed to load collection item', error as Error, {
          category: itemRef.category,
          slug: itemRef.slug,
        });
        return null;
      }
    })
  );

  // Filter out failed loads
  const validItems = itemsWithContent.filter(
    (item: ItemWithData | null): item is ItemWithData => item !== null
  );

  // Group items by category
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

  const title = collection.title || collection.slug;

  logger.info('Collection detail page rendered', {
    slug,
    itemCount: validItems.length,
    categories: Object.keys(itemsByCategory).length,
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <Badge
                variant="outline"
                className="text-sm border-blue-500/20 bg-blue-500/10 text-blue-400"
              >
                <Layers className="h-3 w-3 mr-1" />
                {COLLECTION_TYPE_LABELS[
                  collection.collectionType as keyof typeof COLLECTION_TYPE_LABELS
                ] || collection.collectionType}
              </Badge>
              <Badge
                variant="outline"
                className={`text-sm ${DIFFICULTY_COLORS[collection.difficulty as keyof typeof DIFFICULTY_COLORS] || ''}`}
              >
                {collection.difficulty}
              </Badge>
              {collection.estimatedSetupTime && (
                <Badge variant="outline" className="text-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {collection.estimatedSetupTime}
                </Badge>
              )}
              {collection.source && <SourceBadge source={collection.source} />}
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4">{title}</h1>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-3xl mb-6">{collection.description}</p>

            {/* Tags */}
            {collection.tags && collection.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {collection.tags.map((tag: string) => (
                  <TagBadge key={tag} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-12">
          {/* Prerequisites */}
          {collection.prerequisites && collection.prerequisites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Prerequisites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {collection.prerequisites.map((prereq: string) => (
                    <li key={prereq} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* What's Included Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">
              What's Included ({validItems.length} {validItems.length === 1 ? 'item' : 'items'})
            </h2>

            <Suspense
              fallback={
                <div className="space-y-6">
                  <div className="h-48 rounded-lg border border-border bg-card/50 animate-pulse" />
                  <div className="h-48 rounded-lg border border-border bg-card/50 animate-pulse" />
                  <div className="h-48 rounded-lg border border-border bg-card/50 animate-pulse" />
                </div>
              }
            >
              <div className="space-y-8">
                {(Object.entries(itemsByCategory) as [string, ItemWithData[]][]).map(
                  ([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category} (
                        {items.length})
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-1">
                        {items.map((item: ItemWithData) =>
                          item?.data ? (
                            <ConfigCard key={item.slug} item={item.data} showCategory={false} />
                          ) : null
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </Suspense>
          </div>

          {/* Installation Order */}
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
                      <li key={slug} className="flex items-start gap-3">
                        <span className="flex-shrink-0 flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-sm font-semibold">
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

          {/* Compatibility */}
          {collection.compatibility && (
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Compatibility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    {collection.compatibility.claudeDesktop ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground">Claude Desktop</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {collection.compatibility.claudeCode ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm text-muted-foreground">Claude Code</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
