import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import type { RelatedGuide } from '@/lib/schemas/app.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';

// Validation schema for API parameters
const paramsSchema = z.object({
  category: z.string().min(1),
  slug: z.string().min(1),
});

const querySchema = z.object({
  limit: z.coerce.number().min(1).max(10).default(3),
});

// Cache headers for Edge Function optimization
const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400', // 4h cache, 24h stale
  'CDN-Cache-Control': 'max-age=14400',
  'Vercel-CDN-Cache-Control': 'max-age=14400',
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
) {
  let resolvedParams: { category: string; slug: string } | undefined;
  try {
    resolvedParams = await params;
    const paramsValidation = paramsSchema.safeParse(resolvedParams);

    if (!paramsValidation.success) {
      return NextResponse.json(
        { error: 'Invalid parameters', details: paramsValidation.error.issues },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryValidation = querySchema.safeParse(Object.fromEntries(searchParams));

    if (!queryValidation.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: queryValidation.error.issues },
        { status: 400 }
      );
    }

    const { category, slug } = paramsValidation.data;
    const { limit } = queryValidation.data;

    // Get related guides using the optimized content system
    const relatedGuides = await getRelatedGuides([category, slug], limit);

    return NextResponse.json(
      { relatedGuides },
      {
        status: 200,
        headers: CACHE_HEADERS,
      }
    );
  } catch (error) {
    logger.error('API route error', error as Error, {
      route: '/api/guides/[category]/[slug]/related',
      category: resolvedParams?.category || 'unknown',
      slug: resolvedParams?.slug || 'unknown',
    });

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Extracted function from guides page for reuse
async function getRelatedGuides(currentSlug: string[], limit = 3): Promise<RelatedGuide[]> {
  const [currentCategory] = currentSlug;
  if (!currentCategory) return [];

  const currentTargetSlug = currentSlug.slice(1).join('-');

  try {
    // Get all SEO content using our optimized system
    let seoContent = await contentCache.getSEOContent();

    if (!seoContent) {
      seoContent = await contentProcessor.getSEOContent();
      if (seoContent) {
        await contentCache.setSEOContent(seoContent);
      }
    }

    // Get related guides from the same category, excluding current item
    const categoryContent = seoContent?.[currentCategory] || [];
    const relatedGuides: RelatedGuide[] = [];

    for (const item of categoryContent) {
      const itemSlug = item.slug.split('/').pop() || '';

      // Skip the current item
      if (
        itemSlug === currentTargetSlug ||
        item.title?.toLowerCase().replace(/\s+/g, '-') === currentTargetSlug
      ) {
        continue;
      }

      if (item.title) {
        relatedGuides.push({
          title: item.title,
          slug: `/guides/${currentCategory}/${itemSlug}`,
          category: currentCategory,
        });
      }

      if (relatedGuides.length >= limit) break;
    }

    return relatedGuides;
  } catch (error) {
    logger.error('Failed to get related guides', error as Error, {
      currentSlug: currentSlug.join('/'),
    });
    return [];
  }
}
