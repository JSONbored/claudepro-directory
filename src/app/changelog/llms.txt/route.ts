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
 * - Database-cached entry loading
 * - Optimized for Claude, ChatGPT, Perplexity citation
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper error handling
 * - Logging for debugging
 * - AI-optimized structure
 */

import { NextResponse } from 'next/server';
import { getAllChangelogEntries, parseChangelogChanges } from '@/src/lib/changelog/loader';
import { formatChangelogDate, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';
import { handleApiError } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

/**
 * Generate llms.txt for changelog index
 *
 * @param request - Next.js request object
 * @returns Plain text response with all changelog entries
 */
export async function GET(): Promise<Response> {
  try {
    logger.info('Changelog llms.txt generation started');

    // Load all changelog entries (database-cached)
    const entries = await getAllChangelogEntries();

    // Build plain text content following llmstxt.org spec
    let llmsTxt = `# ${APP_CONFIG.name} - Changelog

> Track all platform updates, new features, bug fixes, and improvements

URL: ${APP_CONFIG.url}/changelog
Total Updates: ${entries.length}
Latest Update: ${entries[0]?.release_date ? formatChangelogDate(entries[0].release_date) : 'N/A'}

---

## All Changelog Entries

`;

    // Add each entry in chronological order (newest first)
    for (const entry of entries) {
      const entryUrl = getChangelogUrl(entry.slug);

      // Parse changes JSONB field with type safety
      const changes = parseChangelogChanges(entry.changes);

      // Count items per category
      const categoryStats = [];
      if (changes.Added && changes.Added.length > 0) {
        categoryStats.push(`${changes.Added.length} Added`);
      }
      if (changes.Changed && changes.Changed.length > 0) {
        categoryStats.push(`${changes.Changed.length} Changed`);
      }
      if (changes.Fixed && changes.Fixed.length > 0) {
        categoryStats.push(`${changes.Fixed.length} Fixed`);
      }
      if (changes.Removed && changes.Removed.length > 0) {
        categoryStats.push(`${changes.Removed.length} Removed`);
      }
      if (changes.Deprecated && changes.Deprecated.length > 0) {
        categoryStats.push(`${changes.Deprecated.length} Deprecated`);
      }
      if (changes.Security && changes.Security.length > 0) {
        categoryStats.push(`${changes.Security.length} Security`);
      }

      llmsTxt += `### ${formatChangelogDate(entry.release_date)} - ${entry.title}

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

    logger.info('Changelog llms.txt generated successfully', {
      entriesCount: entries.length,
      size: Buffer.byteLength(llmsTxt, 'utf8'),
    });

    // Return plain text with cache headers
    return new NextResponse(llmsTxt, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (error: unknown) {
    return handleApiError(error, {
      route: '/changelog/llms.txt',
      operation: 'generate_changelog_llmstxt',
      method: 'GET',
    });
  }
}
