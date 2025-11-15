/**
 * Configuration Recommender Results Page - Database-First Quiz Recommendations
 * Personalized results from PostgreSQL RPC, shareable via URL-encoded answers.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsDisplay } from '@/src/components/features/tools/recommender/results-display';
import { APP_CONFIG } from '@/src/lib/data/config/constants';
import { getConfigRecommendations } from '@/src/lib/data/tools/recommendations';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { normalizeError } from '@/src/lib/utils/error.utils';

function decodeQuizAnswers(encoded: string) {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch (error) {
    const normalized = normalizeError(error, 'Invalid quiz answers encoding');
    logger.error('ConfigRecommenderResults: decodeQuizAnswers failed', normalized, {
      encodedLength: encoded.length,
    });
    throw normalized;
  }
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const baseMetadata = generatePageMetadata('/tools/config-recommender/results/:id', {
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

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  if (!resolvedSearchParams.answers) {
    logger.warn('ConfigRecommenderResults: accessed without answers parameter', {
      resultId: resolvedParams.id,
    });
    notFound();
  }

  let answers: ReturnType<typeof decodeQuizAnswers>;
  try {
    answers = decodeQuizAnswers(resolvedSearchParams.answers);
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to decode quiz answers');
    logger.error('ConfigRecommenderResults: failed to decode quiz answers', normalized, {
      resultId: resolvedParams.id,
    });
    notFound();
  }

  const enrichedResult = await getConfigRecommendations({
    useCase: answers.useCase,
    experienceLevel: answers.experienceLevel,
    toolPreferences: answers.toolPreferences,
    integrations: answers.integrations,
    focusAreas: answers.focusAreas,
  });

  if (!enrichedResult) {
    logger.error(
      'ConfigRecommenderResults: get_recommendations returned no data',
      new Error('Recommendations result is null'),
      {
        resultId: resolvedParams.id,
        useCase: answers.useCase,
      }
    );
    notFound();
  }

  const recommendations = {
    ...enrichedResult,
    answers,
    id: resolvedParams.id,
    generatedAt: new Date().toISOString(),
  };

  const shareUrl = `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParams.id}?answers=${resolvedSearchParams.answers}`;

  logger.info('ConfigRecommenderResults: page viewed', {
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
}
