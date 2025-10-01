import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UnifiedStructuredData } from '@/components/structured-data/unified-structured-data';
import { UnifiedDetailPage } from '@/components/unified-detail-page';
import { ViewTracker } from '@/components/view-tracker';
import { getRuleBySlug, getRuleFullContent, rules } from '@/generated/content';
import { APP_CONFIG } from '@/lib/constants';
import { sortContent } from '@/lib/content-sorting';
import { logger } from '@/lib/logger';
import type { PageProps } from '@/lib/schemas/app.schema';
import { slugParamsSchema } from '@/lib/schemas/app.schema';
import { ruleContentSchema } from '@/lib/schemas/content';
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
  const rule = await getRuleBySlug(slug);

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

export async function generateStaticParams() {
  try {
    // Sort rules by popularity/trending for optimized static generation
    // Most popular items will be generated first, improving initial page loads
    const rulesData = await rules;
    const sortedRules = await sortContent([...rulesData], 'rules', 'popularity');

    return sortedRules
      .map((rule) => {
        // Validate slug using existing schema before static generation
        const validation = slugParamsSchema.safeParse({ slug: rule.slug });

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

    const rulesData = await rules;
    return rulesData.map((rule) => ({
      slug: rule.slug,
    }));
  }
}

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

  const ruleMeta = await getRuleBySlug(slug);

  if (!ruleMeta) {
    notFound();
  }

  // Load full content
  const fullRule = await getRuleFullContent(slug);

  const rulesData = await rules;
  const relatedRules = rulesData
    .filter((r) => r.slug !== ruleMeta.slug && r.category === ruleMeta.category)
    .slice(0, 3);

  const rule = ruleContentSchema.parse(fullRule || ruleMeta);
  const relatedRulesParsed = relatedRules.map((r) => ruleContentSchema.parse(r));

  return (
    <>
      <ViewTracker category="rules" slug={slug} />
      <UnifiedStructuredData item={{ ...rule, category: 'rules' as const }} />
      <UnifiedDetailPage item={rule} relatedItems={relatedRulesParsed} />
    </>
  );
}
// Enable ISR - revalidate every hour
export const revalidate = 14400;
