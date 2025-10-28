/**
 * Changelog Atom 1.0 Feed Route Handler
 *
 * Generates Atom 1.0 feed for changelog entries.
 * Atom is preferred over RSS by many AI crawlers (better structured).
 *
 * @route GET /changelog/atom.xml
 * @see {@link https://validator.w3.org/feed/docs/atom.html} - Atom 1.0 Specification
 *
 * Architecture:
 * - Atom 1.0 standard format
 * - Last 50 entries (configurable)
 * - Full content in <content> element
 * - ISO 8601 timestamps
 * - ISR with 10-minute revalidation
 *
 * Performance:
 * - ISR: 600s (10 minutes)
 * - Database-cached entry loading
 * - Optimized for AI crawler parsing
 *
 * Production Standards:
 * - Type-safe with Next.js 15.5.4
 * - Proper XML escaping
 * - Error handling with fallback
 * - AI-optimized structure
 */

import type { NextRequest } from 'next/server';
import { getAllChangelogEntries } from '@/src/lib/changelog/loader';
import { formatChangelogDateISO8601, getChangelogUrl } from '@/src/lib/changelog/utils';
import { APP_CONFIG } from '@/src/lib/constants';
import { apiResponse } from '@/src/lib/error-handler';
import { logger } from '@/src/lib/logger';

/**
 * Maximum number of entries to include in Atom feed
 */
const MAX_FEED_ENTRIES = 50;

/**
 * Escape XML special characters for safe Atom output
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
 * Generate Atom 1.0 feed for changelog entries
 *
 * @param request - Next.js request object
 * @returns Atom XML response
 */
export async function GET(_request: NextRequest): Promise<Response> {
  try {
    logger.info('Atom feed generation started');

    // Load changelog entries (database-cached)
    const allEntries = await getAllChangelogEntries();

    // Limit to last 50 entries
    const entries = allEntries.slice(0, MAX_FEED_ENTRIES);

    // Get latest update date for feed-level <updated> tag
    const latestDate = entries[0]?.date || new Date().toISOString().split('T')[0] || '';

    // Build Atom 1.0 XML
    const atom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(APP_CONFIG.name)} Changelog</title>
  <subtitle>Track all updates, new features, bug fixes, and improvements to ${escapeXml(APP_CONFIG.name)}.</subtitle>
  <link href="${APP_CONFIG.url}/changelog" rel="alternate" type="text/html" />
  <link href="${APP_CONFIG.url}/changelog/atom.xml" rel="self" type="application/atom+xml" />
  <id>${APP_CONFIG.url}/changelog</id>
  <updated>${formatChangelogDateISO8601(latestDate)}</updated>
  <author>
    <name>${escapeXml(APP_CONFIG.author)}</name>
    <email>contact@claudepro.directory</email>
    <uri>${APP_CONFIG.url}</uri>
  </author>
  <generator uri="${APP_CONFIG.url}" version="1.0.0">${escapeXml(APP_CONFIG.name)} Changelog Generator</generator>
  <rights>© ${new Date().getFullYear()} ${escapeXml(APP_CONFIG.author)}. ${APP_CONFIG.license} License.</rights>
${entries
  .map((entry) => {
    const entryUrl = getChangelogUrl(entry.slug);
    const summary = entry.tldr || entry.content.slice(0, 300);

    // Build category list
    const categories = [];
    if (entry.categories.Added.length > 0) categories.push('Added');
    if (entry.categories.Changed.length > 0) categories.push('Changed');
    if (entry.categories.Fixed.length > 0) categories.push('Fixed');
    if (entry.categories.Removed.length > 0) categories.push('Removed');
    if (entry.categories.Deprecated.length > 0) categories.push('Deprecated');
    if (entry.categories.Security.length > 0) categories.push('Security');

    return `  <entry>
    <title>${escapeXml(entry.title)}</title>
    <link href="${escapeXml(entryUrl)}" rel="alternate" type="text/html" />
    <id>${escapeXml(entryUrl)}</id>
    <published>${formatChangelogDateISO8601(entry.date)}</published>
    <updated>${formatChangelogDateISO8601(entry.date)}</updated>
    <author>
      <name>${escapeXml(APP_CONFIG.author)}</name>
      <email>contact@claudepro.directory</email>
    </author>
    <summary type="text">${escapeXml(summary)}</summary>
    <content type="html"><![CDATA[
${entry.content}
    ]]></content>
${categories.map((cat) => `    <category term="${escapeXml(cat)}" label="${escapeXml(cat)}" />`).join('\n')}
  </entry>`;
  })
  .join('\n')}
</feed>`;

    logger.info('Atom feed generated successfully', {
      entriesCount: entries.length,
    });

    // Return Atom XML via unified builder
    return apiResponse.raw(atom, {
      contentType: 'application/atom+xml; charset=utf-8',
      cache: { sMaxAge: 600, staleWhileRevalidate: 3600 },
    });
  } catch (error) {
    logger.error(
      'Atom feed generation failed',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return minimal error feed
    const errorAtom = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(APP_CONFIG.name)} Changelog</title>
  <link href="${APP_CONFIG.url}/changelog" rel="alternate" type="text/html" />
  <id>${APP_CONFIG.url}/changelog</id>
  <updated>${new Date().toISOString()}</updated>
  <subtitle>Error generating changelog feed. Please try again later.</subtitle>
</feed>`;

    return apiResponse.raw(errorAtom, {
      contentType: 'application/atom+xml; charset=utf-8',
      status: 500,
      cache: { sMaxAge: 0, staleWhileRevalidate: 0 },
    });
  }
}
