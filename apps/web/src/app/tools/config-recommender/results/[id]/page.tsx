/**
 * Configuration Recommender Results Page - Database-First Quiz Recommendations
 * Personalized results from PostgreSQL RPC, shareable via URL-encoded answers.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import {
  createWebAppContextWithId,
  generateRequestId,
  logger,
  normalizeError,
  withDuration,
} from '@heyclaude/web-runtime/core';
import { generatePageMetadata, getConfigRecommendations } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { ResultsDisplay } from '@/src/components/features/tools/recommender/results-display';

/**
 * Dynamic Rendering Required
 * Results depend on search params (answers)
 */
export const dynamic = 'force-dynamic';

type RecommendationResponse = Database['public']['Functions']['get_recommendations']['Returns'] & {
  answers: DecodedQuizAnswers;
  id: string;
  generatedAt: string;
};

// Type matching QuizAnswers from quiz-form.tsx
interface DecodedQuizAnswers {
  useCase: Database['public']['Enums']['use_case_type'];
  experienceLevel: Database['public']['Enums']['experience_level'];
  toolPreferences: string[];
  p_integrations?: Database['public']['Enums']['integration_type'][];
  p_focus_areas?: Database['public']['Enums']['focus_area_type'][];
  teamSize?: string;
  timestamp?: string;
}

function decodeQuizAnswers(encoded: string, resultId: string): DecodedQuizAnswers {
  // Note: This is a module-level utility function, so it can't access component-level logContext
  // Generate a new requestId for this utility function (acceptable for utility functions)
  const utilityRequestId = generateRequestId();
  const utilityLogContext = createWebAppContextWithId(
    utilityRequestId,
    `/tools/config-recommender/results/${resultId}`,
    'ConfigRecommenderResultsUtility'
  );

  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as unknown;

    // Type guard to validate the parsed object structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid quiz answers: must be an object');
    }

    const data = parsed as Record<string, unknown>;

    // Validate required fields
    if (!data['useCase'] || typeof data['useCase'] !== 'string') {
      throw new Error('Missing or invalid useCase field in quiz answers');
    }
    if (!data['experienceLevel'] || typeof data['experienceLevel'] !== 'string') {
      throw new Error('Missing or invalid experienceLevel field in quiz answers');
    }
    if (!Array.isArray(data['toolPreferences'])) {
      throw new TypeError(
        'Missing or invalid toolPreferences field in quiz answers (must be an array)'
      );
    }

    // Validate enum values
    if (
      !Constants.public.Enums.use_case_type.includes(
        data['useCase'] as Database['public']['Enums']['use_case_type']
      )
    ) {
      throw new Error(`Invalid useCase value: ${data['useCase']}`);
    }
    if (
      !Constants.public.Enums.experience_level.includes(
        data['experienceLevel'] as Database['public']['Enums']['experience_level']
      )
    ) {
      throw new Error(`Invalid experienceLevel value: ${data['experienceLevel']}`);
    }

    // Validate optional array fields if present
    if (data['p_integrations'] !== undefined && !Array.isArray(data['p_integrations'])) {
      throw new Error('Invalid p_integrations field in quiz answers (must be an array if present)');
    }
    if (data['p_focus_areas'] !== undefined && !Array.isArray(data['p_focus_areas'])) {
      throw new Error('Invalid p_focus_areas field in quiz answers (must be an array if present)');
    }

    // Validate optional array elements against enum values
    if (data['p_integrations'] !== undefined) {
      for (const integration of data['p_integrations'] as unknown[]) {
        if (
          typeof integration !== 'string' ||
          !Constants.public.Enums.integration_type.includes(
            integration as Database['public']['Enums']['integration_type']
          )
        ) {
          throw new Error(`Invalid p_integrations value: ${String(integration)}`);
        }
      }
    }
    if (data['p_focus_areas'] !== undefined) {
      for (const focusArea of data['p_focus_areas'] as unknown[]) {
        if (
          typeof focusArea !== 'string' ||
          !Constants.public.Enums.focus_area_type.includes(
            focusArea as Database['public']['Enums']['focus_area_type']
          )
        ) {
          throw new Error(`Invalid p_focus_areas value: ${String(focusArea)}`);
        }
      }
    }

    return {
      useCase: data['useCase'] as Database['public']['Enums']['use_case_type'],
      experienceLevel: data['experienceLevel'] as Database['public']['Enums']['experience_level'],
      toolPreferences: data['toolPreferences'] as string[],
      ...(data['p_integrations'] && {
        p_integrations: data['p_integrations'] as Database['public']['Enums']['integration_type'][],
      }),
      ...(data['p_focus_areas'] && {
        p_focus_areas: data['p_focus_areas'] as Database['public']['Enums']['focus_area_type'][],
      }),
      ...(data['teamSize'] && typeof data['teamSize'] === 'string' ? { teamSize: data['teamSize'] } : {}),
      ...(data['timestamp'] && typeof data['timestamp'] === 'string' ? { timestamp: data['timestamp'] } : {}),
    } as DecodedQuizAnswers;
  } catch (error) {
    const normalized = normalizeError(error, 'Invalid quiz answers encoding');
    logger.error('ConfigRecommenderResults: decodeQuizAnswers failed', normalized, {
      ...utilityLogContext,
      encodedLength: encoded.length,
    });
    throw normalized;
  }
}

