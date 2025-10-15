import fs from 'fs/promises';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import path from 'path';
import { Badge } from '@/src/components/ui/badge';
import { Button } from '@/src/components/ui/button';
import { Card } from '@/src/components/ui/card';
import { ROUTES } from '@/src/lib/constants';
import { markdownToSafeHtml } from '@/src/lib/content/markdown-utils';
import { ArrowLeft, Tags } from '@/src/lib/icons';
import { logger } from '@/src/lib/logger';
import type { ComparisonData } from '@/src/lib/schemas/app.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// ISR Configuration - Revalidate every 7 days for SEO pages
export const dynamic = 'force-static'; // Force static generation
export const dynamicParams = true; // Allow new pages to be generated on-demand

async function getComparisonData(slug: string): Promise<ComparisonData | null> {
  try {
    const filePath = path.join(process.cwd(), 'content', 'guides', 'comparisons', `${slug}.mdx`);
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
    const metadataPath = path.join(
      process.cwd(),
      'content',
      'guides',
      'comparisons',
      '_metadata.json'
    );
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
  const { slug } = await params;

  // Load comparison data for metadata generation
  const comparisonData = await getComparisonData(slug);

  return generatePageMetadata('/compare/:slug', {
    params: { slug },
    item: comparisonData || undefined,
    slug,
  });
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
      .replace(/<h1>/g, `<h1 class="text-3xl font-bold ${UI_CLASSES.MT_8} mb-4">`)
      .replace(/<h2>/g, `<h2 class="text-2xl font-semibold ${UI_CLASSES.MT_6} mb-3">`)
      .replace(/<h3>/g, `<h3 class="text-xl font-medium ${UI_CLASSES.MT_4} mb-2">`)
      .replace(/<a /g, '<a class="text-primary hover:underline" ')
      .replace(/<li>/g, '<li class="ml-6 list-disc">')
      .replace(/<table>/g, '<table class="w-full border-collapse my-4">')
      .replace(/<tr>/g, '<tr class="border-b">')
      .replace(/<td>/g, `<td class="${UI_CLASSES.P_2}">`)
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
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      <div className={`container mx-auto px-4 py-8 ${UI_CLASSES.MAX_W_4XL}`}>
        {/* Breadcrumb */}
        <nav
          className={`flex items-center space-x-2 text-sm text-muted-foreground ${UI_CLASSES.MB_6}`}
        >
          <Link href={ROUTES.HOME} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
            Home
          </Link>
          <span>/</span>
          <Link href={ROUTES.COMPARE} className={UI_CLASSES.HOVER_TEXT_PRIMARY}>
            Compare
          </Link>
          <span>/</span>
          <span className="text-primary">{resolvedParams.slug}</span>
        </nav>

        {/* Back Button */}
        <Link href={ROUTES.HOME}>
          <Button variant="ghost" size="sm" className={UI_CLASSES.MB_6}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>
        </Link>

        {/* Category Badges */}
        <div className={`flex gap-2 ${UI_CLASSES.MB_6}`}>
          <Badge variant="outline">{data.category1}</Badge>
          {data.category1 !== data.category2 && <Badge variant="outline">{data.category2}</Badge>}
          <Badge variant="secondary">Comparison</Badge>
        </div>

        {/* Main Content */}
        <Card className={UI_CLASSES.P_8}>
          <article
            className="prose prose-invert max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is sanitized using DOMPurify
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </Card>

        {/* Footer CTA */}
        <div
          className={`${UI_CLASSES.MT_8} ${UI_CLASSES.P_6} ${UI_CLASSES.BG_ACCENT_10} rounded-lg`}
        >
          <h3 className={`text-lg font-semibold ${UI_CLASSES.MB_2}`}>Explore More Claude Tools</h3>
          <p className="text-muted-foreground mb-4">
            Discover more configurations and tools for Claude AI in our community directory.
          </p>
          <div className={UI_CLASSES.FLEX_GAP_3}>
            <Link href={`/${data.category1}`}>
              <Button variant="outline" size="sm">
                <Tags className="mr-2 h-4 w-4" />
                Browse {data.category1}
              </Button>
            </Link>
            <Link href={ROUTES.TRENDING}>
              <Button variant="outline" size="sm">
                Trending Tools
              </Button>
            </Link>
            <Link href={ROUTES.SUBMIT}>
              <Button size="sm">Submit Your Tool</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
