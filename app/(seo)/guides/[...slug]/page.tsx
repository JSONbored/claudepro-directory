import fs from 'fs/promises';
import { ArrowLeft, BookOpen, Calendar, FileText, Tag, Users, Zap } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import path from 'path';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// ISR Configuration - Revalidate weekly for SEO pages
export const revalidate = 604800; // 7 days
export const dynamic = 'force-static';
export const dynamicParams = true;

interface SEOPageData {
  title: string;
  description: string;
  keywords?: string[];
  dateUpdated?: string;
  content: string;
}

interface SEOMetadata {
  title?: string;
  description?: string;
  keywords?: string | string[];
  dateUpdated?: string;
  [key: string]: string | string[] | undefined;
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
  };

  const [category, ...restSlug] = slug;
  const filename = `${restSlug.join('-')}.mdx`;

  if (!pathMap[category]) return null;

  try {
    const filePath = path.join(process.cwd(), 'seo', pathMap[category], filename);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const content = frontmatterMatch[2];

    // Parse metadata
    const metadata: SEOMetadata = {};
    frontmatter.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts
          .join(':')
          .trim()
          .replace(/^["']|["']$/g, '');
        metadata[key.trim()] = value;
      }
    });

    // Parse keywords array
    if (typeof metadata.keywords === 'string') {
      metadata.keywords = metadata.keywords
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map((k) => k.trim().replace(/^["']|["']$/g, ''));
    }

    return {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      dateUpdated: metadata.dateUpdated,
      content,
    };
  } catch (_error) {
    return null;
  }
}

async function getRelatedGuides(currentSlug: string[], limit = 3): Promise<RelatedGuide[]> {
  const [currentCategory] = currentSlug;
  const currentFilename = currentSlug.slice(1).join('-');
  const relatedGuides: RelatedGuide[] = [];

  try {
    const dir = path.join(process.cwd(), 'seo', currentCategory);
    const files = await fs.readdir(dir);

    for (const file of files) {
      if (file.endsWith('.mdx') && !file.includes(currentFilename)) {
        const content = await fs.readFile(path.join(dir, file), 'utf-8');
        const titleMatch = content.match(/title:\s*["']([^"']+)["']/);

        if (titleMatch) {
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
  const categories = ['use-cases', 'tutorials', 'collections', 'categories', 'workflows'];
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
  };

  const categoryIcons: Record<string, typeof Zap> = {
    'use-cases': Zap,
    tutorials: BookOpen,
    collections: Users,
    categories: FileText,
    workflows: Zap,
  };

  const Icon = categoryIcons[category] || BookOpen;
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
              <Badge variant="secondary">{categoryLabels[category]}</Badge>
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
                <MarkdownRenderer content={data.content} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Table of Contents */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">On this page</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.content.match(/^##\s+(.+)$/gm)?.map((heading) => {
                  const title = heading.replace('## ', '');
                  const id = title.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <a
                      key={id}
                      href={`#${id}`}
                      className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {title}
                    </a>
                  );
                })}
              </CardContent>
            </Card>

            {/* Related Guides */}
            {relatedGuides.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Related Guides</CardTitle>
                  <CardDescription>More {categoryLabels[category]} guides</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {relatedGuides.map((guide) => (
                    <Link key={guide.slug} href={guide.slug} className="block group">
                      <div className="text-sm font-medium group-hover:text-primary transition-colors">
                        {guide.title}
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/guides" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse All Guides
                  </Button>
                </Link>
                <Link href="/submit" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Submit Content
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button size="sm" className="w-full">
                    Explore Directory
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Help Card */}
            <Card className="bg-accent/5 border-accent/20">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Need Help?</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="mb-3">Join our community for support and discussions.</p>
                <div className="space-y-2">
                  <a
                    href="https://discord.gg/Ax3Py4YDrq"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    Discord Community →
                  </a>
                  <a
                    href="https://github.com/JSONbored/claudepro-directory"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block"
                  >
                    GitHub Repository →
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
