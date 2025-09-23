import { existsSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { agents, commands, hooks, mcp, rules } from '../generated/content.js';

// Always use production URL for sitemap
const baseUrl = 'https://claudepro.directory';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

interface ContentItem {
  slug: string;
  dateAdded: string;
  lastModified?: string;
}

function generateSitemap(): string {
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

  // Individual content pages
  const allContent = [
    ...rules.map((item) => ({ ...item, category: 'rules' })),
    ...mcp.map((item) => ({ ...item, category: 'mcp' })),
    ...agents.map((item) => ({ ...item, category: 'agents' })),
    ...commands.map((item) => ({ ...item, category: 'commands' })),
    ...hooks.map((item) => ({ ...item, category: 'hooks' })),
  ] as Array<ContentItem & { category: string }>;

  allContent.forEach((item) => {
    urls.push({
      loc: `${baseUrl}/${item.category}/${item.slug}`,
      lastmod: item.lastModified ? item.lastModified : item.dateAdded,
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

function main() {
  try {
    const sitemap = generateSitemap();
    writeFileSync('public/sitemap.xml', sitemap, 'utf-8');
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main();

export { generateSitemap };
