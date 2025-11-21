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
import type { Database } from '@/src/types/database.types';

type RecommendationResponse = Database['public']['Functions']['get_recommendations']['Returns'] & {
  answers: DecodedQuizAnswers;
  id: string;
  generatedAt: string;
};

// Type matching QuizAnswers from quiz-form.tsx
type DecodedQuizAnswers = {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  p_integrations?: Database['public']['Enums']['integration_type'][];
  p_focus_areas?: Database['public']['Enums']['focus_area_type'][];
  teamSize?: string;
  timestamp?: string;
};

function decodeQuizAnswers(encoded: string): DecodedQuizAnswers {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    const parsed = JSON.parse(json);

    // Validate required fields
    if (!parsed.useCase || typeof parsed.useCase !== 'string') {
      throw new Error('Missing or invalid useCase field in quiz answers');
    }
    if (!parsed.experienceLevel || typeof parsed.experienceLevel !== 'string') {
      throw new Error('Missing or invalid experienceLevel field in quiz answers');
    }
    if (!Array.isArray(parsed.toolPreferences)) {
      throw new Error(
        'Missing or invalid toolPreferences field in quiz answers (must be an array)'
      );
    }

    // Validate optional array fields if present
    if (parsed.p_integrations !== undefined && !Array.isArray(parsed.p_integrations)) {
      throw new Error('Invalid p_integrations field in quiz answers (must be an array if present)');
    }
    if (parsed.p_focus_areas !== undefined && !Array.isArray(parsed.p_focus_areas)) {
      throw new Error('Invalid p_focus_areas field in quiz answers (must be an array if present)');
    }

    return parsed as DecodedQuizAnswers;
  } catch (error) {
    const normalized = normalizeError(error, 'Invalid quiz answers encoding');
    logger.error('ConfigRecommenderResults: decodeQuizAnswers failed', normalized, {
      encodedLength: encoded.length,
    });
    throw normalized;
  }
}

function normalizeRecommendationResults(
  results: Database['public']['Functions']['get_recommendations']['Returns']['results']
): Array<
  Database['public']['CompositeTypes']['recommendation_item'] & {
    slug: string;
    title: string;
    category: Database['public']['Enums']['content_category'];
  }
> {
  if (!results) return [];
  const normalized = results.filter(
    (
      item
    ): item is typeof item & {
      slug: string;
      title: string;
      category: Database['public']['Enums']['content_category'];
    } => Boolean(item?.slug && item?.title && item?.category)
  );

  if (normalized.length < results.length) {
    logger.warn('ConfigRecommenderResults: filtered incomplete recommendation items', {
      originalCount: results.length,
      filteredCount: normalized.length,
    });
  }

  return normalized;
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

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

export default async function ResultsPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  if (!resolvedSearchParams.answers) {
    logger.warn('ConfigRecommenderResults: accessed without answers parameter', {
      resultId: resolvedParams.id,
    });
    notFound();
  }

  let answers: DecodedQuizAnswers;
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
    ...(answers.p_integrations && { integrations: answers.p_integrations }),
    ...(answers.p_focus_areas && { focusAreas: answers.p_focus_areas }),
  });

  if (!enrichedResult?.results) {
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

  const recommendations: RecommendationResponse = {
    ...enrichedResult,
    results: normalizeRecommendationResults(enrichedResult.results),
    answers,
    id: resolvedParams.id,
    generatedAt: new Date().toISOString(),
  };

  const shareUrl = `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParams.id}?answers=${resolvedSearchParams.answers}`;

  logger.info('ConfigRecommenderResults: page viewed', {
    resultId: resolvedParams.id,
    useCase: answers.useCase,
    experienceLevel: answers.experienceLevel,
    resultCount: recommendations.results?.length ?? 0,
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12">
        <ResultsDisplay recommendations={recommendations} shareUrl={shareUrl} />
      </section>
    </div>
  );
}
