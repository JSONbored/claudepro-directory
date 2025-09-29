import { APP_CONFIG, MAIN_CONTENT_CATEGORIES, SEO_CATEGORIES, STATIC_PAGES } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { UnifiedContentItem } from '@/lib/schemas/components';
import { contentProcessor } from '@/lib/services/content-processor.service';

// ISR Configuration - revalidate every 4 hours to match content ISR
export const revalidate = 14400; // 4 hours in seconds
export const runtime = 'edge'; // Use Edge Runtime for optimal performance

// Define SitemapUrl type
interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Cache for fallback sitemap in case GitHub API fails
let cachedSitemap: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 1800000; // 30 minutes in milliseconds

async function generateDynamicSitemap(): Promise<string> {
  const urls: SitemapUrl[] = [];
  const baseUrl = APP_CONFIG.url || 'https://claudepro.directory';
  const currentDate = new Date().toISOString().split('T')[0] || '';

  try {
    // Homepage
    urls.push({
      loc: baseUrl,
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0,
    });

    // Category pages
    Object.values(MAIN_CONTENT_CATEGORIES).forEach((category) => {
      urls.push({
        loc: `${baseUrl}/${category}`,
        lastmod: currentDate,
        changefreq: 'daily',
        priority: 0.8,
      });
    });

    // Static pages
    Object.values(STATIC_PAGES).forEach((page) => {
      urls.push({
        loc: `${baseUrl}/${page}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.6,
      });
    });

    // SEO Guide pages - fetch from content processor
    // Guide category pages
    Object.values(SEO_CATEGORIES).forEach((category) => {
      urls.push({
        loc: `${baseUrl}/guides/${category}`,
        lastmod: currentDate,
        changefreq: 'weekly',
        priority: 0.6,
      });
    });

    // Individual SEO guide content
    for (const category of Object.values(SEO_CATEGORIES)) {
      try {
        const seoContent = await contentProcessor.getContentByCategory(category);
        seoContent.forEach((item) => {
          const slug = item.slug.split('/').pop() || item.slug;
          urls.push({
            loc: `${baseUrl}/guides/${category}/${slug}`,
            lastmod: item.dateAdded ? item.dateAdded.split('T')[0] || currentDate : currentDate,
            changefreq: 'monthly',
            priority: 0.65,
          });
        });
      } catch (error) {
        // Log error but continue processing other categories
        logger.warn(`Failed to fetch ${category} content for sitemap`, {
          error: error instanceof Error ? error.message : String(error),
          category,
        });
      }
    }

    // Individual content pages - fetch all content from content processor
    // Fetch each category individually since getAllCategories seems to have issues
    const allContent: UnifiedContentItem[] = [];

    for (const category of Object.values(MAIN_CONTENT_CATEGORIES)) {
      try {
        const categoryContent = await contentProcessor.getContentByCategory(category);
        allContent.push(...categoryContent);
      } catch (error) {
        logger.warn(`Failed to fetch ${category} content for sitemap`, {
          error: error instanceof Error ? error.message : String(error),
          category,
        });
      }
    }

    allContent.forEach((item) => {
      const slug = item.slug.split('/').pop() || item.slug;
      urls.push({
        loc: `${baseUrl}/${item.category}/${slug}`,
        lastmod: item.dateAdded ? item.dateAdded.split('T')[0] || currentDate : currentDate,
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

    // Cache successful response
    cachedSitemap = xml;
    cacheTimestamp = Date.now();

    logger.info('Dynamic sitemap generated successfully', {
      urlCount: urls.length,
      contentItems: allContent.length,
    });

    return xml;
  } catch (error) {
    logger.error(
      'Failed to generate dynamic sitemap',
      error instanceof Error ? error : new Error(String(error))
    );

    // Return cached sitemap if available and recent
    if (cachedSitemap && Date.now() - cacheTimestamp < CACHE_TTL) {
      logger.info('Returning cached sitemap due to generation error');
      return cachedSitemap;
    }

    // Fallback minimal sitemap
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/agents</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/mcp</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/rules</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/commands</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/hooks</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>`;

    logger.warn('Using fallback sitemap due to generation failure');
    return fallbackXml;
  }
}

export async function GET() {
  try {
    const sitemap = await generateDynamicSitemap();

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=14400, stale-while-revalidate=86400', // 4h cache, 24h stale
        'X-Robots-Tag': 'noindex', // Prevent indexing of sitemap itself
      },
    });
  } catch (error) {
    logger.error('Sitemap route error', error instanceof Error ? error : new Error(String(error)));

    // Return 500 error for sitemap failures
    return new Response('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
