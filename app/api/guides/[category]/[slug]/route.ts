import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { SEOPageData } from '@/lib/schemas/app.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Validation schema for API parameters
const paramsSchema = z.object({
  category: z.string().min(1),
  slug: z.string().min(1),
});

// Cache headers for Edge Function optimization
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400', // 4h cache, 24h stale
  'CDN-Cache-Control': 'max-age=14400',
  'Vercel-CDN-Cache-Control': 'max-age=14400',
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  let resolvedParams: { category: string; slug: string } | undefined;
  try {
    resolvedParams = await params;
    const validationResult = paramsSchema.safeParse(resolvedParams);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { category, slug } = validationResult.data;

    // Get SEO page data using the optimized content system
    const data = await getSEOPageData([category, slug]);

    if (!data) {
      return NextResponse.json({ error: 'Guide not found' }, { status: 404 });
    }

    return NextResponse.json(data, {
      status: 200,
      headers: CACHE_HEADERS,
    });
  } catch (error) {
    logger.error('API route error', error as Error, {
      route: '/api/guides/[category]/[slug]',
      category: resolvedParams?.category || 'unknown',
      slug: resolvedParams?.slug || 'unknown',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Extracted function from guides page for reuse
async function getSEOPageData(slug: string[]): Promise<SEOPageData | null> {
  const [category, ...restSlug] = slug;
  const targetSlug = restSlug.join('-');

  if (!category) return null;

  try {
    // Get all SEO content using our optimized system
    let seoContent = await contentCache.getSEOContent();

    if (!seoContent) {
      seoContent = await contentProcessor.getSEOContent();
      if (seoContent) {
        await contentCache.setSEOContent(seoContent);
      }
    }

    // Find the specific content item
    const categoryContent = seoContent?.[category] || [];
    const contentItem = categoryContent.find((item) => {
      const itemSlug = item.slug.split('/').pop() || '';
      return (
        itemSlug === targetSlug || item.title?.toLowerCase().replace(/\s+/g, '-') === targetSlug
      );
    });

    if (!contentItem) return null;

    // Get the full content from content processor
    const fullContent = await contentProcessor.getFullContentBySlug(category, targetSlug);

    if (!fullContent || typeof fullContent !== 'string') return null;

    return {
      title: contentItem.title || '',
      description: contentItem.description || '',
      keywords: contentItem.tags || [],
      dateUpdated: contentItem.dateAdded || '',
      author: contentItem.author || APP_CONFIG.author,
      readingTime: '', // Can be calculated from content if needed
      difficulty: contentItem.difficulty || '',
      category: contentItem.category || category,
      content: fullContent,
    };
  } catch (error) {
    logger.error('Failed to get SEO page data', error as Error, { slug: slug.join('/') });
    return null;
  }
}
