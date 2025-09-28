import { ArrowLeft, BookOpen, Calendar, FileText, Tag, Users, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import { z } from 'zod';
import { ContentErrorBoundary } from '@/components/content-error-boundary';
import { MDXRenderer } from '@/components/mdx-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedSidebar } from '@/components/unified-sidebar';
import { ViewTracker } from '@/components/view-tracker';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { githubContentService } from '@/lib/services/github-content.service';

// ISR Configuration - Revalidate every 4 hours
export const revalidate = 14400; // 4 hours
export const dynamic = 'force-static';
export const dynamicParams = true;

// Use Edge Runtime for better performance and lower costs
export const runtime = 'edge';

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

import type { RelatedGuide, SEOPageData } from '@/lib/schemas/app.schema';

async function getSEOPageData(slug: string[]): Promise<SEOPageData | null> {
  const [category, ...restSlug] = slug;
  const targetSlug = restSlug.join('-');

  if (!category) return null;

  try {
    // Get all SEO content using our optimized system
    let seoContent = await contentCache.getSEOContent();

    if (!seoContent) {
      seoContent = await contentProcessor.getSEOContent();
      if (seoContent) {
        await contentCache.setSEOContent(seoContent);
      }
    }

    // Find the specific content item
    const categoryContent = seoContent?.[category] || [];
    const contentItem = categoryContent.find((item) => {
      const itemSlug = item.slug.split('/').pop() || '';
      return (
        itemSlug === targetSlug || item.title?.toLowerCase().replace(/\s+/g, '-') === targetSlug
      );
    });

    if (!contentItem) return null;

    // Get the full content from GitHub
    const fullContent = await githubContentService.getFileContent(
      `seo/${category}/${targetSlug}.mdx`
    );

    if (!fullContent) return null;

    return {
      title: contentItem.title || '',
      description: contentItem.description || '',
      keywords: contentItem.tags || [],
      dateUpdated: contentItem.dateAdded || '',
      author: contentItem.author || APP_CONFIG.author,
      readingTime: '', // Can be calculated from content if needed
      difficulty: contentItem.difficulty || '',
      category: contentItem.category || category,
      content: fullContent,
    };
  } catch (error) {
    logger.error('Failed to get SEO page data', error as Error, { slug: slug.join('/') });
    return null;
  }
}

async function getRelatedGuides(currentSlug: string[], limit = 3): Promise<RelatedGuide[]> {
  const [currentCategory] = currentSlug;
  if (!currentCategory) return [];

  const currentTargetSlug = currentSlug.slice(1).join('-');

  try {
    // Get all SEO content using our optimized system
    let seoContent = await contentCache.getSEOContent();

    if (!seoContent) {
      seoContent = await contentProcessor.getSEOContent();
      if (seoContent) {
        await contentCache.setSEOContent(seoContent);
      }
    }

    // Get related guides from the same category, excluding current item
    const categoryContent = seoContent?.[currentCategory] || [];
    const relatedGuides: RelatedGuide[] = [];

    for (const item of categoryContent) {
      const itemSlug = item.slug.split('/').pop() || '';

      // Skip the current item
      if (
        itemSlug === currentTargetSlug ||
        item.title?.toLowerCase().replace(/\s+/g, '-') === currentTargetSlug
      ) {
        continue;
      }

      if (item.title) {
        relatedGuides.push({
          title: item.title,
          slug: `/guides/${currentCategory}/${itemSlug}`,
          category: currentCategory,
        });
      }

      if (relatedGuides.length >= limit) break;
    }

    return relatedGuides;
  } catch (error) {
    logger.error('Failed to get related guides', error as Error, {
      currentSlug: currentSlug.join('/'),
    });
    return [];
  }
}

export async function generateStaticParams() {
  try {
    // Use our optimized content system instead of filesystem operations
    const seoContent = await contentProcessor.getSEOContent();

    const paths = [];

    for (const [category, items] of Object.entries(seoContent)) {
      for (const item of items) {
        const itemSlug = item.slug.split('/').pop();
        if (itemSlug) {
          paths.push({
            slug: [category, itemSlug],
          });
        }
      }
    }

    return paths;
  } catch (error) {
    logger.error('Failed to generate static params for guides', error as Error);
    return [];
  }
}

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
    const data = await getSEOPageData(slug);

    if (!data) {
      return {
        title: 'Guide Not Found',
        description: 'The requested guide could not be found.',
      };
    }

    const baseUrl = APP_CONFIG.url;
    const canonicalUrl = `${baseUrl}/guides/${slug.join('/')}`;

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
      <ContentErrorBoundary>
        <Script id={breadcrumbId} type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbList)}
        </Script>
        <Script id={articleId} type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(articleData)}
        </Script>
        <div className="min-h-screen bg-background">
          {/* Header - matches content pages */}
          <div className="border-b border-border/50 bg-card/30">
            <div className="container mx-auto px-4 py-8">
              {/* Modern back navigation */}
              <div className="mb-6">
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

              <div className="max-w-4xl">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 bg-accent/10 rounded-lg">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold mb-2">{data.title}</h1>
                    <p className="text-lg text-muted-foreground">{data.description}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <Badge variant="secondary">
                    {category ? categoryLabels[category] || category : 'Guide'}
                  </Badge>
                  {data.dateUpdated && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(data.dateUpdated)}</span>
                    </div>
                  )}
                </div>

                {/* Tags/Keywords */}
                {data.keywords && data.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
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
      </ContentErrorBoundary>
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
