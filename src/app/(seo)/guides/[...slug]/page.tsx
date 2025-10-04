import fs from 'fs/promises';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import path from 'path';
import { z } from 'zod';
import { CategoryGuidesPage } from '@/src/components/category-guides-page';
import { UnifiedSidebar } from '@/src/components/layout/sidebar/unified-sidebar';
import { MDXRenderer } from '@/src/components/shared/mdx-renderer';
import { ViewTracker } from '@/src/components/shared/view-tracker';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card, CardContent } from '@/src/components/ui/card';
import { APP_CONFIG } from '@/src/lib/constants';
import { parseMDXFrontmatter } from '@/src/lib/content/mdx-config';
import { ArrowLeft, BookOpen, Calendar, FileText, Tag, Users, Zap } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { contentCache } from '@/src/lib/redis';
import { UI_CLASSES } from '@/src/lib/ui-constants';
import type { GuideItemWithCategory } from '@/src/lib/utils/guide-helpers';

// ISR Configuration - Revalidate weekly for SEO pages
export const dynamic = 'force-static';
export const dynamicParams = true;

// Validation schema for guide parameters
const guideParamsSchema = z.object({
  slug: z
    .array(
      z
        .string()
        .min(1, 'Slug segment cannot be empty')
        .max(100, 'Slug segment too long')
        .regex(
          /^[a-zA-Z0-9-_]+$/,
          'Slug can only contain letters, numbers, hyphens, and underscores'
        )
        .transform((val) => val.toLowerCase().trim())
    )
    .min(1, 'At least one slug segment required')
    .max(5, 'Too many slug segments'),
});

import type { RelatedGuide, SEOPageData } from '@/src/lib/schemas/app.schema';

