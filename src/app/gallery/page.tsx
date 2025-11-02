/**
 * Gallery Page - Showcase trending code screenshots
 * Database-first with ISR revalidation
 */

import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GalleryMasonryGrid } from '@/src/components/features/gallery/gallery-masonry-grid';
import { TrendingCarousel } from '@/src/components/features/gallery/trending-carousel';
import { Container } from '@/src/components/layout/container';
import { Skeleton } from '@/src/components/primitives/skeleton';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

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
export const revalidate = 900;

async function getGalleryData() {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_gallery_trending', {
    p_limit: 40,
    p_offset: 0,
    p_days_back: 90,
  });

  if (error) {
    logger.error('Failed to fetch gallery data', error, { source: 'GalleryPage' });
    return [];
  }

  return data || [];
}

export default async function GalleryPage() {
  const items = await getGalleryData();
  const trendingItems = items.slice(0, 10);
  const gridItems = items.slice(10);

  return (
    <Container className="py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
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
            <h2 className="text-2xl font-bold">Trending Now</h2>
            <span className="text-sm text-muted-foreground">
              {trendingItems.length} trending screenshots
            </span>
          </div>
          <Suspense
            fallback={
              <div className="w-full aspect-[16/10] bg-card rounded-xl border-2 border-border animate-pulse" />
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
          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap"
        >
          All
        </a>
        {['agents', 'commands', 'rules', 'mcp', 'hooks', 'skills'].map((category) => (
          <a
            key={category}
            href={`/gallery/${category}`}
            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors whitespace-nowrap capitalize"
          >
            {category}
          </a>
        ))}
      </section>

      {/* Masonry Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">All Screenshots</h2>
          <span className="text-sm text-muted-foreground">{items.length} total</span>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-80 rounded-xl" />
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
