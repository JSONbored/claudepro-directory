/**
 * Collections List Page
 *
 * Displays a grid of content collections with search and filter capabilities.
 * Collections are curated bundles of related content items (agents, MCP servers, commands, etc.)
 * organized by type, difficulty, and use case.
 *
 * Features:
 * - Search collections by title, description, or tags
 * - Filter by collection type (starter-kit, workflow, advanced-system, use-case)
 * - Filter by difficulty level (beginner, intermediate, advanced)
 * - Responsive grid layout
 * - ISR with 4-hour revalidation
 *
 * Performance:
 * - Static generation at build time
 * - Redis caching for collection metadata
 * - Lazy loading for collection details
 *
 * @see app/[category]/page.tsx - Similar pattern for content categories
 * @see components/features/content/collection-card.tsx - Collection card component
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import type { CollectionMetadata } from '@/generated/collections-metadata';
import { getCollections } from '@/generated/content';
import { CollectionCard } from '@/src/components/features/content/collection-card';
import { Badge } from '@/src/components/ui/badge';
import { APP_CONFIG } from '@/src/lib/constants';
import { Layers } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';

/**
 * ISR revalidation interval (4 hours)
 */

/**
 * Page metadata for SEO
 */
export const metadata: Metadata = {
  title: `Collections - ${APP_CONFIG.name}`,
  description:
    'Browse curated collections of Claude configurations. Discover starter kits, workflows, and advanced systems combining multiple agents, MCP servers, commands, and more.',
  keywords: [
    'claude collections',
    'configuration bundles',
    'starter kits',
    'workflows',
    'setup guides',
    'claude pro',
    'ai tools',
  ],
  alternates: {
    canonical: `${APP_CONFIG.url}/collections`,
  },
  openGraph: {
    title: `Collections - ${APP_CONFIG.name}`,
    description: 'Curated collections of Claude configurations for common workflows and use cases',
    type: 'website',
    url: `${APP_CONFIG.url}/collections`,
    siteName: APP_CONFIG.name,
  },
  twitter: {
    card: 'summary_large_image',
    title: `Collections - ${APP_CONFIG.name}`,
    description: 'Curated collections of Claude configurations for common workflows and use cases',
  },
};

/**
 * Collections list page component
 *
 * Server component that renders the collections list with search and filtering.
 * Uses ISR for automatic updates every 4 hours.
 */
export default async function CollectionsPage() {
  // Load all collections
  const collections = await getCollections();

  logger.info('Collections page rendered', {
    collectionCount: collections.length,
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Header */}
      <div className="border-b border-border/40 bg-gradient-to-b from-background to-muted/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-12">
            {/* Icon + Title */}
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-lg bg-primary/10 p-2">
                <Layers className="h-6 w-6 text-primary" aria-hidden="true" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Collections</h1>
            </div>

            {/* Description */}
            <p className="text-lg text-muted-foreground max-w-3xl mb-6">
              Curated bundles of related configurations for common workflows and use cases. Each
              collection combines multiple agents, MCP servers, commands, and other tools into a
              cohesive system.
            </p>

            {/* Stats Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-sm">
                <Layers className="h-3 w-3 mr-1" aria-hidden="true" />
                {collections.length} {collections.length === 1 ? 'Collection' : 'Collections'}
              </Badge>
              <Badge variant="outline" className="text-sm">
                Starter Kits, Workflows & Advanced Systems
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <div className="h-64 rounded-lg border border-border bg-card/50 animate-pulse" />
              <div className="h-64 rounded-lg border border-border bg-card/50 animate-pulse" />
              <div className="h-64 rounded-lg border border-border bg-card/50 animate-pulse" />
              <div className="h-64 rounded-lg border border-border bg-card/50 animate-pulse" />
              <div className="h-64 rounded-lg border border-border bg-card/50 animate-pulse" />
              <div className="h-64 rounded-lg border border-border bg-card/50 animate-pulse" />
            </div>
          }
        >
          {collections.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection: CollectionMetadata) => (
                <CollectionCard key={collection.slug} item={collection} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">
                No collections available
              </h2>
              <p className="text-muted-foreground">
                Check back soon for curated configuration bundles.
              </p>
            </div>
          )}
        </Suspense>
      </div>
    </div>
  );
}
