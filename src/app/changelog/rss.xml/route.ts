/**
 * Changelog RSS 2.0 Feed Route Handler
 *
 * Generates RSS 2.0 feed for changelog entries.
 * Follows RSS 2.0 specification for maximum compatibility.
 *
 * @route GET /changelog/rss.xml
 * @see {@link https://www.rssboard.org/rss-specification} - RSS 2.0 Specification
 *
 * Architecture:
 * - RSS 2.0 standard format
 * - Last 50 entries (configurable)
 * - Full content in CDATA for HTML support
 * - Proper pubDate formatting (RFC 822)
 * - ISR with 10-minute revalidation
 *
 * Performance:
 * - ISR: 600s (10 minutes)
 * - Redis-cached entry loading
 * - CDATA wrapping for HTML content
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper XML escaping
 * - Error handling with fallback
 * - Logging for debugging
 */

import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { formatChangelogDateRFC822, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';
import { apiResponse } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

/**
 * Maximum number of entries to include in RSS feed
 */
const MAX_FEED_ENTRIES = 50;

/**
 * Escape XML special characters for safe RSS output
 *
 * @param text - Text to escape
 * @returns XML-safe text
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate RSS 2.0 feed for changelog entries
 *
 * @param request - Next.js request object
 * @returns RSS XML response
 */
export async function GET(request: NextRequest): Promise<Response> {
  'use cache';
  cacheLife('stable'); // 6 hour cache (replaces revalidate: 21600)

  // Access uncached data before new Date() (Cache Components requirement)
  (await headers()).get('x-cache-marker');

  const requestLogger = logger.forRequest(request);

  try {
    requestLogger.info('RSS feed generation started');

    // Load changelog entries (cached with Redis)
    const allEntries = await getAllChangelogEntries();

    // Limit to last 50 entries
    const entries = allEntries.slice(0, MAX_FEED_ENTRIES);

    // Build RSS 2.0 XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(APP_CONFIG.name)} Changelog</title>
    <link>${APP_CONFIG.url}/changelog</link>
    <description>Track all updates, new features, bug fixes, and improvements to ${escapeXml(APP_CONFIG.name)}.</description>
    <language>en-us</language>
    <lastBuildDate>${formatChangelogDateRFC822(entries[0]?.date || new Date().toISOString().split('T')[0] || '')}</lastBuildDate>
    <atom:link href="${APP_CONFIG.url}/changelog/rss.xml" rel="self" type="application/rss+xml" />
    <generator>${APP_CONFIG.name} Changelog Generator</generator>
    <webMaster>${escapeXml('contact@claudepro.directory')} (${escapeXml(APP_CONFIG.author)})</webMaster>
    <ttl>600</ttl>
${entries
  .map((entry) => {
    const entryUrl = getChangelogUrl(entry.slug);
    const description = entry.tldr || entry.content.slice(0, 300);

    // Build category list for description
    const categories = [];
    if (entry.categories.Added.length > 0) categories.push('Added');
    if (entry.categories.Changed.length > 0) categories.push('Changed');
    if (entry.categories.Fixed.length > 0) categories.push('Fixed');
    if (entry.categories.Removed.length > 0) categories.push('Removed');
    if (entry.categories.Deprecated.length > 0) categories.push('Deprecated');
    if (entry.categories.Security.length > 0) categories.push('Security');

    return `    <item>
      <title>${escapeXml(entry.title)}</title>
      <link>${escapeXml(entryUrl)}</link>
      <guid isPermaLink="true">${escapeXml(entryUrl)}</guid>
      <pubDate>${formatChangelogDateRFC822(entry.date)}</pubDate>
      <description><![CDATA[${description}]]></description>
      <content:encoded xmlns:content="http://purl.org/rss/1.0/modules/content/"><![CDATA[
${entry.content}
      ]]></content:encoded>
${categories.map((cat) => `      <category>${escapeXml(cat)}</category>`).join('\n')}
      <author>${escapeXml('contact@claudepro.directory')} (${escapeXml(APP_CONFIG.author)})</author>
    </item>`;
  })
  .join('\n')}
  </channel>
</rss>`;

    requestLogger.info('RSS feed generated successfully', {
      entriesCount: entries.length,
    });

    // Return RSS XML via unified builder
    return apiResponse.raw(rss, {
      contentType: 'application/rss+xml; charset=utf-8',
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error) {
    requestLogger.error(
      'RSS feed generation failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return minimal error feed
    const errorRss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(APP_CONFIG.name)} Changelog</title>
    <link>${APP_CONFIG.url}/changelog</link>
    <description>Error generating changelog feed. Please try again later.</description>
  </channel>
</rss>`;

    return apiResponse.raw(errorRss, {
      contentType: 'application/rss+xml; charset=utf-8',
      status: 500,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }
}
