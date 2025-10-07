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
import { ResultsDisplay } from '@/src/components/tools/recommender/results-display';
import type { UnifiedContentItem } from '@/src/lib/schemas/components/content-item.schema';
import { logger } from '@/src/lib/logger';
import { statsRedis } from '@/src/lib/redis';
import { generateRecommendations } from '@/src/lib/recommender/algorithm';
import { decodeQuizAnswers } from '@/src/lib/schemas/recommender.schema';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { APP_CONFIG } from '@/src/lib/constants';
import { lazyContentLoaders } from '@/src/components/shared/lazy-content-loaders';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

// ISR Configuration - Revalidate every hour
export const revalidate = 3600;

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  try {
    const answers = resolvedSearchParams.answers
      ? decodeQuizAnswers(resolvedSearchParams.answers)
      : null;

    if (!answers) {
      return {
        title: 'Configuration Recommendations',
        description: 'Your personalized Claude configuration recommendations',
      };
    }

    const useCase = answers.useCase.replace('-', ' ');
    const title = `${useCase} - Your Claude Config Recommendations`;
    const description = `Discover personalized Claude configurations for ${useCase}. Get ${answers.experienceLevel}-friendly recommendations from 147+ configs.`;

    // Use centralized metadata generator as base
    const baseMetadata = await generatePageMetadata('/tools/config-recommender/results/:id', {
      params: { id: resolvedParams.id },
      item: {
        title,
        description,
        dateAdded: new Date().toISOString(),
        author: APP_CONFIG.author,
      },
    });

    return {
      ...baseMetadata,
      title,
      description,
      openGraph: {
        ...baseMetadata.openGraph,
        title,
        description,
        type: 'website',
        url: `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParams.id}`,
      },
      twitter: {
        ...baseMetadata.twitter,
        title,
        description,
      },
    };
  } catch (error) {
    logger.error(
      'Failed to generate metadata for results page',
      error instanceof Error ? error : new Error(String(error))
    );
    return {
      title: 'Configuration Recommendations',
      description: 'Your personalized Claude configuration recommendations',
    };
  }
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

  let answers;
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
    ] = await Promise.all([
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
      ...agentsData.map((item: Record<string, unknown>) => ({ ...item, category: 'agents' as const })),
      ...mcpData.map((item: Record<string, unknown>) => ({ ...item, category: 'mcp' as const })),
      ...rulesData.map((item: Record<string, unknown>) => ({ ...item, category: 'rules' as const })),
      ...commandsData.map((item: Record<string, unknown>) => ({ ...item, category: 'commands' as const })),
      ...hooksData.map((item: Record<string, unknown>) => ({ ...item, category: 'hooks' as const })),
      ...statuslinesData.map((item: Record<string, unknown>) => ({ ...item, category: 'statuslines' as const })),
      ...collectionsData.map((item: Record<string, unknown>) => ({ ...item, category: 'collections' as const })),
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
            href="/tools/config-recommender"
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Start Over
          </a>
        </div>
      </div>
    );
  }
}
