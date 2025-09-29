import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HookDetailPage } from '@/components/hook-detail-page';
import { HookStructuredData } from '@/components/structured-data/hook-schema';
import { ViewTracker } from '@/components/view-tracker';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { hookContentSchema } from '@/lib/schemas/content.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { getDisplayTitle } from '@/lib/utils';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!params) {
    return {
      title: 'Hook Not Found',
      description: 'The requested automation hook could not be found.',
    };
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for hook metadata', {
      slug: String(rawParams.slug),
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Hook Not Found',
      description: 'The requested automation hook could not be found.',
    };
  }

  const { slug } = validationResult.data;

  // Get hook metadata from content processor
  const hook = await contentProcessor.getContentItemBySlug('hooks', slug);

  if (!hook) {
    return {
      title: 'Hook Not Found',
      description: 'The requested automation hook could not be found.',
    };
  }

  return {
    title: `${getDisplayTitle(hook)} - Automation Hook | ${APP_CONFIG.name}`,
    description: hook.description,
    keywords: hook.tags?.join(', '),
    openGraph: {
      title: getDisplayTitle(hook),
      description: hook.description,
      type: 'article',
    },
  };
}

// Note: generateStaticParams removed to enable Edge Runtime
// Pages will be generated on-demand with ISR (4-hour revalidation)

export default async function HookPage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for hook page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: String(rawParams.slug),
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;

  logger.info('Hook page accessed', {
    slug: slug,
    validated: true,
  });

  // Try cache first for metadata
  let hookMeta = await contentCache.getContentItemBySlug('hooks', slug);

  if (!hookMeta) {
    // Fetch from GitHub API if not cached
    hookMeta = await contentProcessor.getContentItemBySlug('hooks', slug);

    if (!hookMeta) {
      notFound();
    }

    // Cache the metadata
    await contentCache.setContentItemBySlug('hooks', slug, hookMeta);
  }

  // Load full content from GitHub
  const fullContent = await contentProcessor.getFullContentBySlug('hooks', slug);
  const hookData = fullContent || hookMeta;

  // Get all hooks for related items
  let allHooks = await contentCache.getContentByCategory('hooks');

  if (!allHooks) {
    allHooks = await contentProcessor.getContentByCategory('hooks');
    if (allHooks) {
      await contentCache.setContentByCategory('hooks', allHooks);
    }
  }

  const relatedHooksData = (allHooks || [])
    .filter((h) => h.slug !== slug && h.category === hookMeta.category)
    .slice(0, 3);

  // Parse through Zod to ensure type safety - this will add defaults for missing fields
  const hook = hookContentSchema.parse(hookData);
  const relatedHooks = relatedHooksData.map((h) => hookContentSchema.parse(h));

  return (
    <>
      <ViewTracker category="hooks" slug={slug} />
      <HookStructuredData item={hook} />
      <HookDetailPage item={hook} relatedItems={relatedHooks} />
    </>
  );
}
// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance
// Use Node.js runtime for GitHub API and Redis compatibility
