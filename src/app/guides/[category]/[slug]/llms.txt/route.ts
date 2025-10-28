/**
 * Guides LLMs.txt Route Handler
 * Generates AI-optimized plain text for guide content
 *
 * @route GET /guides/[category]/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import { contentCache } from '@/src/lib/cache.server';
import { APP_CONFIG } from '@/src/lib/constants';
// MDX support removed - 100% JSON guides now
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { generateLLMsTxt, type LLMsTxtItem } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';

/**
 * Validation schema for guide parameters
 */
const guideParamsSchema = z.object({
  category: z.string().min(1).max(100),
  slug: z.string().min(1).max(200),
});

/**
 * Path mapping for guide categories
 */
const PATH_MAP: Record<string, string> = {
  'use-cases': 'use-cases',
  tutorials: 'tutorials',
  collections: 'collections',
  categories: 'categories',
  workflows: 'workflows',
  comparisons: 'comparisons',
  troubleshooting: 'troubleshooting',
};

/**
 * Handle GET request for guide llms.txt
 *
 * @param request - Next.js request object
 * @param context - Route context with category and slug params
 * @returns Plain text response with guide content
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ category: string; slug: string }> }
): Promise<Response> {
  // Note: Cannot use logger.forRequest() in cached routes (Request object not accessible)

  try {
    const rawParams = await context.params;
    const { category, slug } = guideParamsSchema.parse(rawParams);

    logger.info('Guide llms.txt generation started', {
      category,
      slug,
    });

    // Validate category
    if (!(category in PATH_MAP)) {
      logger.warn('Invalid guide category for llms.txt', { category });

      return apiResponse.raw('Guide category not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    const filename = `${slug}.json`;
    const cacheKey = `guide-llmstxt:v3:${category}:${slug}`; // v3: JSON guides (no MDX)

    // Try cache first using cacheWithRefresh
    try {
      const cachedContent = await contentCache.cacheWithRefresh<string>(
        cacheKey,
        async () => {
          // This will be executed if cache miss - we'll generate content below
          return null as unknown as string;
        },
        600 // 10 minutes
      );

      if (cachedContent) {
        logger.info('Serving cached guide llms.txt', {
          category,
          slug,
        });

        return apiResponse.raw(cachedContent, {
          contentType: 'text/plain; charset=utf-8',
          headers: { 'X-Robots-Tag': 'index, follow', 'X-Cache': 'HIT' },
          cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
        });
      }
    } catch {
      // Cache miss or error - continue to generate content
    }

    // Load guide content
    const mappedPath = PATH_MAP[category];
    if (!mappedPath) {
      logger.error('Invalid category path mapping', new Error('Category not found in PATH_MAP'), {
        category,
      });
      return apiResponse.raw('Internal server error', {
        contentType: 'text/plain; charset=utf-8',
        status: 500,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }
    const filePath = path.join(process.cwd(), 'content', 'guides', mappedPath, filename);

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch {
      logger.warn('Guide file not found for llms.txt', {
        category,
        filename,
      });

      return apiResponse.raw('Guide not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Parse JSON guide
    const jsonData = JSON.parse(fileContent);

    // Convert sections to plain text content for LLMs
    const sectionsText = jsonData.sections
      ? (
          jsonData.sections as Array<{
            type: string;
            content?: string;
            language?: string;
            code?: string;
          }>
        )
          .map((section) => {
            if (section.type === 'text' || section.type === 'heading') {
              return section.content;
            }
            if (section.type === 'code') {
              return `\`\`\`${section.language}\n${section.code}\n\`\`\``;
            }
            return '';
          })
          .filter(Boolean)
          .join('\n\n')
      : '';

    // Transform to LLMsTxtItem format
    const llmsItem: LLMsTxtItem = {
      slug,
      title: jsonData.title || slug,
      description: jsonData.description || '',
      category: 'guides',
      tags: Array.isArray(jsonData.keywords) ? jsonData.keywords : [],
      author: jsonData.author || APP_CONFIG.author,
      date_added: jsonData.dateUpdated || new Date().toISOString(),
      url: `${APP_CONFIG.url}/guides/${category}/${slug}`,
      content: sectionsText, // Converted sections to plain text
    };

    // Generate llms.txt content
    const llmsTxt = await generateLLMsTxt(llmsItem, {
      includeMetadata: true,
      includeDescription: true,
      includeTags: true,
      includeUrl: true,
      includeContent: true, // Full content for guides
      sanitize: true,
    });

    // Cache the result using cacheWithRefresh (no direct set method available)
    await contentCache.cacheWithRefresh(
      cacheKey,
      async () => llmsTxt,
      600 // 10 minutes
    );

    logger.info('Guide llms.txt generated successfully', {
      category,
      slug,
      contentLength: llmsTxt.length,
    });

    // Return plain text response
    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      headers: { 'X-Robots-Tag': 'index, follow', 'X-Cache': 'MISS' },
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error: unknown) {
    const rawParams = await context.params.catch(() => ({
      category: 'unknown',
      slug: 'unknown',
    }));

    logger.error(
      'Failed to generate guide llms.txt',
      error instanceof Error ? error : new Error(String(error)),
      { category: rawParams.category, slug: rawParams.slug }
    );

    // Use centralized error handling
    const validatedError = errorInputSchema.safeParse(error);
    return handleApiError(
      validatedError.success ? validatedError.data : { message: 'Failed to generate llms.txt' },
      {
        route: '/guides/[category]/[slug]/llms.txt',
        operation: 'generate_guide_llmstxt',
        method: 'GET',
        logContext: { category: rawParams.category, slug: rawParams.slug },
      }
    );
  }
}
