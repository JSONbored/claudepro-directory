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
import { APP_CONFIG } from '@/src/lib/constants';
import { logger } from '@/src/lib/logger';
import { getRecommendations } from '@/src/lib/recommender/database-recommender';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';

// Decode base64url quiz answers
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

/**
 * Generate metadata for SEO and social sharing
 * NOINDEX strategy: Result pages are personalized and should not be indexed
 * to avoid thin content issues and infinite URL combinations
 */
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
    // Call PostgreSQL recommendation function (refreshed every 6 hours)
    const dbResults = await getRecommendations({
      useCase: answers.useCase,
      experienceLevel: answers.experienceLevel,
      toolPreferences: answers.toolPreferences,
      integrations: answers.integrations || [],
      focusAreas: answers.focusAreas || [],
      limit: 20,
    });

    // Transform to expected format for ResultsDisplay component
    const recommendations = {
      results: dbResults.map((item, index) => ({
        slug: item.slug,
        title: item.title,
        description: item.description,
        category: item.category,
        matchScore: item.match_score,
        matchPercentage: item.match_percentage,
        rank: index + 1,
        reasons: [{ type: 'use-case-match' as const, message: item.primary_reason }],
        primaryReason: item.primary_reason,
        author: item.author,
        tags: item.tags,
      })),
      totalMatches: dbResults.length,
      answers,
      id: resolvedParams.id,
      generatedAt: new Date().toISOString(),
      algorithm: 'rule-based' as const,
      summary: {
        topCategory: dbResults[0]?.category || 'agents',
        avgMatchScore:
          Math.round(dbResults.reduce((sum, r) => sum + r.match_score, 0) / dbResults.length) || 0,
        diversityScore: Math.round((new Set(dbResults.map((r) => r.category)).size / 8) * 100),
      },
    };

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
