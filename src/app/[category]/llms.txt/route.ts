/**
 * Category LLMs.txt Route Handler
 * Generates AI-optimized plain text index for content categories
 *
 * @route GET /[category]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import { isValidCategory, UNIFIED_CATEGORY_REGISTRY } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { getContentByCategory } from '@/src/lib/content/supabase-content-loader';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { generateCategoryLLMsTxt, type LLMsTxtItem } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';

/**
 * Generate static params for all valid categories
 * @returns Array of category slugs for static generation
 */
export async function generateStaticParams() {
  const { VALID_CATEGORIES } = await import('@/src/lib/config/category-config');

  return VALID_CATEGORIES.map((category) => ({
    category,
  }));
}

/**
 * Handle GET request for category llms.txt
 *
 * @param request - Next.js request object
 * @param context - Route context with params
 * @returns Plain text response with category index
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string }> }
): Promise<Response> {
  // Note: Cannot use logger.forRequest() in cached routes (Request object not accessible)

  try {
    const { category } = await context.params;

    logger.info('Category llms.txt generation started', { category });

    // Validate category
    if (!isValidCategory(category)) {
      logger.warn('Invalid category requested for llms.txt', {
        category,
      });

      return apiResponse.raw('Category not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Get category configuration and content
    const config = UNIFIED_CATEGORY_REGISTRY[category];

    // Handle case where config is not found (should never happen with validation above)
    if (!config) {
      logger.error(
        'Category config not found despite validation',
        new Error('Config not found after validation'),
        { category }
      );

      return apiResponse.raw('Internal server error', {
        contentType: 'text/plain; charset=utf-8',
        status: 500,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    const items = await getContentByCategory(category);

    // Transform items to LLMsTxtItem format
    const llmsItems: LLMsTxtItem[] = items.map((item) => ({
      slug: item.slug,
      title: item.title || item.slug,
      description: item.description,
      category: item.category,
      tags: item.tags,
      author: item.author,
      date_added: item.date_added,
      url: `${APP_CONFIG.url}/${category}/${item.slug}`,
    }));

    // Generate llms.txt content (config is now guaranteed non-null)
    const llmsTxt = await generateCategoryLLMsTxt(
      llmsItems,
      config.pluralTitle,
      config.description,
      {
        includeContent: false, // Category index - summaries only
        includeDescription: true,
        includeTags: true,
        includeUrl: true,
      }
    );

    logger.info('Category llms.txt generated successfully', {
      category,
      itemsCount: llmsItems.length,
      contentLength: llmsTxt.length,
    });

    // Return plain text response
    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      headers: { 'X-Robots-Tag': 'index, follow' },
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error: unknown) {
    const { category } = await context.params.catch(() => ({ category: 'unknown' }));

    logger.error(
      'Failed to generate category llms.txt',
      error instanceof Error ? error : new Error(String(error)),
      { category }
    );

    // Use centralized error handling
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Failed to generate llms.txt' },
      {
        route: '/[category]/llms.txt',
        operation: 'generate_category_llmstxt',
        method: 'GET',
        logContext: { category },
      }
    );
  }
}
