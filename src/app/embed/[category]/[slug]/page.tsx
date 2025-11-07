/**
 * Embed Page - Minimal iframe-embeddable code widget
 *
 * Designed for embedding on external sites via iframe
 * - Minimal UI (no navigation, footer)
 * - Watermark/backlink to claudepro.directory
 * - Theme-aware (respects parent page theme)
 * - UTM tracking for viral attribution
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CodeBlockServer } from '@/src/components/shared/code-block-server';
import { isValidCategory } from '@/src/lib/config/category-config';
import { APP_CONFIG } from '@/src/lib/constants';
import { ExternalLink } from '@/src/lib/icons';
import { createAnonClient } from '@/src/lib/supabase/server-anon';

interface EmbedPageProps {
  params: Promise<{ category: string; slug: string }>;
  searchParams: Promise<{ theme?: string; border?: string; code?: string; utm_source?: string }>;
}

export async function generateMetadata({ params }: EmbedPageProps): Promise<Metadata> {
  const { category, slug } = await params;

  return {
    title: `${slug} - ${category} | ClaudePro Directory`,
    robots: {
      index: false, // Don't index embed pages
      follow: false,
    },
  };
}

export const revalidate = false;

async function getContentData(category: string, slug: string) {
  const supabase = createAnonClient();

  const { data, error } = await supabase
    .from('content')
    .select('title, description, examples, metadata, author, tags')
    .eq('category', category)
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function EmbedPage({ params, searchParams }: EmbedPageProps) {
  const { category, slug } = await params;
  const { theme = 'auto', border = 'true', utm_source = 'embed_widget' } = await searchParams;

  if (!isValidCategory(category)) {
    notFound();
  }

  const content = await getContentData(category, slug);

  if (!content) {
    notFound();
  }

  // Extract first code example
  const examples = Array.isArray(content.examples) ? content.examples : [];
  const firstExample = examples[0] as
    | { code?: string; language?: string; filename?: string }
    | undefined;
  const metadata = content.metadata as Record<string, unknown> | null;
  const installation = metadata?.installation as Record<string, unknown> | undefined;
  const configuration = metadata?.configuration as string | undefined;
  const claudeCode = installation?.claudeCode as { steps?: string[] } | undefined;
  const codeToDisplay = firstExample?.code || configuration || claudeCode?.steps?.[0];

  if (!codeToDisplay) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">No code example available</p>
          <EmbedBacklink category={category} slug={slug} utmSource={utm_source} author={null} />
        </div>
      </div>
    );
  }

  const showBorder = border === 'true';

  return (
    <div
      className="min-h-screen bg-background p-4"
      data-theme={theme}
      style={{
        colorScheme: theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'light dark',
      }}
    >
      <div
        className={`mx-auto max-w-4xl space-y-4 ${showBorder ? 'rounded-lg border border-border p-4' : ''}`}
      >
        {/* Title and description */}
        <div className="space-y-2">
          <h1 className="font-bold text-xl">{content.title}</h1>
          {content.description && (
            <p className="line-clamp-2 text-muted-foreground text-sm">{content.description}</p>
          )}
        </div>

        {/* Code block */}
        <CodeBlockServer
          code={codeToDisplay}
          language={firstExample?.language || 'bash'}
          filename={firstExample?.filename || `${slug}.sh`}
          maxLines={30}
        />

        {/* Tags */}
        {content.tags && content.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {content.tags.slice(0, 5).map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-primary/10 bg-primary/5 px-2 py-1 text-primary/80 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Watermark/backlink */}
        <EmbedBacklink
          category={category}
          slug={slug}
          utmSource={utm_source}
          author={content.author}
        />
      </div>
    </div>
  );
}

function EmbedBacklink({
  category,
  slug,
  utmSource,
  author,
}: {
  category: string;
  slug: string;
  utmSource: string;
  author: string | null;
}) {
  const backlink = `${APP_CONFIG.url}/${category}/${slug}?utm_source=${utmSource}&utm_medium=embed&utm_campaign=widget_sharing`;

  return (
    <div className="flex items-center justify-between border-border border-t pt-4">
      <a
        href={backlink}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-2 text-muted-foreground text-xs transition-colors hover:text-primary"
      >
        <span className="font-medium">View on claudepro.directory</span>
        <ExternalLink className="group-hover:-translate-y-0.5 h-3 w-3 transition-transform group-hover:translate-x-0.5" />
      </a>
      <span className="text-muted-foreground text-xs">by {author || 'Community'}</span>
    </div>
  );
}