async function getSEOPageData(slug: string[]): Promise<SEOPageData | null> {
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

  const [category, ...restSlug] = slug;
  const filename = `${restSlug.join('-')}.mdx`;

  if (!(category && pathMap[category])) return null;

  const cacheKey = `guide:${category}:${restSlug.join('-')}`;

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

async function getCategoryGuides(category: string): Promise<GuideItemWithCategory[]> {
  const cacheKey = `category-guides:${category}`;

  return await contentCache.cacheWithRefresh(
    cacheKey,
    async () => {
      const guides: GuideItemWithCategory[] = [];

      try {
        const dir = path.join(process.cwd(), 'content', 'guides', category);

        // Read directory directly - catch will handle if it doesn't exist
        const files = await fs.readdir(dir);

        for (const file of files) {
          if (file.endsWith('.mdx')) {
            try {
              const content = await fs.readFile(path.join(dir, file), 'utf-8');
              const { frontmatter } = parseMDXFrontmatter(content);

              guides.push({
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

      return guides;
    },
    4 * 60 * 60 // Cache for 4 hours
  );
}

async function getRelatedGuides(currentSlug: string[], limit = 3): Promise<RelatedGuide[]> {
  const [currentCategory] = currentSlug;
  if (!currentCategory) return [];

  const currentFilename = currentSlug.slice(1).join('-');
  const cacheKey = `related:${currentCategory}:${currentFilename}:${limit}`;

  return await contentCache.cacheWithRefresh(
    cacheKey,
    async () => {
      const relatedGuides: RelatedGuide[] = [];

      try {
        const dir = path.join(process.cwd(), 'content', 'guides', currentCategory);

        // Read directory directly - catch will handle if it doesn't exist
        const files = await fs.readdir(dir);

        for (const file of files) {
          if (file.endsWith('.mdx') && !file.includes(currentFilename)) {
            const content = await fs.readFile(path.join(dir, file), 'utf-8');
            const titleMatch = content.match(/title:\s*["']([^"']+)["']/);

            if (titleMatch?.[1]) {
              relatedGuides.push({
                title: titleMatch[1],
                slug: `/guides/${currentCategory}/${file.replace('.mdx', '')}`,
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
    // Add category listing page
    paths.push({
      slug: [category],
    });

    // Add individual guide pages
    try {
      const dir = path.join(process.cwd(), 'content', 'guides', category);

      // Read directory directly - catch will handle if it doesn't exist
      const files = await fs.readdir(dir);

      for (const file of files) {
        if (file.endsWith('.mdx')) {
          const slug = file.replace('.mdx', '');
          paths.push({
            slug: [category, slug],
          });
        }
      }
    } catch {
      // Directory doesn't exist yet
    }
  }

  return paths;
}

const categoryLabels: Record<string, string> = {
  'use-cases': 'Use Cases',
  tutorials: 'Tutorials',
  collections: 'Collections',
  categories: 'Category Guides',
  workflows: 'Workflows',
  comparisons: 'Comparisons',
  troubleshooting: 'Troubleshooting',
};

const categoryDescriptions: Record<string, string> = {
  'use-cases': 'Practical guides for specific Claude AI use cases',
  tutorials: 'Step-by-step tutorials for Claude features',
  collections: 'Curated collections of tools and agents',
  categories: 'Comprehensive guides by category',
  workflows: 'Complete workflow guides and strategies',
  comparisons: 'Compare Claude with other development tools',
  troubleshooting: 'Solutions for common Claude AI issues',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  try {
    const rawParams = await params;
    const validationResult = guideParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      logger.warn('Invalid guide slug parameters for metadata', {
        slug: rawParams.slug?.join('/') || 'unknown',
        errorCount: validationResult.error.issues.length,
        firstError: validationResult.error.issues[0]?.message || 'Unknown error',
      });
      return {
        title: 'Guide Not Found',
        description: 'The requested guide could not be found.',
      };
    }

    const { slug } = validationResult.data;
    const baseUrl = APP_CONFIG.url;
    const canonicalUrl = `${baseUrl}/guides/${slug.join('/')}`;

    // Handle category listing pages (single segment)
    if (slug.length === 1) {
      const [category] = slug;
      const categoryLabel = categoryLabels[category || ''] || category;
      const categoryDescription =
        categoryDescriptions[category || ''] || `Browse all ${category} guides`;

      return {
        title: `${categoryLabel} - Claude Guides`,
        description: categoryDescription,
        alternates: {
          canonical: canonicalUrl,
        },
        openGraph: {
          title: `${categoryLabel} - Claude Guides`,
          description: categoryDescription,
          type: 'website',
          url: canonicalUrl,
          siteName: APP_CONFIG.name,
        },
        twitter: {
          card: 'summary_large_image',
          title: `${categoryLabel} - Claude Guides`,
          description: categoryDescription,
        },
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
          },
        },
      };
    }

    // Handle individual guide pages (multiple segments)
    const data = await getSEOPageData(slug);

    if (!data) {
      return {
        title: 'Guide Not Found',
        description: 'The requested guide could not be found.',
      };
    }

    return {
      title: data.title,
      description: data.description,
      keywords: data.keywords?.join(', '),
      authors: [{ name: data.author || APP_CONFIG.author }],
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: data.title,
        description: data.description,
        type: 'article',
        publishedTime: data.dateUpdated,
        authors: [data.author || APP_CONFIG.author],
        url: canonicalUrl,
        siteName: APP_CONFIG.name,
        images: [
          {
            url: `${baseUrl}/api/og?title=${encodeURIComponent(data.title)}&category=${slug[0]}`,
            width: 1200,
            height: 630,
            alt: data.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: data.title,
        description: data.description,
        images: [`${baseUrl}/api/og?title=${encodeURIComponent(data.title)}&category=${slug[0]}`],
        creator: '@claudeprodirectory',
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
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

export default async function SEOGuidePage({ params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const rawParams = await params;
    const validationResult = guideParamsSchema.safeParse(rawParams);

    if (!validationResult.success) {
      logger.error(
        'Invalid guide slug parameters',
        new Error(validationResult.error.issues[0]?.message || 'Invalid guide parameters'),
        {
          slug: rawParams.slug?.join('/') || 'unknown',
          errorCount: validationResult.error.issues.length,
        }
      );
      notFound();
    }

    const { slug } = validationResult.data;

    // Handle category listing pages (single segment)
    if (slug.length === 1) {
      const category = slug[0];
      if (!category) {
        notFound();
      }

      const guides = await getCategoryGuides(category);

      if (guides.length === 0) {
        notFound();
      }

      return <CategoryGuidesPage category={category} guides={guides} />;
    }

    // Handle individual guide pages (multiple segments)
    const data = await getSEOPageData(slug);

    if (!data) {
      notFound();
    }

    const [category] = slug;
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
    const relatedGuides = await getRelatedGuides(slug);

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
          item: `${APP_CONFIG.url}/guides/${slug.join('/')}`,
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
        '@id': `${APP_CONFIG.url}/guides/${slug.join('/')}`,
      },
      articleSection: categoryLabels[category || ''] || 'Guide',
      wordCount: data.content.split(/\s+/).length,
    };

    // Generate unique IDs based on the page slug to avoid conflicts
    const pageId = slug.join('-');
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
                    <MDXRenderer
                      source={data.content}
                      className=""
                      pathname={`/guides/${slug.join('/')}`}
                      metadata={{
                        tags: data.keywords || [], // Note: SEO pages use keywords field
                        keywords: data.keywords || [],
                      }}
                    />
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
        <ViewTracker category="guides" slug={slug.join('/')} />
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
