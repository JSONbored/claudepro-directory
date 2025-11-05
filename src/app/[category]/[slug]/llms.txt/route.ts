/**
 * LLMs.txt Route - Generates AI-optimized plain text for individual content items.
 */

import { NextResponse } from 'next/server';
import {
  type CategoryId,
  isValidCategory,
  VALID_CATEGORIES,
} from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import {
  getContentByCategory,
  getContentBySlug,
  getFullContentBySlug,
} from '@/src/lib/content/supabase-content-loader';
import { handleApiError } from '@/src/lib/error-handler';
import { buildRichContent } from '@/src/lib/llms-txt/content-builder';
import { generateLLMsTxt, type LLMsTxtItem } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import type { Database } from '@/src/types/database.types';

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

export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string; slug: string }> }
): Promise<Response> {
  try {
    const { category, slug } = await context.params;

    logger.info('Item llms.txt generation started', { category, slug });

    if (!isValidCategory(category)) {
      logger.warn('Invalid category requested for item llms.txt', {
        category,
        slug,
      });

      return new NextResponse('Category not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }

    const item = await getContentBySlug(category, slug);

    if (!item) {
      logger.warn('Item not found for llms.txt', { category, slug });

      return new NextResponse('Content not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }

    const fullItem = await getFullContentBySlug(category, slug);

    if (!fullItem) {
      logger.warn('Full item content not found for llms.txt', {
        category,
        slug,
      });

      return new NextResponse('Content not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      });
    }

    // Collections require special handling with embedded items
    if (category === 'collections') {
      const collection = fullItem as Database['public']['Tables']['content']['Row'] & {
        category: 'collections';
      };
      const metadata = (collection.metadata as Record<string, unknown>) || {};
      const items = metadata.items as
        | Array<{ category: string; slug: string; reason?: string }>
        | undefined;

      // Build detailed content including all embedded items (NO TRUNCATION)
      let detailedContent = '';

      if (items && items.length > 0) {
        detailedContent += 'INCLUDED ITEMS\n--------------\n\n';

        // Group items by category - items is Json[] from database
        const itemsByCategory: Record<string, typeof items> = {};
        for (const item of items) {
          const itemCategory = (item as { category?: string }).category || 'other';
          if (!itemsByCategory[itemCategory]) {
            itemsByCategory[itemCategory] = [];
          }
          itemsByCategory[itemCategory].push(item);
        }

        // Fetch actual item details and build full content (NO TRUNCATION)
        for (const [itemCategory, items] of Object.entries(itemsByCategory)) {
          detailedContent += `${itemCategory.toUpperCase()}:\n`;
          for (const itemRef of items) {
            const refData = itemRef as { category: string; slug: string; reason?: string };

            // Fetch the actual item to get title and description
            try {
              const actualItem = await getContentBySlug(
                refData.category as CategoryId,
                refData.slug
              );
              if (actualItem) {
                detailedContent += `• ${actualItem.title || refData.slug}\n`;
                // Include FULL description - no truncation for AI consumption
                if (actualItem.description) {
                  detailedContent += `  ${actualItem.description}\n`;
                }
                if (refData.reason) {
                  detailedContent += `  Reason: ${refData.reason}\n`;
                }
              } else {
                // Fallback if item not found
                detailedContent += `• ${refData.slug}\n`;
                if (refData.reason) {
                  detailedContent += `  ${refData.reason}\n`;
                }
              }
            } catch (error) {
              // If item fetch fails, use fallback
              logger.warn('Failed to fetch collection item details', {
                category: refData.category,
                slug: refData.slug,
                error: error instanceof Error ? error.message : String(error),
              });
              detailedContent += `• ${refData.slug}\n`;
              if (refData.reason) {
                detailedContent += `  ${refData.reason}\n`;
              }
            }
          }
          detailedContent += '\n';
        }
      }

      // Add metadata sections (safely handle optional properties)
      const prerequisites = metadata.prerequisites as string[] | undefined;
      if (prerequisites && prerequisites.length > 0) {
        detailedContent += '\nPREREQUISITES\n-------------\n';
        detailedContent += prerequisites.map((p: string) => `• ${p}`).join('\n');
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
        date_added: collection.date_added || undefined,
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
        itemsCount: items?.length || 0,
      });

      // Return plain text response
      return new NextResponse(llmsTxt, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'index, follow',
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
        },
      });
    }

    // Default handling for all other categories
    // Build rich content from ALL structured fields (features, installation, config, etc.)
    const richContent = buildRichContent(fullItem);

    const llmsItem: LLMsTxtItem = {
      slug: fullItem.slug,
      title: ('title' in fullItem ? fullItem.title : null) || fullItem.slug,
      description: fullItem.description,
      category: fullItem.category,
      tags: (fullItem.tags as string[]) ?? [],
      author: 'author' in fullItem && fullItem.author ? fullItem.author : undefined,
      date_added: 'date_added' in fullItem && fullItem.date_added ? fullItem.date_added : undefined,
      url: `${APP_CONFIG.url}/${category}/${slug}`,
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
    });

    // Return plain text response
    return new NextResponse(llmsTxt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Robots-Tag': 'index, follow',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
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

    return handleApiError(error, {
      route: '/[category]/[slug]/llms.txt',
      operation: 'generate_item_llmstxt',
      method: 'GET',
      logContext: { category, slug },
    });
  }
}
