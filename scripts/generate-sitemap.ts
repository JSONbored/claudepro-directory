import { writeFileSync } from 'fs';

const baseUrl =
  process.env.VERCEL_ENV === 'production'
    ? 'https://claudepro.directory'
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://dev.claudepro.directory';

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

async function generateSitemap(): Promise<string> {
  // Dynamic import to work in both environments
  const { agents, commands, hooks, mcp, rules } = await import('../src/generated/content');

  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: baseUrl,
    lastmod: new Date().toISOString().split('T')[0],
    changefreq: 'daily',
    priority: 1.0,
  });

  // Category pages
  const categories = ['agents', 'mcp', 'rules', 'commands', 'hooks'];
  categories.forEach((category) => {
    urls.push({
      loc: `${baseUrl}/${category}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: 0.8,
    });
  });

  // Static pages
  const staticPages = ['jobs', 'community', 'trending', 'submit'];
  staticPages.forEach((page) => {
    urls.push({
      loc: `${baseUrl}/${page}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: 0.6,
    });
  });

  // Individual content pages
  const allContent = [
    ...rules.map((item) => ({ ...item, category: 'rules' })),
    ...mcp.map((item) => ({ ...item, category: 'mcp' })),
    ...agents.map((item) => ({ ...item, category: 'agents' })),
    ...commands.map((item) => ({ ...item, category: 'commands' })),
    ...hooks.map((item) => ({ ...item, category: 'hooks' })),
  ] as Array<{ slug: string; category: string; lastModified?: string; dateAdded: string }>;

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

async function main() {
  try {
    const sitemap = await generateSitemap();
    writeFileSync('public/sitemap.xml', sitemap, 'utf-8');
    console.log('✅ Generated sitemap.xml with', sitemap.split('<url>').length - 1, 'URLs');
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
main();

export { generateSitemap };
