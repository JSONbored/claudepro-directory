/**
 * Guides LLMs.txt Route Handler
 * Generates AI-optimized plain text for guide content
 *
 * @route GET /guides/[category]/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 */

import fs from 'fs/promises';
import { type NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { z } from 'zod';
import { APP_CONFIG } from '@/src/lib/constants';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { handleApiError } from '@/src/lib/error-handler';
import { generateLLMsTxt, type LLMsTxtItem } from '@/src/lib/llms-txt/generator';
import { logger } from '@/src/lib/logger';
import { contentCache } from '@/src/lib/redis';
import { errorInputSchema } from '@/src/lib/schemas/error.schema';

/**
 * Runtime configuration
 */
export const runtime = 'nodejs';

/**
 * ISR revalidation
 * Revalidate every 10 minutes (600 seconds)
 */
export const revalidate = 600;

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

      return new NextResponse('Guide category not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    const filename = `${slug}.mdx`;
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

        return new NextResponse(cachedContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
            'X-Content-Type-Options': 'nosniff',
            'X-Robots-Tag': 'index, follow',
            'X-Cache': 'HIT',
          },
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
      return new NextResponse('Internal server error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }
    const filePath = path.join(process.cwd(), 'content', 'guides', mappedPath, filename);

    let fileContent: string;
    try {
      fileContent = await fs.readFile(filePath, 'utf-8');
    } catch {
      requestLogger.warn('Guide file not found for llms.txt', {
        category,
        filename,
      });

      return new NextResponse('Guide not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    // Parse MDX frontmatter
    const { frontmatter, content } = parseMDXFrontmatter(fileContent);

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
    return new NextResponse(llmsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'index, follow',
        'X-Cache': 'MISS',
      },
    });
  } catch (error: unknown) {
    const rawParams = await params.catch(() => ({ category: 'unknown', slug: 'unknown' }));

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
