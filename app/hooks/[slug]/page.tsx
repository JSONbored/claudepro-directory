import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UnifiedStructuredData } from '@/components/structured-data/unified-structured-data';
import { UnifiedDetailPage } from '@/components/unified-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getHookBySlug, getHookFullContent, hooks } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';
import { sortContent } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas';
import { slugParamsSchema } from '@/lib/schemas';
import { hookContentSchema } from '@/lib/schemas/content';
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
  const hook = await getHookBySlug(slug);

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

export async function generateStaticParams() {
  try {
    // Sort hooks by popularity/trending for optimized static generation
    // Most popular items will be generated first, improving initial page loads
    const hooksData = await hooks;
    const sortedHooks = await sortContent([...hooksData], 'hooks', 'popularity');

    return sortedHooks
      .map((hook) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamsSchema.safeParse({ slug: hook.slug });

        if (!validation.success) {
          logger.warn('Invalid slug in generateStaticParams for hooks', {
            slug: hook.slug,
            error: validation.error.issues[0]?.message || 'Unknown validation error',
          });
          return null;
        }

        return {
          slug: hook.slug,
        };
      })
      .filter(Boolean);
  } catch (error) {
    // Fallback to unsorted if sorting fails
    logger.error(
      'Failed to sort hooks for static generation, using default order',
      error instanceof Error ? error : new Error(String(error))
    );

    const hooksData = await hooks;
    return hooksData.map((hook) => ({
      slug: hook.slug,
    }));
  }
}

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

  const hookMeta = await getHookBySlug(slug);

  if (!hookMeta) {
    notFound();
  }

  // Load full content
  const fullHook = await getHookFullContent(slug);

  const hooksData = await hooks;
  const relatedHooksData = hooksData
    .filter((h) => h.slug !== hookMeta.slug && h.category === hookMeta.category)
    .slice(0, 3);

  // Create a properly typed hook that conforms to HookContent schema
  // Use fullHook if available, otherwise use metadata with safe defaults
  const hookData = fullHook || hookMeta;

  // Parse through Zod to ensure type safety - this will add defaults for missing fields
  const hook = hookContentSchema.parse(hookData);
  const relatedHooks = relatedHooksData.map((h) => hookContentSchema.parse(h));

  return (
    <>
      <ViewTracker category="hooks" slug={slug} />
      <UnifiedStructuredData item={{ ...hook, category: 'hooks' as const }} />
      <UnifiedDetailPage item={hook} relatedItems={relatedHooks} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
