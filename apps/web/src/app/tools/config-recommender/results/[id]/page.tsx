/**
 * Configuration Recommender Results Page - Database-First Quiz Recommendations
 * Personalized results from PostgreSQL RPC, shareable via URL-encoded answers.
 */

import { Constants, type Database } from '@heyclaude/database-types';
import { generatePageMetadata, getConfigRecommendations } from '@heyclaude/web-runtime/data';
import { APP_CONFIG } from '@heyclaude/web-runtime/data/config/constants';
import { logger, normalizeError } from '@heyclaude/web-runtime/logging/server';
import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connection } from 'next/server';
import { Suspense } from 'react';

import { ResultsDisplay } from '@/src/components/features/tools/recommender/results-display';

import ResultsLoading from './loading';

/**
 * Dynamic Rendering Required
 * Results depend on search params (answers)
 */

type RecommendationResponse = Database['public']['Functions']['get_recommendations']['Returns'] & {
  answers: DecodedQuizAnswers;
  generatedAt: string;
  id: string;
};

// Type matching QuizAnswers from quiz-form.tsx
interface DecodedQuizAnswers {
  experienceLevel: Database['public']['Enums']['experience_level'];
  p_focus_areas?: Array<Database['public']['Enums']['focus_area_type']>;
  p_integrations?: Array<Database['public']['Enums']['integration_type']>;
  teamSize?: string;
  timestamp?: string;
  toolPreferences: string[];
  useCase: Database['public']['Enums']['use_case_type'];
}

/*****
 * Decode and validate a base64url-encoded JSON string of quiz answers into a typed DecodedQuizAnswers object.
 *
 * @param {string} encoded - The base64url-encoded JSON payload containing quiz answers.
 * @param {string} resultId - Identifier used to annotate logs when decoding fails.
 * @param {ReturnType<typeof logger.child>} parentLogger
 * @returns The decoded answers containing required fields `useCase`, `experienceLevel`, and `toolPreferences`, and optionally `p_integrations`, `p_focus_areas`, `teamSize`, and `timestamp`.
 * @throws An error normalized by `normalizeError` when the input cannot be decoded or fails validation.
 *
 * @see Constants
 * @see normalizeError
 * @see logger
 */
function decodeQuizAnswers(
  encoded: string,
  resultId: string,
  parentLogger?: ReturnType<typeof logger.child>
): DecodedQuizAnswers {
  // Use parent logger if provided, otherwise create a child logger
  const utilityLogger = parentLogger
    ? parentLogger.child({
        operation: 'decodeQuizAnswers',
      })
    : logger.child({
        module: 'apps/web/src/app/tools/config-recommender/results/[id]',
        operation: 'decodeQuizAnswers',
        route: 'utility-function',
      });

  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf8');
    const parsed = JSON.parse(json);

    // Type guard to validate the parsed object structure
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Invalid quiz answers: must be an object');
    }

    const data = parsed as Record<string, unknown>;

    // Validate required fields
    if (typeof data['useCase'] !== 'string' || data['useCase'] === '') {
      throw new Error('Missing or invalid useCase field in quiz answers');
    }
    if (typeof data['experienceLevel'] !== 'string' || data['experienceLevel'] === '') {
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
      experienceLevel: data['experienceLevel'] as Database['public']['Enums']['experience_level'],
      toolPreferences: data['toolPreferences'] as string[],
      useCase: data['useCase'] as Database['public']['Enums']['use_case_type'],
      ...(Array.isArray(data['p_integrations']) &&
        data['p_integrations'].length > 0 && {
          p_integrations: data['p_integrations'] as Array<
            Database['public']['Enums']['integration_type']
          >,
        }),
      ...(Array.isArray(data['p_focus_areas']) &&
        data['p_focus_areas'].length > 0 && {
          p_focus_areas: data['p_focus_areas'] as Array<
            Database['public']['Enums']['focus_area_type']
          >,
        }),
      ...(typeof data['teamSize'] === 'string' && data['teamSize'] !== ''
        ? { teamSize: data['teamSize'] }
        : {}),
      ...(typeof data['timestamp'] === 'string' && data['timestamp'] !== ''
        ? { timestamp: data['timestamp'] }
        : {}),
    } as DecodedQuizAnswers;
  } catch (error) {
    const normalized = normalizeError(error, 'Invalid quiz answers encoding');
    utilityLogger.error(
      {
        encodedLength: encoded.length,
        err: normalized,
        resultId,
      },
      'ConfigRecommenderResults: decodeQuizAnswers failed'
    );
    throw normalized;
  }
}

