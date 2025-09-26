import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HookDetailPage } from '@/components/hook-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getHookBySlug, getHookFullContent, hooks } from '@/generated/content';
import { logger } from '@/lib/logger';
import { slugParamSchema } from '@/lib/schemas/search.schema';
import { getDisplayTitle } from '@/lib/utils';

interface HookPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: HookPageProps): Promise<Metadata> {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for hook metadata', {
      slug: rawParams.slug,
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Hook Not Found',
      description: 'The requested automation hook could not be found.',
    };
  }

  const { slug } = validationResult.data;
  const hook = getHookBySlug(slug);

  if (!hook) {
    return {
      title: 'Hook Not Found',
      description: 'The requested automation hook could not be found.',
    };
  }

  return {
    title: `${getDisplayTitle(hook)} - Automation Hook | Claude Pro Directory`,
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
  return hooks.map((hook) => ({
    slug: hook.slug,
  }));
}

export default async function HookPage({ params }: HookPageProps) {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for hook page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid slug'),
      {
        slug: rawParams.slug,
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

  const hookMeta = getHookBySlug(slug);

  if (!hookMeta) {
    notFound();
  }

  // Load full content
  const fullHook = await getHookFullContent(slug);

  const relatedHooks = hooks
    .filter((h) => h.slug !== hookMeta.slug && h.category === hookMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="hooks" slug={slug} />
      <HookDetailPage item={fullHook || hookMeta} relatedItems={relatedHooks} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
