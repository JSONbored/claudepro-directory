/**
 * Dynamic Sitemap Generation (Next.js App Router)
 *
 * SEO-Critical Production Implementation:
 * - Dynamically generates sitemap from content metadata
 * - Auto-updates when new content is published
 * - Replaces static public/sitemap.xml (which becomes stale)
 * - Uses centralized URL generator for consistency
 *
 * Performance:
 * - Generated at build time (SSG)
 * - Cached with ISR (revalidate: 3600 = 1 hour)
 * - 425+ URLs generated from live content metadata
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */

import type { MetadataRoute } from 'next';
// Import metadata from generated files (build-time)
import { agentsMetadata } from '@/generated/agents-metadata';
import { collectionsMetadata } from '@/generated/collections-metadata';
import { commandsMetadata } from '@/generated/commands-metadata';
import { hooksMetadata } from '@/generated/hooks-metadata';
import { mcpMetadata } from '@/generated/mcp-metadata';
import { rulesMetadata } from '@/generated/rules-metadata';
import { skillsMetadata } from '@/generated/skills-metadata';
import { statuslinesMetadata } from '@/generated/statuslines-metadata';
import { generateAllSiteUrls } from '@/src/lib/build/url-generator';
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
  const sitemapUrls = await generateAllSiteUrls(
    {
      agentsMetadata,
      collectionsMetadata,
      commandsMetadata,
      hooksMetadata,
      mcpMetadata,
      rulesMetadata,
      statuslinesMetadata,
      skillsMetadata,
    },
    {
      baseUrl,
      includeGuides: true,
      includeChangelog: true,
      includeLlmsTxt: true,
      includeTools: true,
    }
  );

  // Convert to Next.js MetadataRoute.Sitemap format
  return sitemapUrls.map((url) => ({
    url: url.loc,
    lastModified: url.lastmod,
    changeFrequency: url.changefreq,
    priority: url.priority,
  }));
}

/**
 * ISR Revalidation
 * Regenerate sitemap every hour to pick up new content
 */
export const revalidate = 21600;