/*****
 * Filters and validates recommendation items, returning only those that include `category`, `slug`, and `title`.
 *
 * @param {Database['public']['Functions']['get_recommendations']['Returns']['results']} results - Raw recommendation items returned by the RPC; may be `null` or `undefined`.
 * @param {string} resultId - Identifier included in logs when items are filtered.
 * @param {ReturnType<typeof logger.child>} parentLogger - Optional parent logger used to create an operation-scoped logger for warnings.
 * @returns An array of recommendation items guaranteed to have `category`, `slug`, and `title`.
 *
 * @see getConfigRecommendations
 * @see ResultsDisplay
 */
function normalizeRecommendationResults(
  results: Database['public']['Functions']['get_recommendations']['Returns']['results'],
  resultId: string,
  parentLogger?: ReturnType<typeof logger.child>
): Array<
  Database['public']['CompositeTypes']['recommendation_item'] & {
    category: Database['public']['Enums']['content_category'];
    slug: string;
    title: string;
  }
> {
  // Use parent logger if provided, otherwise create a child logger
  const utilityLogger = parentLogger
    ? parentLogger.child({
        operation: 'normalizeRecommendationResults',
      })
    : logger.child({
        module: 'apps/web/src/app/tools/config-recommender/results/[id]',
        operation: 'normalizeRecommendationResults',
        route: 'utility-function',
      });

  if (!results) return [];
  const normalized = results.filter(
    (
      item
    ): item is typeof item & {
      category: Database['public']['Enums']['content_category'];
      slug: string;
      title: string;
    } => Boolean(item.slug && item.title && item.category)
  );

  if (normalized.length < results.length) {
    utilityLogger.warn(
      {
        filteredCount: normalized.length,
        originalCount: results.length,
        resultId,
      },
      'ConfigRecommenderResults: filtered incomplete recommendation items'
    );
  }

  return normalized;
}

interface PageProperties {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ answers?: string }>;
}

/**
 * Generate metadata for the results page using the route `id`.
 *
 * Builds base metadata via `generatePageMetadata` for the `/tools/config-recommender/results/:id` route and adds robots directives to prevent indexing while allowing link following.
 *
 * @param props - Page properties containing route parameters.
 * @param props.params - An object (possibly a promise) with an `id` route parameter identifying the result.
 * @returns The Next.js Metadata object for the results page, including `robots: { index: false, follow: true }`.
 *
 * @see generatePageMetadata
 */
export async function generateMetadata({ params }: PageProperties): Promise<Metadata> {
  const { id } = await params;
  const baseMetadata = await generatePageMetadata('/tools/config-recommender/results/:id', {
    params: { id },
  });

  return {
    ...baseMetadata,
    robots: {
      follow: true,
      index: false,
    },
  };
}

/**
 * Renders the Configuration Recommender results page for a given result ID.
 *
 * Decodes and validates the base64url-encoded `answers` query parameter, fetches
 * personalized configuration recommendations, normalizes returned items, and
 * renders the results UI with a shareable URL; responds with a 404 if `answers`
 * is missing, invalid, or backend recommendations are absent.
 *
 * @param props.params - Route parameters containing the `id` of the results set
 * @param root0
 * @param root0.params
 * @param props.searchParams - Query parameters; must include `answers` (base64url-encoded JSON)
 * @param root0.searchParams
 * @returns The React element that displays the recommendations and a shareable URL
 *
 * @see decodeQuizAnswers
 * @see getConfigRecommendations
 * @see normalizeRecommendationResults
 * @see ResultsDisplay
 */
export default async function ResultsPage({ params, searchParams }: PageProperties) {
  // Explicitly defer to request time before using non-deterministic operations (Date.now())
  // This is required by Cache Components for non-deterministic operations
  await connection();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    module: 'apps/web/src/app/tools/config-recommender/results/[id]',
    operation: 'ConfigRecommenderResults',
  });

  return (
    <Suspense fallback={<ResultsLoading />}>
      <ResultsPageContent params={params} reqLogger={reqLogger} searchParams={searchParams} />
    </Suspense>
  );
}

