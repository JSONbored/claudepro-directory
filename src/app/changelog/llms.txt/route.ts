/**
 * Changelog LLMs.txt Route Handler
 *
 * Generates AI-optimized plain text index for all changelog entries.
 * Follows llmstxt.org specification for LLM consumption.
 *
 * @route GET /changelog/llms.txt
 * @see {@link https://llmstxt.org} - LLMs.txt specification
 *
 * Architecture:
 * - Plain text format for AI parsability
 * - Chronological listing (newest first)
 * - Full entry metadata included
 * - Category information preserved
 * - ISR with 10-minute revalidation
 *
 * Performance:
 * - ISR: 600s (10 minutes)
 * - Redis-cached entry loading
 * - Optimized for Claude, ChatGPT, Perplexity citation
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling
 * - Logging for debugging
 * - AI-optimized structure
 */

import type { NextRequest } from 'next/server';
import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { formatChangelogDate, getChangelogUrl } from '@/src/lib/changelog/utils';
import { REVALIDATE_CHANGELOG } from '@/src/lib/config/rate-limits.config';
import { APP_CONFIG } from '@/src/lib/constants';
import { apiResponse } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

/**
 * Runtime configuration
 */
export const runtime = 'nodejs';

/**
 * ISR revalidation
 * Changelog updates frequently - revalidate every 15 minutes
 */
export const revalidate = REVALIDATE_CHANGELOG;

/**
 * Generate llms.txt for changelog index
 *
 * @param request - Next.js request object
 * @returns Plain text response with all changelog entries
 */
export async function GET(request: NextRequest): Promise<Response> {
  const requestLogger = logger.forRequest(request);

  try {
    requestLogger.info('Changelog llms.txt generation started');

    // Load all changelog entries (cached with Redis)
    const entries = await getAllChangelogEntries();

    // Build plain text content following llmstxt.org spec
    let llmsTxt = `# ${APP_CONFIG.name} - Changelog

> Track all platform updates, new features, bug fixes, and improvements

URL: ${APP_CONFIG.url}/changelog
Total Updates: ${entries.length}
Latest Update: ${entries[0]?.date ? formatChangelogDate(entries[0].date) : 'N/A'}

---

## All Changelog Entries

`;

    // Add each entry in chronological order (newest first)
    for (const entry of entries) {
      const entryUrl = getChangelogUrl(entry.slug);

      // Count items per category
      const categoryStats = [];
      if (entry.categories.Added.length > 0) {
        categoryStats.push(`${entry.categories.Added.length} Added`);
      }
      if (entry.categories.Changed.length > 0) {
        categoryStats.push(`${entry.categories.Changed.length} Changed`);
      }
      if (entry.categories.Fixed.length > 0) {
        categoryStats.push(`${entry.categories.Fixed.length} Fixed`);
      }
      if (entry.categories.Removed.length > 0) {
        categoryStats.push(`${entry.categories.Removed.length} Removed`);
      }
      if (entry.categories.Deprecated.length > 0) {
        categoryStats.push(`${entry.categories.Deprecated.length} Deprecated`);
      }
      if (entry.categories.Security.length > 0) {
        categoryStats.push(`${entry.categories.Security.length} Security`);
      }

      llmsTxt += `### ${formatChangelogDate(entry.date)} - ${entry.title}

URL: ${entryUrl}
Categories: ${categoryStats.join(', ') || 'None'}
${entry.tldr ? `\nSummary: ${entry.tldr}` : ''}

${entry.content}

---

`;
    }

    // Add footer with links
    llmsTxt += `
## Additional Resources

- RSS Feed: ${APP_CONFIG.url}/changelog/rss.xml
- Atom Feed: ${APP_CONFIG.url}/changelog/atom.xml
- Full Website: ${APP_CONFIG.url}/changelog

---

This changelog follows the Keep a Changelog specification.
Last generated: ${new Date().toISOString()}
`;

    requestLogger.info('Changelog llms.txt generated successfully', {
      entriesCount: entries.length,
      size: Buffer.byteLength(llmsTxt, 'utf8'),
    });

    // Return plain text via unified builder
    return apiResponse.raw(llmsTxt, {
      contentType: 'text/plain; charset=utf-8',
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error) {
    requestLogger.error(
      'Changelog llms.txt generation failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return minimal error response
    const errorText = `# ${APP_CONFIG.name} - Changelog

Error generating changelog content. Please try again later.

URL: ${APP_CONFIG.url}/changelog
`;

    return apiResponse.raw(errorText, {
      contentType: 'text/plain; charset=utf-8',
      status: 500,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }
}
