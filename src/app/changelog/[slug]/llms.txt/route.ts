/**
 * Changelog Entry LLMs.txt Route Handler
 *
 * Generates AI-optimized plain text for individual changelog entries.
 * Follows llmstxt.org specification for LLM consumption.
 *
 * @route GET /changelog/[slug]/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 *
 * Architecture:
 * - Plain text format for AI parsability
 * - Full entry content with metadata
 * - Category breakdown included
 * - ISO 8601 dates
 * - ISR with 10-minute revalidation
 *
 * Performance:
 * - ISR: 600s (10 minutes)
 * - Redis-cached entry loading
 * - Static params generation
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling
 * - Logging for debugging
 * - AI citation optimized
 */

import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getAllChangelogEntries, getChangelogEntryBySlug } from '@/src/lib/changelog/loader';
import { formatChangelogDate, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';

/**
 * Generate static params for all changelog entries
 *
 * @returns Array of slug params for static generation
 */
export async function generateStaticParams() {
  try {
    const entries = await getAllChangelogEntries();

    return entries.map((entry) => ({
      slug: entry.slug,
    }));
  } catch (error) {
    logger.error(
      'Failed to generate static params for changelog llms.txt',
      error instanceof Error ? error : new Error(String(error))
    );
    return [];
  }
}

/**
 * Handle GET request for changelog entry llms.txt
 *
 * @param request - Next.js request object
 * @param context - Route context with slug param
 * @returns Plain text response with full entry content
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ slug: string }> }
): Promise<Response> {
  'use cache';
  cacheLife('quarter'); // 15 min cache (replaces revalidate: 900)

  // Note: Cannot use logger.forRequest() in cached routes (Request object not accessible)
  // Access uncached data before new Date() (Cache Components requirement)
  (await headers()).get('x-cache-marker');

  try {
    const { slug } = await context.params;

    logger.info('Changelog entry llms.txt generation started', { slug });

    // Load changelog entry
    const entry = await getChangelogEntryBySlug(slug);

    if (!entry) {
      logger.warn('Changelog entry not found for llms.txt', { slug });

      return new NextResponse('Changelog entry not found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
        },
      });
    }

    const entryUrl = getChangelogUrl(entry.slug);

    // Build plain text content following llmstxt.org spec
    let llmsTxt = `# ${entry.title}

> ${APP_CONFIG.name} Changelog Entry

URL: ${entryUrl}
Date: ${formatChangelogDate(entry.date)}
Slug: ${entry.slug}
${entry.tldr ? `\nSummary: ${entry.tldr}` : ''}

---

`;

    // Add category sections with items
    const categoryOrder = [
      'Added',
      'Changed',
      'Fixed',
      'Removed',
      'Deprecated',
      'Security',
    ] as const;

    for (const categoryName of categoryOrder) {
      const items = entry.categories[categoryName];
      if (items.length > 0) {
        llmsTxt += `## ${categoryName}\n\n`;
        for (const item of items) {
          llmsTxt += `- ${item.content}\n`;
        }
        llmsTxt += '\n';
      }
    }

    // Add full content section
    llmsTxt += `## Full Content

${entry.content}

---

## Metadata

- **Platform:** ${APP_CONFIG.name}
- **Date:** ${entry.date}
- **Permanent URL:** ${entryUrl}
- **Format:** Keep a Changelog 1.0.0
- **License:** ${APP_CONFIG.license}
- **Last Generated:** ${new Date().toISOString()}

---

For more updates, visit: ${APP_CONFIG.url}/changelog
`;

    logger.info('Changelog entry llms.txt generated successfully', {
      slug: entry.slug,
      size: Buffer.byteLength(llmsTxt, 'utf8'),
    });

    // Return plain text with proper headers
    return new NextResponse(llmsTxt, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logger.error(
      'Changelog entry llms.txt generation failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return minimal error response
    const errorText = `# Changelog Entry

Error generating changelog entry content. Please try again later.

URL: ${APP_CONFIG.url}/changelog
`;

    return new NextResponse(errorText, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  }
}
