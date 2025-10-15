/**
 * Configuration Recommender Results Page
 *
 * Displays personalized configuration recommendations based on quiz answers.
 * Supports sharing via URL-encoded answers for social/team collaboration.
 *
 * Features:
 * - Dynamic results based on answer encoding
 * - Shareable URLs
 * - SEO-optimized metadata
 * - OG image generation for social sharing
 *
 * Performance:
 * - ISR with 1-hour revalidation
 * - Edge-compatible
 * - <200ms total page load
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';
import { ResultsDisplay } from '@/src/components/tools/recommender/results-display';
import { statsRedis } from '@/src/lib/cache';
import { REVALIDATION_TIMES } from '@/src/lib/config/rate-limits.config';
import { APP_CONFIG, ROUTES } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generateRecommendations } from '@/src/lib/recommender/algorithm';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { decodeQuizAnswers } from '@/src/lib/schemas/recommender.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { batchFetch } from '@/src/lib/utils/batch.utils';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

// ISR - Static content (centralized config)
export const revalidate = REVALIDATION_TIMES.STATIC_CONTENT;

/**
 * Generate metadata for SEO and social sharing
 * NOINDEX strategy: Result pages are personalized and should not be indexed
 * to avoid thin content issues and infinite URL combinations
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseMetadata = await generatePageMetadata('/tools/config-recommender/results/:id', {
    params: { id },
  });

  return {
    ...baseMetadata,
    robots: {
      index: false,
      follow: true,
    },
  };
}

/**
 * Results page component
 */
export default async function ResultsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Decode quiz answers from URL
  if (!resolvedSearchParams.answers) {
    logger.warn('Results page accessed without answers parameter');
    notFound();
  }

  let answers: ReturnType<typeof decodeQuizAnswers>;
  try {
    answers = decodeQuizAnswers(resolvedSearchParams.answers);
  } catch (error) {
    logger.error(
      'Failed to decode quiz answers',
      error instanceof Error ? error : new Error(String(error))
    );
    notFound();
  }

  try {
    // Load all configurations
    const [
      agentsData,
      mcpData,
      rulesData,
      commandsData,
      hooksData,
      statuslinesData,
      collectionsData,
    ] = await batchFetch([
      lazyContentLoaders.agents(),
      lazyContentLoaders.mcp(),
      lazyContentLoaders.rules(),
      lazyContentLoaders.commands(),
      lazyContentLoaders.hooks(),
      lazyContentLoaders.statuslines(),
      lazyContentLoaders.collections(),
    ]);

    // Combine all configurations with category tags
    const allConfigs: UnifiedContentItem[] = [
      ...(agentsData as UnifiedContentItem[]).map((item) => ({
        ...item,
        category: 'agents' as const,
      })),
      ...(mcpData as UnifiedContentItem[]).map((item) => ({ ...item, category: 'mcp' as const })),
      ...(rulesData as UnifiedContentItem[]).map((item) => ({
        ...item,
        category: 'rules' as const,
      })),
      ...(commandsData as UnifiedContentItem[]).map((item) => ({
        ...item,
        category: 'commands' as const,
      })),
      ...(hooksData as UnifiedContentItem[]).map((item) => ({
        ...item,
        category: 'hooks' as const,
      })),
      ...(statuslinesData as UnifiedContentItem[]).map((item) => ({
        ...item,
        category: 'statuslines' as const,
      })),
      ...(collectionsData as UnifiedContentItem[]).map((item) => ({
        ...item,
        category: 'collections' as const,
      })),
    ];

    // Enrich with view counts from Redis
    const enrichedConfigs = await statsRedis.enrichWithViewCounts(allConfigs);

    // Generate recommendations
    const recommendations = await generateRecommendations(answers, enrichedConfigs);

    // Build shareable URL
    const shareUrl = `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParams.id}?answers=${resolvedSearchParams.answers}`;

    // Log page view
    logger.info('Results page viewed', {
      resultId: resolvedParams.id,
      useCase: answers.useCase,
      experienceLevel: answers.experienceLevel,
      resultCount: recommendations.results.length,
    });

    return (
      <div className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-12">
          <ResultsDisplay recommendations={recommendations} shareUrl={shareUrl} />
        </section>
      </div>
    );
  } catch (error) {
    logger.error(
      'Failed to generate recommendations',
      error instanceof Error ? error : new Error(String(error)),
      {
        resultId: resolvedParams.id,
        useCase: answers.useCase,
      }
    );

    // Show error page
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Failed to Generate Recommendations</h1>
          <p className="text-muted-foreground">
            We encountered an error while generating your recommendations. Please try again.
          </p>
          <a
            href={ROUTES.CONFIG_RECOMMENDER}
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Start Over
          </a>
        </div>
      </div>
    );
  }
}
