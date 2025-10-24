/**
 * Item Detail LLMs.txt Route Handler
 * Generates AI-optimized plain text for individual content items
 *
 * @route GET /[category]/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import { isValidCategory, VALID_CATEGORIES } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/content-loaders';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { buildRichContent, type ContentItem } from '@/src/lib/llms-txt/content-builder';
import { generateLLMsTxt, type LLMsTxtItem } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import type {
  CollectionContent,
  CollectionItemReference,
} from '@/src/lib/schemas/content/collection.schema';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';

/**
 * Generate static params for all category/slug combinations
 *
 * @returns Array of category/slug params for static generation
 *
 * @remarks
 * Generates params for all 168+ detail pages across all categories.
 * This ensures llms.txt routes are pre-rendered at build time.
 */
export async function generateStaticParams() {
  const allParams: Array<{ category: string; slug: string }> = [];

  for (const category of VALID_CATEGORIES) {
    const items = await getContentByCategory(category);

    for (const item of items) {
      allParams.push({
        category,
        slug: item.slug,
      });
    }
  }

  return allParams;
}

/**
 * Handle GET request for item detail llms.txt
 *
 * @param request - Next.js request object
 * @param context - Route context with category and slug params
 * @returns Plain text response with full item content
 *
 * @remarks
 * This route generates complete llms.txt content for individual items including:
 * - Full metadata (category, author, tags, date)
 * - Complete description
 * - Full content (markdown converted to plain text)
 * - PII sanitization applied
 * - Canonical URL for reference
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string; slug: string }> }
): Promise<Response> {
  // Note: Cannot use logger.forRequest() in cached routes (Request object not accessible)

  try {
    const { category, slug } = await context.params;

    logger.info('Item llms.txt generation started', { category, slug });

    // Validate category
    if (!isValidCategory(category)) {
      logger.warn('Invalid category requested for item llms.txt', {
        category,
        slug,
      });

      return apiResponse.raw('Category not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Get item metadata first (fast, cached)
    const item = await getContentBySlug(category, slug);

    if (!item) {
      logger.warn('Item not found for llms.txt', { category, slug });

      return apiResponse.raw('Content not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Get full content (includes markdown content field)
    const fullItem = await getFullContentBySlug(category, slug);

    // Handle case where full content is not found
    if (!fullItem) {
      logger.warn('Full item content not found for llms.txt', {
        category,
        slug,
      });

      return apiResponse.raw('Content not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Collections require special handling with embedded items
    if (category === 'collections') {
      const collection = fullItem as CollectionContent;

      // Build detailed content including all embedded items (NO TRUNCATION)
      let detailedContent = '';

      if (collection.items && collection.items.length > 0) {
        detailedContent += 'INCLUDED ITEMS\n--------------\n\n';

        // Group items by category
        const itemsByCategory = collection.items.reduce(
          (acc: Record<string, CollectionItemReference[]>, item: CollectionItemReference) => {
            const itemCategory = item.category || 'other';
            if (!acc[itemCategory]) acc[itemCategory] = [];
            acc[itemCategory].push(item);
            return acc;
          },
          {} as Record<string, CollectionItemReference[]>
        );

        // Fetch actual item details and build full content (NO TRUNCATION)
        for (const [itemCategory, items] of Object.entries(itemsByCategory)) {
          detailedContent += `${itemCategory.toUpperCase()}:\n`;
          for (const itemRef of items as CollectionItemReference[]) {
            // Fetch the actual item to get title and description
            try {
              const actualItem = await getContentBySlug(itemRef.category, itemRef.slug);
              if (actualItem) {
                detailedContent += `• ${actualItem.title || actualItem.name || itemRef.slug}\n`;
                // Include FULL description - no truncation for AI consumption
                if (actualItem.description) {
                  detailedContent += `  ${actualItem.description}\n`;
                }
                if (itemRef.reason) {
                  detailedContent += `  Reason: ${itemRef.reason}\n`;
                }
              } else {
                // Fallback if item not found
                detailedContent += `• ${itemRef.slug}\n`;
                if (itemRef.reason) {
                  detailedContent += `  ${itemRef.reason}\n`;
                }
              }
            } catch (error) {
              // If item fetch fails, use fallback
              logger.warn('Failed to fetch collection item details', {
                category: itemRef.category,
                slug: itemRef.slug,
                error: error instanceof Error ? error.message : String(error),
              });
              detailedContent += `• ${itemRef.slug}\n`;
              if (itemRef.reason) {
                detailedContent += `  ${itemRef.reason}\n`;
              }
            }
          }
          detailedContent += '\n';
        }
      }

      // Add metadata sections (safely handle optional properties)
      if (collection.prerequisites && collection.prerequisites.length > 0) {
        detailedContent += '\nPREREQUISITES\n-------------\n';
        detailedContent += collection.prerequisites.map((p: string) => `• ${p}`).join('\n');
        detailedContent += '\n\n';
      }

      // Transform to LLMsTxtItem format for collections
      const llmsItem: LLMsTxtItem = {
        slug: collection.slug,
        title: String(collection.title),
        description: collection.description,
        content: detailedContent, // Full detailed content with all items (unlimited length)
        category: 'collections',
        tags: collection.tags || [],
        author: collection.author || undefined,
        dateAdded: collection.dateAdded || undefined,
        url: `${APP_CONFIG.url}/collections/${slug}`,
      };

      // Generate llms.txt content with FULL content included
      const llmsTxt = await generateLLMsTxt(llmsItem, {
        includeMetadata: true,
        includeDescription: true,
        includeTags: true,
        includeUrl: true,
        includeContent: true, // Include full detailed content
        sanitize: true,
      });

      logger.info('Collection llms.txt generated successfully', {
        slug,
        contentLength: llmsTxt.length,
        itemsCount: collection.items?.length || 0,
      });

      // Return plain text response
      return apiResponse.raw(llmsTxt, {
        contentType: 'text/plain; charset=utf-8',
        headers: { 'X-Robots-Tag': 'index, follow' },
        cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
      });
    }

    // Default handling for all other categories
    // Build rich content from ALL structured fields (features, installation, config, etc.)
    const richContent = buildRichContent(fullItem as ContentItem);

    // Transform to LLMsTxtItem format with rich content
    const llmsItem: LLMsTxtItem = {
      slug: fullItem.slug,
      title: fullItem.title || fullItem.name || fullItem.slug,
      description: fullItem.description,
      category: fullItem.category,
      tags: fullItem.tags || [],
      author: fullItem.author,
      dateAdded: fullItem.dateAdded,
      url: `${APP_CONFIG.url}/${category}/${slug}`,
      // Include FULL rich content from all fields
      content: richContent,
    };

    // Generate llms.txt content with full details
    const llmsTxt = await generateLLMsTxt(llmsItem, {
      includeMetadata: true,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
      includeContent: true, // Full content for detail pages
      sanitize: true, // Apply PII protection
    });

    logger.info('Item llms.txt generated successfully', {
      category,
      slug,
      contentLength: llmsTxt.length,
      hasFullContent: !!fullItem.content,
    });

    // Return plain text response
    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      headers: { 'X-Robots-Tag': 'index, follow' },
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error: unknown) {
    const { category, slug } = await context.params.catch(() => ({
      category: 'unknown',
      slug: 'unknown',
    }));

    logger.error(
      'Failed to generate item llms.txt',
      error instanceof Error ? error : new Error(String(error)),
      { category, slug }
    );

    // Use centralized error handling
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Failed to generate llms.txt' },
      {
        route: '/[category]/[slug]/llms.txt',
        operation: 'generate_item_llmstxt',
        method: 'GET',
        logContext: { category, slug },
      }
    );
  }
}
