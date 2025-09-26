import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { RuleDetailPage } from '@/components/rule-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getRuleBySlug, getRuleFullContent, rules } from '@/generated/content';
import { sortRules } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import { slugParamSchema } from '@/lib/schemas/search.schema';
import { getDisplayTitle } from '@/lib/utils';

interface RulePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RulePageProps): Promise<Metadata> {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.warn('Invalid slug parameter for rule metadata', {
      slug: rawParams.slug,
      errorCount: validationResult.error.issues.length,
      firstError: validationResult.error.issues[0]?.message || 'Unknown error',
    });
    return {
      title: 'Rule Not Found',
      description: 'The requested Claude rule could not be found.',
    };
  }

  const { slug } = validationResult.data;
  const rule = getRuleBySlug(slug);

  if (!rule) {
    return {
      title: 'Rule Not Found',
      description: 'The requested Claude rule could not be found.',
    };
  }

  return {
    title: `${getDisplayTitle(rule)} - Claude Rule | Claude Pro Directory`,
    description: rule.description,
    keywords: rule.tags?.join(', '),
    openGraph: {
      title: getDisplayTitle(rule),
      description: rule.description,
      type: 'article',
    },
  };
}

export async function generateStaticParams() {
  try {
    // Sort rules by popularity/trending for optimized static generation
    // Most popular items will be generated first, improving initial page loads
    const sortedRules = await sortRules([...rules], 'popularity');

    return sortedRules
      .map((rule) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamSchema.safeParse({ slug: rule.slug });

        if (!validation.success) {
          logger.warn('Invalid slug in generateStaticParams for rules', {
            slug: rule.slug,
            error: validation.error.issues[0]?.message || 'Unknown validation error',
          });
          return null;
        }

        return {
          slug: rule.slug,
        };
      })
      .filter(Boolean);
  } catch (error) {
    // Fallback to unsorted if sorting fails
    logger.error(
      'Failed to sort rules for static generation, using default order',
      error instanceof Error ? error : new Error(String(error))
    );

    return rules.map((rule) => ({
      slug: rule.slug,
    }));
  }
}

export default async function RulePage({ params }: RulePageProps) {
  const rawParams = await params;

  // Validate slug parameter
  const validationResult = slugParamSchema.safeParse(rawParams);

  if (!validationResult.success) {
    logger.error(
      'Invalid slug parameter for rule page',
      new Error(validationResult.error.issues[0]?.message || 'Invalid rule slug'),
      {
        slug: rawParams.slug,
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

  const ruleMeta = getRuleBySlug(slug);

  if (!ruleMeta) {
    notFound();
  }

  // Load full content
  const fullRule = await getRuleFullContent(slug);

  const relatedRules = rules
    .filter((r) => r.slug !== ruleMeta.slug && r.category === ruleMeta.category)
    .slice(0, 3);

  return (
    <>
      <ViewTracker category="rules" slug={slug} />
      <RuleDetailPage item={fullRule || ruleMeta} relatedItems={relatedRules} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
