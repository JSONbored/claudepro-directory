/**
 * Configuration Recommender Landing Page
 *
 * Interactive quiz that generates personalized Claude configuration recommendations.
 * Uses rule-based algorithm for instant, zero-cost recommendations.
 *
 * Features:
 * - 7-question quiz with progressive disclosure
 * - Real-time validation
 * - Mobile-optimized
 * - Accessible (WCAG 2.1 AA compliant)
 * - SEO-optimized
 *
 * Performance:
 * - Client-side quiz (zero server calls until submit)
 * - <100ms recommendation generation
 * - Serverless-friendly architecture
 */

import { generatePageMetadata } from '@heyclaude/web-runtime/data';
import { BarChart, Clock, Sparkles, Target, Zap } from '@heyclaude/web-runtime/icons';
import {
  generateRequestId,
  logger,
  normalizeError,
} from '@heyclaude/web-runtime/logging/server';
import { UI_CLASSES, UnifiedBadge,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle  } from '@heyclaude/web-runtime/ui';
import type { Metadata } from 'next';
import dynamicImport from 'next/dynamic';

import { QuizForm } from '@/src/components/features/tools/recommender/quiz-form';

const NewsletterCTAVariant = dynamicImport(
  () =>
    import('@/src/components/features/growth/newsletter/newsletter-cta-variants').then((module_) => ({
      default: module_.NewsletterCTAVariant,
    })),
  {
    loading: () => <div className="h-32 animate-pulse rounded-lg bg-muted/20" />,
  }
);

/**
 * Dynamic Rendering Required
 *
 * This page uses dynamic rendering for server-side data fetching and user-specific content.
 *
 * See: https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#dynamic
 */
export const revalidate = 86_400;

// Generate metadata from centralized registry
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/tools/config-recommender');
}

export default function ConfigRecommenderPage() {
  // Generate single requestId for this page request
  const requestId = generateRequestId();

  // Create request-scoped child logger to avoid race conditions
  const reqLogger = logger.child({
    requestId,
    operation: 'ConfigRecommenderPage',
    route: '/tools/config-recommender',
    module: 'app/tools/config-recommender',
  });

  try {
    return (
      <div className={'min-h-screen bg-background'}>
        {/* Hero Section */}
        <section className={'relative overflow-hidden px-4 py-16'}>
          <div className={'container mx-auto max-w-4xl text-center'}>
            {/* Badge */}
            <UnifiedBadge
              variant="base"
              style="outline"
              className={'mb-6 border-primary/20 bg-accent/5 text-primary'}
            >
              <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
              AI-Powered Recommendations
            </UnifiedBadge>

            {/* Title */}
            <h1 className="mb-6 bg-linear-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-4xl text-transparent md:text-5xl lg:text-6xl">
              Find Your Perfect Claude Configuration
            </h1>

            {/* Description */}
            <p className={'mx-auto mb-8 max-w-3xl text-lg text-muted-foreground md:text-xl'}>
              Answer 7 quick questions and get personalized recommendations from our catalog of 147+
              configurations. Instant results, zero cost, tailored to your needs.
            </p>

            {/* Stats */}
            <div className={'flex flex-wrap justify-center gap-3'}>
              <UnifiedBadge variant="base" style="secondary" className="text-sm">
                <Clock className="mr-1 h-3 w-3" aria-hidden="true" />2 minutes
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="secondary" className="text-sm">
                <Target className="mr-1 h-3 w-3" aria-hidden="true" />
                147+ configs analyzed
              </UnifiedBadge>
              <UnifiedBadge variant="base" style="secondary" className="text-sm">
                <Zap className="mr-1 h-3 w-3" aria-hidden="true" />
                Instant results
              </UnifiedBadge>
            </div>
          </div>
        </section>

        {/* Quiz Section */}
        <section className={'container mx-auto px-4 pb-16'}>
          <div className={'mx-auto max-w-4xl'}>
            <QuizForm />
          </div>
        </section>

        {/* Benefits Section */}
        <section className={'container mx-auto px-4 pb-16'}>
          <div className={'mx-auto max-w-4xl'}>
            <h2 className="mb-8 text-center font-bold text-2xl">How It Works</h2>

            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-lg`}>
                    <span
                      className={
                        'flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm'
                      }
                    >
                      1
                    </span>
                    Answer Questions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Tell us about your use case, experience level, and preferences in 7 quick
                    questions.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-lg`}>
                    <span
                      className={
                        'flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm'
                      }
                    >
                      2
                    </span>
                    Instant Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Our algorithm analyzes 147+ configurations and matches them to your specific
                    needs.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-lg`}>
                    <span
                      className={
                        'flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground text-sm'
                      }
                    >
                      3
                    </span>
                    Get Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Receive ranked recommendations with match scores and explanations for each
                    choice.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className={'container mx-auto px-4 pb-16'}>
          <div className={'mx-auto max-w-4xl'}>
            <Card className="border-accent/20 bg-accent/5">
              <CardHeader>
                <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                  <BarChart className="h-5 w-5 text-primary" />
                  What You'll Get
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid gap-3 sm:grid-cols-2">
                  <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <Sparkles
                      className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    />
                    <span className="text-sm">
                      Personalized match scores for each configuration
                    </span>
                  </li>
                  <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <Sparkles
                      className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    />
                    <span className="text-sm">Clear explanations of why each was recommended</span>
                  </li>
                  <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <Sparkles
                      className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    />
                    <span className="text-sm">Ranked results from best to good fit</span>
                  </li>
                  <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <Sparkles
                      className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    />
                    <span className="text-sm">Shareable results to discuss with your team</span>
                  </li>
                  <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <Sparkles
                      className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    />
                    <span className="text-sm">Direct links to setup guides and documentation</span>
                  </li>
                  <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                    <Sparkles
                      className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`}
                    />
                    <span className="text-sm">Filter results by category and use case</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Email CTA - Footer section (matching homepage pattern) */}
        <section className={'container mx-auto px-4 py-12'}>
          <NewsletterCTAVariant source="content_page" variant="hero" />
        </section>
      </div>
    );
  } catch (error) {
    const normalized = normalizeError(error, 'Config Recommender page render failed');
    reqLogger.error('ConfigRecommenderPage: render failed', normalized);
    throw normalized;
  }
}
