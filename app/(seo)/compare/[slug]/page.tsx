import fs from 'fs/promises';
import { ArrowLeft, Tags } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import path from 'path';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ISR Configuration - Revalidate every 7 days for SEO pages
export const revalidate = 604800; // 7 days in seconds
export const dynamic = 'force-static'; // Force static generation
export const dynamicParams = true; // Allow new pages to be generated on-demand

interface ComparisonData {
  title: string;
  description: string;
  content: string;
  item1Id: string;
  item2Id: string;
  category1: string;
  category2: string;
  lastUpdated: string;
}

async function getComparisonData(slug: string): Promise<ComparisonData | null> {
  try {
    const filePath = path.join(process.cwd(), 'seo', 'comparisons', `${slug}.mdx`);
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) return null;

    const frontmatter = frontmatterMatch[1];
    const content = frontmatterMatch[2];

    // Parse YAML-like frontmatter (simple parsing)
    const metadata: any = {};
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
      title: metadata.title,
      description: metadata.description,
      content,
      item1Id: metadata.item1Id,
      item2Id: metadata.item2Id,
      category1: metadata.category1,
      category2: metadata.category2,
      lastUpdated: metadata.lastUpdated,
    };
  } catch (_error) {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const metadataPath = path.join(process.cwd(), 'seo', 'comparisons', '_metadata.json');
    const metadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    return metadata.map((item: any) => ({
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
  params: { slug: string };
}): Promise<Metadata> {
  const data = await getComparisonData(params.slug);

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
      authors: ['Claude Pro Directory'],
    },
    twitter: {
      card: 'summary_large_image',
      title: data.title,
      description: data.description,
    },
    alternates: {
      canonical: `/compare/${params.slug}`,
    },
  };
}

export default async function ComparisonPage({ params }: { params: { slug: string } }) {
  const data = await getComparisonData(params.slug);

  if (!data) {
    notFound();
  }

  // Convert markdown to HTML (simple conversion for now)
  const htmlContent = data.content
    .replace(/^# (.*?)$/gm, '<h1 class="text-3xl font-bold mt-8 mb-4">$1</h1>')
    .replace(/^## (.*?)$/gm, '<h2 class="text-2xl font-semibold mt-6 mb-3">$1</h2>')
    .replace(/^### (.*?)$/gm, '<h3 class="text-xl font-medium mt-4 mb-2">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>')
    .replace(/^- (.*?)$/gm, '<li class="ml-6 list-disc">$1</li>')
    .replace(/\|([^|]+)\|([^|]+)\|([^|]+)\|/g, (_match, col1, col2, col3) => {
      return `<tr class="border-b"><td class="p-2">${col1.trim()}</td><td class="p-2">${col2.trim()}</td><td class="p-2">${col3.trim()}</td></tr>`;
    })
    .replace(/<tr class="border-b"><td class="p-2">-+<\/td>/g, '') // Remove separator rows
    .replace(/(<tr[\s\S]*?<\/tr>)/g, '<table class="w-full border-collapse my-4">$1</table>')
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, '</p>');

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
          <span className="text-primary">{params.slug}</span>
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
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is generated internally, not user input
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
