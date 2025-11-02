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
import { getSkeletonKeys } from '@/src/lib/utils/skeleton-keys';

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
    <Container className="space-y-16 py-12">
      {/* Header */}
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text font-bold text-4xl text-transparent md:text-5xl">
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
          className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-card px-4 py-2 font-medium text-sm transition-colors hover:border-primary/30 hover:bg-primary/5"
        >
          All
        </a>
        {VALID_CATEGORIES.map((cat) => (
          <a
            key={cat}
            href={`/gallery/${cat}`}
            className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-2 font-medium text-sm capitalize transition-colors ${
              cat === category
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card hover:border-primary/30 hover:bg-primary/5'
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
            <h2 className="font-bold text-2xl">Trending {capitalizedCategory}</h2>
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

      {/* Masonry Grid */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-2xl">All {capitalizedCategory} Screenshots</h2>
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
          <GalleryMasonryGrid initialItems={gridItems} category={category} itemsPerPage={20} />
        </Suspense>
      </section>

      {/* Empty State */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
            <span className="text-3xl">📸</span>
          </div>
          <h3 className="mb-2 font-semibold text-lg">No {category} screenshots yet</h3>
          <p className="mb-6 max-w-md text-muted-foreground text-sm">
            Be the first to create and share code screenshots from {category}
          </p>
          <a
            href={`/${category}`}
            className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Browse {capitalizedCategory}
          </a>
        </div>
      )}
    </Container>
  );
}