function normalizeRecommendationResults(
  results: Database['public']['Functions']['get_recommendations']['Returns']['results'],
  resultId: string
): Array<
  Database['public']['CompositeTypes']['recommendation_item'] & {
    slug: string;
    title: string;
    category: Database['public']['Enums']['content_category'];
  }
> {
  // Note: This is a module-level utility function, so it can't access component-level logContext
  // Generate a new requestId for this utility function (acceptable for utility functions)
  const utilityRequestId = generateRequestId();
  const utilityLogContext = createWebAppContextWithId(
    utilityRequestId,
    `/tools/config-recommender/results/${resultId}`,
    'ConfigRecommenderResultsUtility'
  );

  if (!results) return [];
  const normalized = results.filter(
    (
      item
    ): item is typeof item & {
      slug: string;
      title: string;
      category: Database['public']['Enums']['content_category'];
    } => Boolean(item.slug && item.title && item.category)
  );

  if (normalized.length < results.length) {
    logger.warn('ConfigRecommenderResults: filtered incomplete recommendation items', undefined, {
      ...utilityLogContext,
      originalCount: results.length,
      filteredCount: normalized.length,
    });
  }

  return normalized;
}

interface PageProperties {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

export async function generateMetadata({ params }: PageProperties): Promise<Metadata> {
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

export default async function ResultsPage({ params, searchParams }: PageProperties) {
  const startTime = Date.now();
  const resolvedParameters = await params;
  const resolvedSearchParameters = await searchParams;

  // Generate single requestId for this page request
  const requestId = generateRequestId();
  const baseLogContext = createWebAppContextWithId(
    requestId,
    `/tools/config-recommender/results/${resolvedParameters.id}`,
    'ConfigRecommenderResults',
    {
      resultId: resolvedParameters.id,
    }
  );

  // Section: Answers Validation
  const validationSectionStart = Date.now();
  if (!resolvedSearchParameters.answers) {
    logger.warn(
      'ConfigRecommenderResults: accessed without answers parameter',
      undefined,
      withDuration(
        {
          ...baseLogContext,
          section: 'answers-validation',
        },
        validationSectionStart
      )
    );
    notFound();
  }

  // Section: Answers Decoding
  const decodingSectionStart = Date.now();
  let answers: DecodedQuizAnswers;
  try {
    answers = decodeQuizAnswers(resolvedSearchParameters.answers, resolvedParameters.id);
    logger.info(
      'ConfigRecommenderResults: answers decoded successfully',
      withDuration(
        {
          ...baseLogContext,
          section: 'answers-decoding',
          useCase: answers.useCase,
          experienceLevel: answers.experienceLevel,
        },
        decodingSectionStart
      )
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to decode quiz answers');
    logger.error(
      'ConfigRecommenderResults: failed to decode quiz answers',
      normalized,
      withDuration(
        {
          ...baseLogContext,
          section: 'answers-decoding',
          sectionDuration_ms: Date.now() - decodingSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  // Section: Recommendations Fetch
  const recommendationsSectionStart = Date.now();
  const enrichedResult = await getConfigRecommendations({
    useCase: answers.useCase,
    experienceLevel: answers.experienceLevel,
    toolPreferences: answers.toolPreferences,
    ...(answers.p_integrations && { integrations: answers.p_integrations }),
    ...(answers.p_focus_areas && { focusAreas: answers.p_focus_areas }),
  });
  logger.info(
    'ConfigRecommenderResults: recommendations fetched',
    withDuration(
      {
        ...baseLogContext,
        section: 'recommendations-fetch',
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
        resultCount: enrichedResult?.results?.length ?? 0,
      },
      recommendationsSectionStart
    )
  );

  if (!enrichedResult?.results) {
    logger.error(
      'ConfigRecommenderResults: get_recommendations returned no data',
      new Error('Recommendations result is null'),
      withDuration(
        {
          ...baseLogContext,
          section: 'recommendations-fetch',
          useCase: answers.useCase,
          sectionDuration_ms: Date.now() - recommendationsSectionStart,
        },
        startTime
      )
    );
    notFound();
  }

  const recommendations: RecommendationResponse = {
    ...enrichedResult,
    results: normalizeRecommendationResults(enrichedResult.results, resolvedParameters.id),
    answers,
    id: resolvedParameters.id,
    generatedAt: new Date().toISOString(),
  };

  const shareUrl = `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParameters.id}?answers=${resolvedSearchParameters.answers}`;

  logger.info(
    'ConfigRecommenderResults: page viewed',
    withDuration(
      {
        ...baseLogContext,
        section: 'page-render',
        useCase: answers.useCase,
        experienceLevel: answers.experienceLevel,
        resultCount: recommendations.results?.length ?? 0,
      },
      startTime
    )
  );

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12">
        <ResultsDisplay recommendations={recommendations} shareUrl={shareUrl} />
      </section>
    </div>
  );
}
