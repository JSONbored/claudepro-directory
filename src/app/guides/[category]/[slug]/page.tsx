import fs from 'fs/promises';
import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Script from 'next/script';
import path from 'path';
import { z } from 'zod';
import { JSONSectionRenderer } from '@/src/components/content/json-section-renderer';
import { ReadProgress } from '@/src/components/content/read-progress';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
// MDXContentProvider removed - 100% JSON guides now
import { UnifiedTracker } from '@/src/components/infra/unified-tracker';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

// Removed unused import: CategoryGuidesPage
import { UnifiedSidebar } from '@/src/components/layout/sidebar/unified-sidebar';
import { Button } from '@/src/components/primitives/button';
import { Card, CardContent } from '@/src/components/primitives/card';
import { SectionProgress } from '@/src/components/shared/section-progress';
import { APP_CONFIG } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
// MDX support removed - 100% JSON guides now
import { ArrowLeft, BookOpen, Calendar, Eye, FileText, Tag, Users, Zap } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';
import { UI_CLASSES } from '@/src/lib/ui-constants';

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

  if (!pathMap[category]) return null;

  try {
    const mappedPath = pathMap[category];
    if (!mappedPath) return null;

    const baseDir = path.join(process.cwd(), 'content', 'guides', mappedPath);
    const jsonPath = path.join(baseDir, `${slug}.json`);

    const fileContent = await fs.readFile(jsonPath, 'utf-8');
    const jsonData = JSON.parse(fileContent);

    return {
      title: jsonData.title || '',
      seoTitle: jsonData.seo_title,
      description: jsonData.description || '',
      keywords: Array.isArray(jsonData.keywords) ? jsonData.keywords : [],
      dateUpdated: jsonData.dateUpdated || '',
      author: jsonData.author || APP_CONFIG.author,
      readingTime: jsonData.readingTime || '',
      difficulty: jsonData.difficulty || '',
      category: jsonData.category || category,
      content: '',
      sections: jsonData.sections || [],
      isJsonGuide: true,
    };
  } catch (_error) {
    return null;
  }
}

async function getRelatedGuides(
  currentCategory: string,
  currentSlug: string,
  limit = 3
): Promise<RelatedGuide[]> {
  if (!currentCategory) return [];

  const relatedGuides: RelatedGuide[] = [];

  try {
    const dir = path.join(process.cwd(), 'content', 'guides', currentCategory);

    const files = await fs.readdir(dir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const fileSlug = file.replace('.json', '');
        if (fileSlug !== currentSlug) {
          const content = await fs.readFile(path.join(dir, file), 'utf-8');
          const jsonData = JSON.parse(content);

          if (jsonData.title) {
            relatedGuides.push({
              title: jsonData.title,
              slug: `/guides/${currentCategory}/${fileSlug}`,
              category: currentCategory,
            });
          }

          if (relatedGuides.length >= limit) break;
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return relatedGuides;
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
        if (file.endsWith('.json')) {
          const slug = file.replace(/\.json$/, '');
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
  const { category, slug } = await params;

  // Load guide data for metadata generation
  const guideData = await getSEOPageData(category, slug);

  return generatePageMetadata('/guides/:category/:slug', {
    params: { category, slug },
    item: guideData || undefined,
    category,
    slug,
  });
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

    // Fetch view count from materialized view
    const guideSlug = `${category}/${slug}`; // e.g., "tutorials/desktop-mcp-setup"
    const supabase = await createClient();
    const { data: analyticsData } = await supabase
      .from('mv_analytics_summary')
      .select('view_count')
      .eq('category', 'guides')
      .eq('slug', guideSlug)
      .maybeSingle();
    const viewCount = analyticsData?.view_count ?? 0;

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
        {/* Read Progress Bar - Shows reading progress at top of page */}
        <ReadProgress />

        <Script id={breadcrumbId} type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(breadcrumbList)}
        </Script>
        <Script id={articleId} type="application/ld+json" strategy="afterInteractive">
          {JSON.stringify(articleData)}
        </Script>
        <div className={'min-h-screen bg-background'}>
          {/* Header - matches content pages */}
          <div className={'border-b border-border/50 bg-card/30'}>
            <div className="container mx-auto px-4 py-8">
              {/* Modern back navigation */}
              <div className="mb-6">
                <Button
                  variant="ghost"
                  size="sm"
                  className="-ml-2 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <Link href={ROUTES.GUIDES}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    All Guides
                  </Link>
                </Button>
              </div>

              <div className="max-w-4xl">
                <div className={'flex items-start gap-4 mb-6'}>
                  <div className={'p-3 bg-accent/10 rounded-lg'}>
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h1 className={'text-3xl font-bold mb-2'}>{data.title}</h1>
                    <p className="text-lg text-muted-foreground">{data.description}</p>
                  </div>
                </div>

                {/* Metadata */}
                <div className={`flex flex-wrap gap-4 ${UI_CLASSES.TEXT_SM_MUTED}`}>
                  <UnifiedBadge variant="base" style="secondary">
                    {category ? categoryLabels[category] || category : 'Guide'}
                  </UnifiedBadge>
                  {data.dateUpdated && (
                    <div className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_1}>
                      <Calendar className="h-4 w-4" />
                      <span>Updated {formatDate(data.dateUpdated)}</span>
                    </div>
                  )}
                  {viewCount > 0 && (
                    <UnifiedBadge
                      variant="base"
                      style="secondary"
                      className="h-7 px-2.5 gap-1.5 bg-primary/10 text-primary border-primary/20 hover:bg-primary/15 transition-colors font-medium"
                    >
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="text-xs">{formatViewCount(viewCount)}</span>
                    </UnifiedBadge>
                  )}
                </div>

                {/* Tags/Keywords */}
                {data.keywords && data.keywords.length > 0 && (
                  <div className={`${UI_CLASSES.FLEX_WRAP_GAP_2} mt-4`}>
                    {data.keywords.map((keyword: string) => (
                      <UnifiedBadge key={keyword} variant="base" style="outline">
                        <Tag className="h-3 w-3 mr-1" />
                        {keyword}
                      </UnifiedBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content with sidebar layout - matches content pages */}
          <SectionProgress position="top" height={3} color="bg-accent">
            <div className="container mx-auto px-4 py-12">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                  <Card>
                    <CardContent className="pt-6">
                      {/* 100% JSON guides - render sections array */}
                      <JSONSectionRenderer sections={data.sections || []} />
                    </CardContent>
                  </Card>

                  {/* Email CTA - End of guide */}
                  <UnifiedNewsletterCapture
                    source="content_page"
                    variant="inline"
                    context="guide-end"
                    category="guides"
                  />
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
          </SectionProgress>

          {/* Track guide views for trending analytics */}
          <UnifiedTracker variant="view" category="guides" slug={guideSlug} />
        </div>
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
