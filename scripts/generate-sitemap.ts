import { existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
// Import directly from metadata files for build-time usage (not runtime lazy loaders)
import { agentsMetadata } from '../generated/agents-metadata.js';
import { commandsMetadata } from '../generated/commands-metadata.js';
import { hooksMetadata } from '../generated/hooks-metadata.js';
import { mcpMetadata } from '../generated/mcp-metadata.js';
import { rulesMetadata } from '../generated/rules-metadata.js';
import { APP_CONFIG } from '../lib/constants';
import { scriptLogger } from '../lib/logger.js';
import type { ContentItem } from '../lib/schemas/content.schema';

// Define SitemapUrl type locally
interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

// Always use production URL for sitemap
const baseUrl = APP_CONFIG.url;

async function generateSitemap(): Promise<string> {
  // Use generated content directly instead of static API files

  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: baseUrl || '',
    lastmod: new Date().toISOString().split('T')[0] || '',
    changefreq: 'daily',
    priority: 1.0,
  });

  // Category pages
  const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl || ''}/${category}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'daily',
      priority: 0.8,
    });
  });

  // Static pages
  const staticPages = ['jobs', 'community', 'trending', 'submit', 'guides'];
  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl || ''}/${page}`,
      lastmod: new Date().toISOString().split('T')[0] || '',
      changefreq: 'weekly',
      priority: 0.6,
    });
  });

  // SEO Guide pages from seo/ directory
  const seoCategories = [
    'use-cases',
    'tutorials',
    'collections',
    'categories',
    'workflows',
    'comparisons',
    'troubleshooting',
  ];
  seoCategories.forEach((category) => {
    const seoDir = join('seo', category);
    if (existsSync(seoDir)) {
      try {
        const files = readdirSync(seoDir).filter((f) => f.endsWith('.mdx'));
        files.forEach((file) => {
          const slug = file.replace('.mdx', '');
          urls.push({
            loc: `${baseUrl || ''}/guides/${category}/${slug}`,
            lastmod: new Date().toISOString().split('T')[0] || '',
            changefreq: 'monthly',
            priority: 0.65,
          });
        });
      } catch {
        // Directory doesn't exist yet
      }
    }
  });

  // Individual content pages - each content type already has proper category
  const allContent: ContentItem[] = [
    ...rulesMetadata,
    ...mcpMetadata,
    ...agentsMetadata,
    ...commandsMetadata,
    ...hooksMetadata,
  ];

  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}`,
      lastmod: (item.dateAdded || new Date().toISOString()).split('T')[0] || '',
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

  return xml;
}

function generateRobotsTxt(): string {
  const robotsTxt = `# Robots.txt for ${APP_CONFIG.name}
# ${APP_CONFIG.url}/robots.txt

User-agent: *
Allow: /

# Important pages
Allow: /agents*
Allow: /mcp*
Allow: /rules*
Allow: /commands*
Allow: /hooks*
Allow: /guides*

# API endpoints (allow for better indexing of JSON-LD structured data)
Allow: /api/*

# Block admin areas if they exist
Disallow: /admin*
Disallow: /.well-known*

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (be respectful)
Crawl-delay: 1`;

  return robotsTxt;
}

async function main() {
  try {
    scriptLogger.progress('Generating sitemap...');
    const sitemap = await generateSitemap();
    writeFileSync('public/sitemap.xml', sitemap, 'utf-8');
    scriptLogger.success('Sitemap generated successfully');

    scriptLogger.progress('Generating robots.txt...');
    const robotsTxt = generateRobotsTxt();
    writeFileSync('public/robots.txt', robotsTxt, 'utf-8');
    scriptLogger.success('Robots.txt generated successfully');

    scriptLogger.log(`Generated ${sitemap.match(/<url>/g)?.length || 0} URLs in sitemap`);
  } catch (error) {
    scriptLogger.failure(
      `Failed to generate sitemap/robots.txt: ${error instanceof Error ? error.message : String(error)}`
    );
    process.exit(1);
  }
}

// Run if this file is executed directly
main();

export { generateSitemap };
