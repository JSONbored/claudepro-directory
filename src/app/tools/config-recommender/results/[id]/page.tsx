/**
 * Configuration Recommender Results Page - Database-First Quiz Recommendations
 * Personalized results from PostgreSQL RPC, shareable via URL-encoded answers.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsDisplay } from '@/src/components/features/tools/recommender/results-display';
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { cachedRPCWithDedupe } from '@/src/lib/supabase/cached-rpc';
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
    logger.error('ConfigRecommenderResults: failed to decode quiz answers', error, {
      resultId: resolvedParams.id,
    });
    notFound();
  }

  type RecommendationsResult = {
    results: Array<{
      slug: string;
      title: string;
      description: string;
      category: string;
      tags: string[];
      author: string;
      match_score: number;
      match_percentage: number;
      primary_reason: string;
      rank: number;
      reasons: Array<{ type: string; message: string }>;
    }>;
    totalMatches: number;
    algorithm: string;
    summary: {
      topCategory: string;
      avgMatchScore: number;
      diversityScore: number;
      topTags: string[];
    };
  };

  const rpcParams = {
    p_use_case: answers.useCase,
    p_experience_level: answers.experienceLevel,
    p_tool_preferences: answers.toolPreferences,
    p_integrations: answers.integrations || [],
    p_focus_areas: answers.focusAreas || [],
    p_limit: 20,
  };

  let enrichedResult: RecommendationsResult | null = null;
  try {
    enrichedResult = await cachedRPCWithDedupe<RecommendationsResult>(
      'get_recommendations',
      rpcParams,
      {
        tags: ['content', 'quiz'],
        ttlConfigKey: 'cache.quiz.ttl_seconds',
        keySuffix: `${answers.useCase}-${answers.experienceLevel}-${answers.toolPreferences.join('-')}`,
        useAuthClient: true,
      }
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to fetch configuration recommendations');
    logger.error('ConfigRecommenderResults: get_recommendations threw', normalized, {
      resultId: resolvedParams.id,
      useCase: answers.useCase,
    });
    throw normalized;
  }

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
