import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RuleDetailPage } from '@/components/rule-detail-page';
import { RuleStructuredData } from '@/components/structured-data/rule-schema';
import { ViewTracker } from '@/components/view-tracker';
import { APP_CONFIG } from '@/lib/constants';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { ruleContentSchema } from '@/lib/schemas/content.schema';
import { contentCache } from '@/lib/services/content-cache.service';
import { contentProcessor } from '@/lib/services/content-processor.service';
import { getDisplayTitle } from '@/lib/utils';

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  if (!params) {
    return {
      title: 'Rule Not Found',
      description: 'The requested Claude rule could not be found.',
    };
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for rule metadata', {
      slug: String(rawParams.slug),
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Rule Not Found',
      description: 'The requested Claude rule could not be found.',
    };
  }

  const { slug } = validationResult.data;

  // Get rule metadata from content processor
  const rule = await contentProcessor.getContentItemBySlug('rules', slug);

  if (!rule) {
    return {
      title: 'Rule Not Found',
      description: 'The requested Claude rule could not be found.',
    };
  }

  return {
    title: `${getDisplayTitle(rule)} - Claude Rule | ${APP_CONFIG.name}`,
    description: rule.description,
    keywords: rule.tags?.join(', '),
    openGraph: {
      title: getDisplayTitle(rule),
      description: rule.description,
      type: 'article',
    },
  };
}

// Note: generateStaticParams removed to enable Edge Runtime
// Pages will be generated on-demand with ISR (4-hour revalidation)

export default async function RulePage({ params }: PageProps) {
  if (!params) {
    notFound();
  }

  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamsSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for rule page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid rule slug'),
      {
        slug: String(rawParams.slug),
        errorCount: validationResult.error.issues.length,
      }
    );
    notFound();
  }

  const { slug } = validationResult.data;

  logger.info('Rule page accessed', {
    slug: slug,
    validated: true,
  });

  // Try cache first for metadata
  let ruleMeta = await contentCache.getContentItemBySlug('rules', slug);

  if (!ruleMeta) {
    // Fetch from GitHub API if not cached
    ruleMeta = await contentProcessor.getContentItemBySlug('rules', slug);

    if (!ruleMeta) {
      notFound();
    }

    // Cache the metadata
    await contentCache.setContentItemBySlug('rules', slug, ruleMeta);
  }

  // Load full content from GitHub
  const fullContent = await contentProcessor.getFullContentBySlug('rules', slug);
  const ruleData = fullContent || ruleMeta;

  // Get all rules for related items
  let allRules = await contentCache.getContentByCategory('rules');

  if (!allRules) {
    allRules = await contentProcessor.getContentByCategory('rules');
    if (allRules) {
      await contentCache.setContentByCategory('rules', allRules);
    }
  }

  const relatedRules = (allRules || [])
    .filter((r) => r.slug !== slug && r.category === ruleMeta.category)
    .slice(0, 3);

  const rule = ruleContentSchema.parse(ruleData);
  const relatedRulesParsed = relatedRules.map((r) => ruleContentSchema.parse(r));

  return (
    <>
      <ViewTracker category="rules" slug={slug} />
      <RuleStructuredData item={rule} />
      <RuleDetailPage item={rule} relatedItems={relatedRulesParsed} />
    </>
  );
}
// Enable ISR - revalidate every 4 hours
export const revalidate = 14400;

// Use Edge Runtime for better performance
export const runtime = 'edge';
