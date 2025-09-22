import fs from 'fs/promises';
import { ArrowLeft, BookOpen, Calendar, FileText, Tag, Users, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import path from 'path';
import { MDXRenderer } from '@/components/mdx-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UnifiedSidebar } from '@/components/unified-sidebar';
import { parseMDXFrontmatter } from '@/lib/mdx-config';

// ISR Configuration - Revalidate weekly for SEO pages
export const revalidate = 604800; // 7 days
export const dynamic = 'force-static';
export const dynamicParams = true;

interface SEOPageData {
  title: string;
  description: string;
  keywords: string[];
  dateUpdated: string;
  content: string;
}

interface RelatedGuide {
  title: string;
  slug: string;
  category: string;
}

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

  if (!category || !pathMap[category]) return null;

  try {
    const filePath = path.join(process.cwd(), 'seo', pathMap[category], filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter using our MDX parser
    const { frontmatter, content } = parseMDXFrontmatter(fileContent);

    return {
      title: frontmatter.title || '',
      description: frontmatter.description || '',
      keywords: Array.isArray(frontmatter.keywords) ? frontmatter.keywords : [],
      dateUpdated: frontmatter.dateUpdated || '',
      content,
    };
  } catch (_error) {
    return null;
  }
}

async function getRelatedGuides(currentSlug: string[], limit = 3): Promise<RelatedGuide[]> {
  const [currentCategory] = currentSlug;
  if (!currentCategory) return [];

  const currentFilename = currentSlug.slice(1).join('-');
  const relatedGuides: RelatedGuide[] = [];

  try {
    const dir = path.join(process.cwd(), 'seo', currentCategory);
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
}

export async function generateStaticParams() {
  // Generate paths for all SEO pages
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
    try {
      const dir = path.join(process.cwd(), 'seo', category);
      const files = await fs.readdir(dir);

      for (const file of files) {
        if (file.endsWith('.mdx')) {
          const slug = file.replace('.mdx', '');
          paths.push({
            slug: [category, ...slug.split('-')],
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
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
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
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'article',
      publishedTime: data.dateUpdated,
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
  };
}

export default async function SEOGuidePage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
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

  return (
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
                <MDXRenderer source={data.content} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <UnifiedSidebar
            mode="content"
            currentCategory={category || ''}
            contentData={{
              title: data.title,
              description: data.description,
              keywords: data.keywords,
              dateUpdated: data.dateUpdated,
              category: category || '',
              content: data.content,
            }}
            relatedGuides={relatedGuides}
            showSearch={true}
          />
        </div>
      </div>
    </div>
  );
}
