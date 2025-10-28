/**
 * Dynamic Sitemap Generation (Next.js App Router)
 *
 * SEO-Critical Production Implementation:
 * - Dynamically generates sitemap from Supabase content
 * - Auto-updates when new content is synced to database
 * - Replaces static public/sitemap.xml (which becomes stale)
 * - Uses centralized URL generator for consistency
 *
 * Performance:
 * - Generated at build time (SSG)
 * - Cached with ISR (revalidate: 3600 = 1 hour)
 * - 425+ URLs generated from live Supabase content
 * - Content fetched via getAllContent() with ISR caching
 *
 * Migration: Replaced /generated/* metadata imports with Supabase queries
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from 'next';
import { generateAllSiteUrls } from '@/src/lib/build/url-generator.server';
import { APP_CONFIG } from '@/src/lib/constants';

/**
 * Generate dynamic sitemap from content metadata
 *
 * Next.js will automatically:
 * - Generate sitemap.xml at /sitemap.xml
 * - Set correct Content-Type: application/xml
 * - Handle caching with ISR revalidation
 *
 * @returns Sitemap entries with URLs, lastModified, changeFrequency, priority
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = APP_CONFIG.url;

  // Generate all site URLs using centralized URL generator
  // Content is fetched directly from Supabase via getAllContent()
  const sitemapUrls = await generateAllSiteUrls({
    baseUrl,
    includeGuides: true,
    includeChangelog: true,
    includeLlmsTxt: true,
  });

  // Convert to Next.js MetadataRoute.Sitemap format
  return sitemapUrls.map((url) => ({
    url: url.loc,
    lastModified: url.lastmod,
    changeFrequency: url.changefreq,
    priority: url.priority,
  }));
}
