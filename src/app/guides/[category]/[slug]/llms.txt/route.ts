/**
 * Guides LLMs.txt Route Handler
 * Generates AI-optimized plain text for guide content
 *
 * @route GET /guides/[category]/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import fs from 'fs/promises';
import type { NextRequest } from 'next/server';
import path from 'path';
import { z } from 'zod';
import { contentCache } from '@/src/lib/cache.server';
import { APP_CONFIG } from '@/src/lib/constants';
import { apiResponse, handleApiError } from '@/src/lib/error-handler';
import { generateLLMsTxt, type LLMsTxtItem } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';

/**
 * Runtime configuration
 */
export const runtime = 'nodejs';

// Static generation - will be replaced with pre-generated static file

export const dynamicParams = true;

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
  request: NextRequest,
  { params }: { params: Promise<{ category: string; slug: string }> }
): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    const rawParams = await params;
    const { category, slug } = guideParamsSchema.parse(rawParams);

    requestLogger.info('Guide llms.txt generation started', {
      category,
      slug,
    });

    // Validate category
    if (!(category in PATH_MAP)) {
      requestLogger.warn('Invalid guide category for llms.txt', { category });

      return apiResponse.raw('Guide category not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    const cacheKey = `guide-llmstxt:v2:${category}:${slug}`; // v2: added Title field to metadata

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
        requestLogger.info('Serving cached guide llms.txt', {
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
      requestLogger.error(
        'Invalid category path mapping',
        new Error('Category not found in PATH_MAP'),
        { category }
      );
      return apiResponse.raw('Internal server error', {
        contentType: 'text/plain; charset=utf-8',
        status: 500,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Load JSON guide file
    const jsonPath = path.join(process.cwd(), 'content', 'guides', mappedPath, `${slug}.json`);

    let frontmatter: any;
    let content: string;

    try {
      const jsonContent = await fs.readFile(jsonPath, 'utf-8');
      const json = JSON.parse(jsonContent);
      frontmatter = json.metadata;
      content = JSON.stringify(json.content.sections, null, 2);
    } catch {
      requestLogger.warn('Guide file not found for llms.txt', {
        category,
        slug,
      });

      return apiResponse.raw('Guide not found', {
        contentType: 'text/plain; charset=utf-8',
        status: 404,
        cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
      });
    }

    // Transform to LLMsTxtItem format (with proper type handling)
    const llmsItem: LLMsTxtItem = {
      slug,
      title: (frontmatter.title as string | undefined) || slug,
      description: (frontmatter.description as string | undefined) || '',
      category: 'guides',
      tags: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      author: (frontmatter.author as string | undefined) || APP_CONFIG.author,
      dateAdded: (frontmatter.dateUpdated as string | undefined) || new Date().toISOString(),
      url: `${APP_CONFIG.url}/guides/${category}/${slug}`,
      content, // Full MDX content
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

    requestLogger.info('Guide llms.txt generated successfully', {
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
    const rawParams = await params.catch(() => ({
      category: 'unknown',
      slug: 'unknown',
    }));

    requestLogger.error(
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
