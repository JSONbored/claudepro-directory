import fs from 'fs/promises';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import path from 'path';
import { z } from 'zod';
// Removed unused import: CategoryGuidesPage
import { UnifiedSidebar } from '@/src/components/layout/sidebar/unified-sidebar';
import { MDXContentProvider } from '@/src/components/providers/mdx-content-provider';
import { MDXRenderer } from '@/src/components/shared/mdx-renderer';
import { ViewTracker } from '@/src/components/shared/view-tracker';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { APP_CONFIG } from '@/src/lib/constants';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { ArrowLeft, BookOpen, Calendar, Eye, FileText, Tag, Users, Zap } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { contentCache, statsRedis } from '@/src/lib/redis';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { GuideItemWithCategory } from '@/src/lib/utils/guide-helpers';

// ISR Configuration - Revalidate every 5 minutes for fresh view counts
export const revalidate = 300;
export const dynamicParams = true;

// Validation schema for guide parameters
const guideParamsSchema = z.object({
  category: z
    .string()
    .min(1, 'Category cannot be empty')
    .max(100, 'Category too long')
    .regex(
      /^[a-zA-Z0-9-_]+$/,
      'Category can only contain letters, numbers, hyphens, and underscores'
    )
    .transform((val) => val.toLowerCase().trim()),
  slug: z
    .string()
    .min(1, 'Slug cannot be empty')
    .max(200, 'Slug too long')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Slug can only contain letters, numbers, hyphens, and underscores')
    .transform((val) => val.toLowerCase().trim()),
});

import type { RelatedGuide, SEOPageData } from '@/src/lib/schemas/app.schema';

async function getSEOPageData(category: string, slug: string): Promise<SEOPageData | null> {
  // Map URL paths to file locations
  const pathMap: Record<string, string> = {
    'use-cases': 'use-cases',
    tutorials: 'tutorials',
    collections: 'collections',
    categories: 'categories',
    workflows: 'workflows',
    comparisons: 'comparisons',
    troubleshooting: 'troubleshooting',
  };

  const filename = `${slug}.mdx`;

  if (!pathMap[category]) return null;

  const cacheKey = `guide:${category}:${slug}`;

  return await contentCache.cacheWithRefresh(
    cacheKey,
    async () => {
      try {
        const mappedPath = pathMap[category];
        if (!mappedPath) return null;

        const filePath = path.join(process.cwd(), 'content', 'guides', mappedPath, filename);

        // Read file directly - this avoids TOCTOU race condition
        // If file doesn't exist or can't be read, catch block will handle it
        const fileContent = await fs.readFile(filePath, 'utf-8');

        // Parse frontmatter using our MDX parser
        const { frontmatter, content } = parseMDXFrontmatter(fileContent);

        return {
          title: frontmatter.title || '',
          seoTitle: frontmatter.seoTitle, // Short title for <title> tag optimization
          description: frontmatter.description || '',
          keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
          dateUpdated: frontmatter.dateUpdated || '',
          author: frontmatter.author || APP_CONFIG.author,
          readingTime: frontmatter.readingTime || '',
          difficulty: frontmatter.difficulty || '',
          category: frontmatter.category || category,
          content,
        };
      } catch (_error) {
        return null;
      }
    },
    24 * 60 * 60 // Cache for 24 hours
  );
}

// Unused function - kept for future potential use
// @ts-expect-error - Function intentionally unused, kept for future use
async function _getCategoryGuides(category: string): Promise<GuideItemWithCategory[]> {
  const cacheKey = `category-guides:${category}`;

  const guides = await contentCache.cacheWithRefresh(
    cacheKey,
    async () => {
      const guidesList: GuideItemWithCategory[] = [];

      try {
        const dir = path.join(process.cwd(), 'content', 'guides', category);

        // Read directory directly - catch will handle if it doesn't exist
        const files = await fs.readdir(dir);

        for (const file of files) {
          if (file.endsWith('.mdx')) {
            try {
              const content = await fs.readFile(path.join(dir, file), 'utf-8');
              const { frontmatter } = parseMDXFrontmatter(content);

              guidesList.push({
                title: frontmatter.title || file.replace('.mdx', ''),
                description: frontmatter.description || '',
                slug: `/guides/${category}/${file.replace('.mdx', '')}`,
                category,
                dateUpdated: frontmatter.dateUpdated || '',
              });
            } catch {
              // Skip files that fail to parse
            }
          }
        }
      } catch {
        // Directory doesn't exist
      }

      return guidesList;
    },
    4 * 60 * 60 // Cache for 4 hours
  );

  // Enrich with view counts from Redis
  const enriched = await statsRedis.enrichWithViewCounts(
    guides.map((guide) => ({
      ...guide,
      category: 'guides' as const,
      slug: guide.slug.replace('/guides/', ''), // e.g., "tutorials/desktop-mcp-setup"
    }))
  );

  // Restore original category field and slug format
  return enriched.map((guide, index) => ({
    ...guide,
    category,
    slug: guides[index]?.slug || guide.slug,
  }));
}

