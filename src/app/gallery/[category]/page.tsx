/**
 * Category-Filtered Gallery Page
 * Database-first with ISR revalidation
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { GalleryMasonryGrid } from '@/src/components/features/gallery/gallery-masonry-grid';
import { TrendingCarousel } from '@/src/components/features/gallery/trending-carousel';
import { Container } from '@/src/components/layout/container';
import { Skeleton } from '@/src/components/primitives/skeleton';
import { isValidCategory, VALID_CATEGORIES } from '@/src/lib/config/category-config';
import { logger } from '@/src/lib/logger';
import { createClient } from '@/src/lib/supabase/server';

interface CategoryGalleryPageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: CategoryGalleryPageProps): Promise<Metadata> {
  const { category } = await params;

  if (!isValidCategory(category)) {
    return { title: 'Not Found' };
  }

  const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);

  return {
    title: `${capitalizedCategory} Screenshots | ClaudePro Gallery`,
    description: `Explore trending ${category} code screenshots from the ClaudePro community. Discover examples, share your own, and get inspired.`,
    openGraph: {
      title: `${capitalizedCategory} Screenshots | ClaudePro Gallery`,
      description: `Explore trending ${category} code screenshots from the ClaudePro community.`,
    },
  };
}

export async function generateStaticParams() {
  return VALID_CATEGORIES.map((category) => ({ category }));
}

// ISR: Revalidate every 15 minutes
export const revalidate = 900;

async function getCategoryGalleryData(category: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc('get_gallery_trending', {
    p_category: category,
    p_limit: 40,
    p_offset: 0,
    p_days_back: 90,
  });

  if (error) {
    logger.error('Failed to fetch gallery data', error, {
      category,
      source: 'CategoryGalleryPage',
    });
    return [];
  }

  return data || [];
}

export default async function CategoryGalleryPage({ params }: CategoryGalleryPageProps) {
  const { category } = await params;

  if (!isValidCategory(category)) {
    notFound();
  }

  const items = await getCategoryGalleryData(category);
  const trendingItems = items.slice(0, 10);
  const gridItems = items.slice(10);
  const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Container className="py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
          {capitalizedCategory} Screenshots
        </h1>
        <p className="text-lg text-muted-foreground">
          Discover trending {category} examples from the ClaudePro community
        </p>
      </div>

      {/* Category Filters */}
      <section className="flex items-center gap-3 overflow-x-auto pb-2">
        <a
          href="/gallery"
          className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-card border border-border hover:border-primary/30 hover:bg-primary/5 transition-colors whitespace-nowrap"
        >
          All
        </a>
        {VALID_CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`/gallery/${cat}`}
            className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap capitalize ${
              cat === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-card border border-border hover:border-primary/30 hover:bg-primary/5'
            }`}
          >
            {cat}
          </a>
        ))}
      </section>

      {/* Trending Carousel */}
      {trendingItems.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Trending {capitalizedCategory}</h2>
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

      {/* Masonry Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">All {capitalizedCategory} Screenshots</h2>
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
          <GalleryMasonryGrid initialItems={gridItems} category={category} itemsPerPage={20} />
        </Suspense>
      </section>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
            <span className="text-3xl">📸</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">No {category} screenshots yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Be the first to create and share code screenshots from {category}
          </p>
          <a
            href={`/${category}`}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Browse {capitalizedCategory}
          </a>
        </div>
      )}
    </Container>
  );
}
