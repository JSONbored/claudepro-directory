import fs from 'fs/promises';
import { ArrowLeft, Tags } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import path from 'path';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import { markdownToSafeHtml } from '@/lib/markdown-utils';

// ISR Configuration - Revalidate every 7 days for SEO pages
export const revalidate = 604800; // 7 days in seconds
export const dynamic = 'force-static'; // Force static generation
export const dynamicParams = true; // Allow new pages to be generated on-demand

import type { ComparisonData } from '@/lib/schemas';

async function getComparisonData(slug: string): Promise<ComparisonData | null> {
  try {
    const filePath = path.join(process.cwd(), 'seo', 'comparisons', `${slug}.mdx`);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!(frontmatterMatch?.[1] && frontmatterMatch?.[2])) return null;

    const frontmatter = frontmatterMatch[1];
    const content = frontmatterMatch[2];

    // Parse YAML-like frontmatter (simple parsing)
    const metadata: Record<string, string> = {};
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

    return {
      title: metadata.title || '',
      description: metadata.description || '',
      content,
      item1Id: metadata.item1Id || '',
      item2Id: metadata.item2Id || '',
      category1: metadata.category1 || '',
      category2: metadata.category2 || '',
      lastUpdated: metadata.lastUpdated || '',
    };
  } catch (_error) {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const metadataPath = path.join(process.cwd(), 'seo', 'comparisons', '_metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    return metadata.map((item: { slug: string }) => ({
      slug: item.slug,
    }));
  } catch (_error) {
    // Return empty array if no comparisons generated yet
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const data = await getComparisonData(resolvedParams.slug);

  if (!data) {
    return {
      title: 'Comparison Not Found',
      description: 'The requested comparison could not be found.',
    };
  }

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'article',
      publishedTime: data.lastUpdated,
      authors: [APP_CONFIG.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
    alternates: {
      canonical: `/compare/${resolvedParams.slug}`,
    },
  };
}

export default async function ComparisonPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const data = await getComparisonData(resolvedParams.slug);

  if (!data) {
    notFound();
  }

  // Securely convert markdown to sanitized HTML
  let htmlContent = '';
  try {
    const result = await markdownToSafeHtml(data.content, {
      parseOptions: {
        gfm: true,
        breaks: false,
      },
      sanitizeOptions: {
        allowedTags: [
          'h1',
          'h2',
          'h3',
          'h4',
          'h5',
          'h6',
          'p',
          'br',
          'hr',
          'ul',
          'ol',
          'li',
          'strong',
          'b',
          'em',
          'i',
          'code',
          'pre',
          'blockquote',
          'a',
          'span',
          'div',
          'table',
          'thead',
          'tbody',
          'tr',
          'th',
          'td',
        ],
        allowedAttributes: ['class', 'href', 'target', 'rel', 'title'],
        enforceNoFollow: true,
        enforceNoOpener: true,
      },
    });
    htmlContent = result.html;

    // Add Tailwind classes to the sanitized HTML for proper styling
    htmlContent = htmlContent
      .replace(/<h1>/g, '<h1 class="text-3xl font-bold mt-8 mb-4">')
      .replace(/<h2>/g, '<h2 class="text-2xl font-semibold mt-6 mb-3">')
      .replace(/<h3>/g, '<h3 class="text-xl font-medium mt-4 mb-2">')
      .replace(/<a /g, '<a class="text-primary hover:underline" ')
      .replace(/<li>/g, '<li class="ml-6 list-disc">')
      .replace(/<table>/g, '<table class="w-full border-collapse my-4">')
      .replace(/<tr>/g, '<tr class="border-b">')
      .replace(/<td>/g, '<td class="p-2">')
      .replace(/<p>/g, '<p class="mb-4">');
  } catch (error) {
    logger.error(
      'Failed to convert markdown to safe HTML',
      error instanceof Error ? error : new Error(String(error)),
      {
        slug: resolvedParams.slug,
        contentLength: data.content.length,
      }
    );
    // Fallback to plain text display
    htmlContent = `<p class="text-muted-foreground">Content could not be displayed safely.</p>`;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/compare" className="hover:text-primary">
            Compare
          </Link>
          <span>/</span>
          <span className="text-primary">{resolvedParams.slug}</span>
        </nav>

        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        </Link>

        {/* Category Badges */}
        <div className="flex gap-2 mb-6">
          <Badge variant="outline">{data.category1}</Badge>
          {data.category1 !== data.category2 && <Badge variant="outline">{data.category2}</Badge>}
          <Badge variant="secondary">Comparison</Badge>
        </div>

        {/* Main Content */}
        <Card className="p-8">
          <article
            className="prose prose-invert max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized using DOMPurify
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </Card>

        {/* Footer CTA */}
        <div className="mt-8 p-6 bg-accent/10 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Explore More Claude Tools</h3>
          <p className="text-muted-foreground mb-4">
            Discover more configurations and tools for Claude AI in our community directory.
          </p>
          <div className="flex gap-3">
            <Link href={`/${data.category1}`}>
              <Button variant="outline" size="sm">
                <Tags className="mr-2 h-4 w-4" />
                Browse {data.category1}
              </Button>
            </Link>
            <Link href="/trending">
              <Button variant="outline" size="sm">
                Trending Tools
              </Button>
            </Link>
            <Link href="/submit">
              <Button size="sm">Submit Your Tool</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