/**
 * Renders the configuration recommender results page for a given result ID.
 *
 * Decodes base64url-encoded quiz answers from the `answers` search parameter, fetches and normalizes
 * recommendations based on those answers, and returns the ResultsDisplay UI populated with the
 * recommendations and a shareable URL. If the `answers` parameter is missing, cannot be decoded,
 * or the recommendations RPC returns no results, this function calls `notFound()` (renders a 404).
 *
 * @param params - Promise resolving to route parameters containing `id`
 * @param params.params
 * @param params.reqLogger
 * @param searchParams - Promise resolving to search parameters containing `answers` (base64url-encoded)
 * @param reqLogger - Request-scoped logger; a route-scoped child logger is derived for internal logging
 * @param params.searchParams
 * @returns A JSX element rendering the results page with recommendations and share URL
 *
 * @see decodeQuizAnswers
 * @see getConfigRecommendations
 * @see normalizeRecommendationResults
 * @see ResultsDisplay
 */
async function ResultsPageContent({
  params,
  reqLogger,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  reqLogger: ReturnType<typeof logger.child>;
  searchParams: Promise<{ answers?: string }>;
}) {
  const resolvedParameters = await params;
  const resolvedSearchParameters = await searchParams;
  const route = `/tools/config-recommender/results/${resolvedParameters.id}`;

  // Create route-specific logger
  const routeLogger = reqLogger.child({ route });

  // Section: Answers Validation
  if (!resolvedSearchParameters.answers) {
    routeLogger.warn(
      { section: 'data-fetch' },
      'ConfigRecommenderResults: accessed without answers parameter'
    );
    notFound();
  }

  // Section: Answers Decoding
  let answers: DecodedQuizAnswers;
  try {
    answers = decodeQuizAnswers(
      resolvedSearchParameters.answers,
      resolvedParameters.id,
      routeLogger
    );
    routeLogger.info(
      {
        experienceLevel: answers.experienceLevel,
        section: 'data-fetch',
        useCase: answers.useCase,
      },
      'ConfigRecommenderResults: answers decoded successfully'
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Failed to decode quiz answers');
    routeLogger.error(
      {
        err: normalized,
        operation: 'ConfigRecommenderResults',
        route: `/tools/config-recommender/results/${resolvedParameters.id}`,
        section: 'data-fetch',
      },
      'ConfigRecommenderResults: failed to decode quiz answers'
    );
    notFound();
  }

  // Section: Recommendations Fetch
  const enrichedResult = await getConfigRecommendations({
    experienceLevel: answers.experienceLevel,
    toolPreferences: answers.toolPreferences,
    useCase: answers.useCase,
    ...(answers.p_integrations && { integrations: answers.p_integrations }),
    ...(answers.p_focus_areas && { focusAreas: answers.p_focus_areas }),
  });
  routeLogger.info(
    {
      experienceLevel: answers.experienceLevel,
      resultCount: enrichedResult?.results?.length ?? 0,
      section: 'data-fetch',
      useCase: answers.useCase,
    },
    'ConfigRecommenderResults: recommendations fetched'
  );

  if (!enrichedResult?.results) {
    // logger.error() normalizes errors internally, so pass raw error
    routeLogger.error(
      {
        err: new Error('Recommendations result is null'),
        section: 'data-fetch',
        useCase: answers.useCase,
      },
      'ConfigRecommenderResults: get_recommendations returned no data'
    );
    notFound();
  }

  const recommendations: RecommendationResponse = {
    ...enrichedResult,
    answers,
    generatedAt: new Date().toISOString(),
    id: resolvedParameters.id,
    results: normalizeRecommendationResults(
      enrichedResult.results,
      resolvedParameters.id,
      routeLogger
    ),
  };

  const shareUrl = `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParameters.id}?answers=${resolvedSearchParameters.answers}`;

  routeLogger.info(
    {
      experienceLevel: answers.experienceLevel,
      resultCount: recommendations.results?.length ?? 0,
      section: 'data-fetch',
      useCase: answers.useCase,
    },
    'ConfigRecommenderResults: page viewed'
  );

  return (
    <div className="bg-background min-h-screen">
      <section className="container mx-auto px-4 py-12">
        <ResultsDisplay recommendations={recommendations} shareUrl={shareUrl} />
      </section>
    </div>
  );
}
