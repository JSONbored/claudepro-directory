/**
 * Gallery Page - Showcase trending code screenshots
 * Database-first with ISR revalidation
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GalleryMasonryGrid } from '@/src/components/features/gallery/gallery-masonry-grid';
import { TrendingCarousel } from '@/src/components/features/gallery/trending-carousel';
import { Container } from '@/src/components/layout/container';
import { Skeleton } from '@/src/components/primitives/loading-skeleton';
import { logger } from '@/src/lib/logger';
import { createAnonClient } from '@/src/lib/supabase/server-anon';
import { getSkeletonKeys } from '@/src/lib/utils/skeleton-keys';

export const metadata: Metadata = {
  title: 'Code Screenshot Gallery | ClaudePro Directory',
  description:
    'Explore beautiful code screenshots from the ClaudePro community. Discover trending examples, share your own, and get inspired.',
  openGraph: {
    title: 'Code Screenshot Gallery | ClaudePro Directory',
    description:
      'Explore beautiful code screenshots from the ClaudePro community. Discover trending examples, share your own, and get inspired.',
  },
};

// ISR: Revalidate every 15 minutes
export const revalidate = false;

async function getGalleryData() {
  const supabase = createAnonClient();

  const { data, error } = await supabase.rpc('get_gallery_trending', {
    p_limit: 40,
    p_offset: 0,
    p_days_back: 90,
  });

  if (error) {
    logger.error('Failed to load gallery data', error);
  }

  return data || [];
}

export default async function GalleryPage() {
  const items = await getGalleryData();
  const trendingItems = items.slice(0, 10);
  const gridItems = items.slice(10);

  return (
    <Container className="space-y-16 py-12">
      {/* Header */}
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text font-bold text-4xl text-transparent md:text-5xl">
          Code Screenshot Gallery
        </h1>
        <p className="text-lg text-muted-foreground">
          Discover beautiful code examples from the ClaudePro community. Screenshot, share, and get
          inspired.
        </p>
      </div>

      {/* Trending Carousel */}
      {trendingItems.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-2xl">Trending Now</h2>
            <span className="text-muted-foreground text-sm">
              {trendingItems.length} trending screenshots
            </span>
          </div>
          <Suspense
            fallback={
              <div className="aspect-[16/10] w-full animate-pulse rounded-xl border-2 border-border bg-card" />
            }
          >
            <TrendingCarousel items={trendingItems} autoPlayInterval={5000} />
          </Suspense>
        </section>
      )}

      {/* Category Filters */}
      <section className="flex items-center gap-3 overflow-x-auto pb-2">
        <a
          href="/gallery"
          className="inline-flex items-center whitespace-nowrap rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
        >
          All
        </a>
        {['agents', 'commands', 'rules', 'mcp', 'hooks', 'skills'].map((category) => (
          <a
            key={category}
            href={`/gallery/${category}`}
            className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 font-medium text-sm capitalize transition-colors hover:border-primary/30 hover:bg-primary/5"
          >
            {category}
          </a>
        ))}
      </section>

      {/* Masonry Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl">All Screenshots</h2>
          <span className="text-muted-foreground text-sm">{items.length} total</span>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {getSkeletonKeys(12).map((key) => (
                <Skeleton key={key} className="h-80 rounded-xl" />
              ))}
            </div>
          }
        >
          <GalleryMasonryGrid initialItems={gridItems} itemsPerPage={20} />
        </Suspense>
      </section>
    </Container>
  );
}
