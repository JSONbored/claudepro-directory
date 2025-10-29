/**
 * Configuration Recommender Results Page - Database-First Quiz Recommendations
 * Personalized results from PostgreSQL RPC, shareable via URL-encoded answers.
 */

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ResultsDisplay } from '@/src/components/tools/recommender/results-display';
import { APP_CONFIG } from '@/src/lib/constants';
import { ROUTES } from '@/src/lib/constants/routes';
import { logger } from '@/src/lib/logger';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { createClient } from '@/src/lib/supabase/server';

function decodeQuizAnswers(encoded: string) {
  try {
    const json = Buffer.from(encoded, 'base64url').toString('utf-8');
    return JSON.parse(json);
  } catch {
    throw new Error('Invalid quiz answers encoding');
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
    const supabase = await createClient();

    const { data: dbResult, error } = await supabase.rpc('get_recommendations', {
      p_use_case: answers.useCase,
      p_experience_level: answers.experienceLevel,
      p_tool_preferences: answers.toolPreferences,
      p_integrations: answers.integrations || [],
      p_focus_areas: answers.focusAreas || [],
      p_limit: 20,
    });

    if (error) throw new Error(error.message);

    const enrichedResult = dbResult as {
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
      };
    };

    const recommendations = {
      ...enrichedResult,
      answers,
      id: resolvedParams.id,
      generatedAt: new Date().toISOString(),
    };

    const shareUrl = `${APP_CONFIG.url}/tools/config-recommender/results/${resolvedParams.id}?answers=${resolvedSearchParams.answers}`;

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

    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 p-8">
          <h1 className="text-2xl font-bold">Failed to Generate Recommendations</h1>
          <p className="text-muted-foreground">
            We encountered an error while generating your recommendations. Please try again.
          </p>
          <a
            href={ROUTES.TOOLS_CONFIG_RECOMMENDER}
            className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Start Over
          </a>
        </div>
      </div>
    );
  }
}