async function getRelatedGuides(
  currentCategory: string,
  currentSlug: string,
  limit = 3
): Promise<RelatedGuide[]> {
  if (!currentCategory) return [];

  const cacheKey = `related:${currentCategory}:${currentSlug}:${limit}`;

  return await contentCache.cacheWithRefresh(
    cacheKey,
    async () => {
      const relatedGuides: RelatedGuide[] = [];

      try {
        const dir = path.join(process.cwd(), 'content', 'guides', currentCategory);

        // Read directory directly - catch will handle if it doesn't exist
        const files = await fs.readdir(dir);

        for (const file of files) {
          const fileSlug = file.replace('.mdx', '');
          if (file.endsWith('.mdx') && fileSlug !== currentSlug) {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const titleMatch = content.match(/title:\s*["']([^"']+)["']/);

            if (titleMatch?.[1]) {
              relatedGuides.push({
                title: titleMatch[1],
                slug: `/guides/${currentCategory}/${fileSlug}`,
                category: currentCategory,
              });
            }

            if (relatedGuides.length >= limit) break;
          }
        }
      } catch {
        // Directory doesn't exist
      }

      return relatedGuides;
    },
    4 * 60 * 60 // Cache for 4 hours
  );
}

export async function generateStaticParams() {
  const categories = [
    'use-cases',
    'tutorials',
    'collections',
    'categories',
    'workflows',
    'comparisons',
    'troubleshooting',
  ];
  const paths = [];

  for (const category of categories) {
    // Add individual guide pages only (category pages handled by [category]/page.tsx)
    try {
      const dir = path.join(process.cwd(), 'content', 'guides', category);

      // Read directory directly - catch will handle if it doesn't exist
      const files = await fs.readdir(dir);

      for (const file of files) {
        if (file.endsWith('.mdx')) {
          const slug = file.replace('.mdx', '');
          paths.push({
            category,
            slug,
          });
        }
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  return paths;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}): Promise<Metadata> {
  try {
    const rawParams = await params;
    const validationResult = guideParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      logger.warn('Invalid guide parameters for metadata', {
        category: rawParams.category || 'unknown',
        slug: rawParams.slug || 'unknown',
        errorCount: validationResult.error.issues.length,
        firstError: validationResult.error.issues[0]?.message || 'Unknown error',
      });
      return {
        title: 'Guide Not Found',
        description: 'The requested guide could not be found.',
      };
    }

    const { category, slug } = validationResult.data;

    const data = await getSEOPageData(category, slug);

    if (!data) {
      return {
        title: 'Guide Not Found',
        description: 'The requested guide could not be found.',
      };
    }

    // Use centralized metadata system with AI citation optimization
    // This route uses Article schema + recency signals for better AI citations
    return await generatePageMetadata('/guides/:category/:slug', {
      params: {
        category: category || '',
        slug: slug || '',
      },
      item: {
        title: data.title,
        seoTitle: data.seoTitle, // Short title for <title> tag, preserves longtail in H1
        description: data.description,
        tags: data.keywords,
        author: data.author,
        dateAdded: data.dateUpdated,
        lastModified: data.dateUpdated,
      },
    });
  } catch (error: unknown) {
    logger.error(
      'Error generating guide metadata',
      error instanceof Error ? error : new Error(String(error)),
      {
        type: 'metadata_generation',
      }
    );
    return {
      title: 'Guide Error',
      description: 'An error occurred while loading the guide.',
    };
  }
}

export default async function SEOGuidePage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>;
}) {
  try {
    const rawParams = await params;
    const validationResult = guideParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      logger.error(
        'Invalid guide parameters',
        new Error(validationResult.error.issues[0]?.message || 'Invalid guide parameters'),
        {
          category: rawParams.category || 'unknown',
          slug: rawParams.slug || 'unknown',
          errorCount: validationResult.error.issues.length,
        }
      );
      notFound();
    }

    const { category, slug } = validationResult.data;

    const data = await getSEOPageData(category, slug);

    if (!data) {
      notFound();
    }
    const categoryLabels: Record<string, string> = {
      'use-cases': 'Use Case',
      tutorials: 'Tutorial',
      collections: 'Collection',
      categories: 'Category Guide',
      workflows: 'Workflow',
      comparisons: 'Comparison',
      troubleshooting: 'Troubleshooting',
    };

    const categoryIcons: Record<string, typeof Zap> = {
      'use-cases': Zap,
      tutorials: BookOpen,
      collections: Users,
      categories: FileText,
      workflows: Zap,
      comparisons: FileText,
      troubleshooting: Zap,
    };

    const Icon = (category && categoryIcons[category]) || BookOpen;
    const relatedGuides = await getRelatedGuides(category, slug);

    // Fetch view count for this guide from Redis
    const guideSlug = `${category}/${slug}`; // e.g., "tutorials/desktop-mcp-setup"
    const viewCount = await statsRedis.getViewCount('guides', guideSlug);

    // Format date if available
    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch {
        return dateStr;
      }
    };

    // Format view count (same as other content pages)
    const formatViewCount = (count: number): string => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return count.toString();
    };

    // Generate breadcrumb structured data
    const breadcrumbList = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: APP_CONFIG.url,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Guides',
          item: `${APP_CONFIG.url}/guides`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: categoryLabels[category || ''] || 'Guide',
          item: `${APP_CONFIG.url}/guides/${category}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: data.title,
          item: `${APP_CONFIG.url}/guides/${category}/${slug}`,
        },
      ],
    };

    // Article structured data
    const articleData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: data.title,
      description: data.description,
      keywords: data.keywords?.join(', '),
      author: {
        '@type': 'Person',
        name: data.author || APP_CONFIG.author,
      },
      datePublished: data.dateUpdated,
      dateModified: data.dateUpdated,
      publisher: {
        '@type': 'Organization',
        name: APP_CONFIG.name,
        logo: {
          '@type': 'ImageObject',
          url: `${APP_CONFIG.url}/logo.png`,
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${APP_CONFIG.url}/guides/${category}/${slug}`,
      },
      articleSection: categoryLabels[category || ''] || 'Guide',
      wordCount: data.content.split(/\s+/).length,
    };

    // Generate unique IDs based on the page slug to avoid conflicts
    const pageId = `${category}-${slug}`;
    const breadcrumbId = `breadcrumb-${pageId}`;
    const articleId = `article-${pageId}`;
    return (
      <>
        <Script id={breadcrumbId} type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbList)}
        </Script>
        <Script id={articleId} type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(articleData)}
        </Script>
        <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
          {/* Header - matches content pages */}
          <div className={`${UI_CLASSES.BORDER_B} border-border/50 ${UI_CLASSES.BG_CARD}/30`}>
            <div className="container mx-auto px-4 py-8">
              {/* Modern back navigation */}
              <div className={UI_CLASSES.MB_6}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href="/guides">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    All Guides
                  </Link>
                </Button>
              </div>

              <div className={UI_CLASSES.MAX_W_4XL}>
                <div className={`flex ${UI_CLASSES.ITEMS_START} gap-4 ${UI_CLASSES.MB_6}`}>
                  <div className={`p-3 ${UI_CLASSES.BG_ACCENT_10} rounded-lg`}>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className={UI_CLASSES.FLEX_1}>
                    <h1 className={`text-3xl font-bold ${UI_CLASSES.MB_2}`}>{data.title}</h1>
                    <p className="text-lg text-muted-foreground">{data.description}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className={`${UI_CLASSES.FLEX_WRAP_GAP_4} ${UI_CLASSES.TEXT_SM_MUTED}`}>
                  <Badge variant="secondary">
                    {category ? categoryLabels[category] || category : 'Guide'}
                  </Badge>
                  {data.dateUpdated && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(data.dateUpdated)}</span>
                    </div>
                  )}
                  {viewCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-xs">{formatViewCount(viewCount)}</span>
                    </Badge>
                  )}
                </div>

                {/* Tags/Keywords */}
                {data.keywords && data.keywords.length > 0 && (
                  <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-4`}>
                    {data.keywords.map((keyword: string) => (
                      <Badge key={keyword} variant="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content with sidebar layout - matches content pages */}
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                <Card>
                  <CardContent className="pt-6">
                    <MDXContentProvider category={category} slug={slug}>
                      <MDXRenderer
                        source={data.content}
                        className=""
                        pathname={`/guides/${category}/${slug}`}
                        metadata={{
                          tags: data.keywords || [], // Note: SEO pages use keywords field
                          keywords: data.keywords || [],
                        }}
                      />
                    </MDXContentProvider>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <UnifiedSidebar
                mode="content"
                contentData={{
                  title: data.title,
                  description: data.description,
                  keywords: data.keywords,
                  dateUpdated: data.dateUpdated,
                  category: category || '',
                  content: data.content,
                }}
                relatedGuides={relatedGuides}
              />
            </div>
          </div>
        </div>

        {/* Track guide views for trending analytics */}
        <ViewTracker category="guides" slug={guideSlug} />
      </>
    );
  } catch (error: unknown) {
    logger.error(
      'Error rendering guide page',
      error instanceof Error ? error : new Error(String(error)),
      {
        type: 'page_rendering',
      }
    );
    notFound();
  }
}
