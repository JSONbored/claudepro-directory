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

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { UnifiedBadge } from '@/src/components/domain/unified-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/primitives/card';

const UnifiedNewsletterCapture = dynamic(
  () =>
    import('@/src/components/features/growth/unified-newsletter-capture').then((mod) => ({
      default: mod.UnifiedNewsletterCapture,
    })),
  {
    loading: () => <div className="h-32 animate-pulse bg-muted/20 rounded-lg" />,
  }
);

import { QuizForm } from '@/src/components/tools/recommender/quiz-form';
import { BarChart, Clock, Sparkles, Target, Zap } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Generate metadata from centralized registry
export async function generateMetadata(): Promise<Metadata> {
  return generatePageMetadata('/tools/config-recommender');
}

export default async function ConfigRecommenderPage() {
  return (
    <div className={'min-h-screen bg-background'}>
      {/* Hero Section */}
      <section className={'relative py-16 px-4 overflow-hidden'}>
        <div className={'container mx-auto text-center max-w-4xl'}>
          {/* Badge */}
          <UnifiedBadge
            variant="base"
            style="outline"
            className={'mb-6 border-primary/20 bg-accent/5 text-primary'}
          >
            <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
            AI-Powered Recommendations
          </UnifiedBadge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Find Your Perfect Claude Configuration
          </h1>

          {/* Description */}
          <p className={'text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8'}>
            Answer 7 quick questions and get personalized recommendations from our catalog of 147+
            configurations. Instant results, zero cost, tailored to your needs.
          </p>

          {/* Stats */}
          <div className={'flex flex-wrap justify-center gap-3'}>
            <UnifiedBadge variant="base" style="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />2 minutes
            </UnifiedBadge>
            <UnifiedBadge variant="base" style="secondary" className="text-sm">
              <Target className="h-3 w-3 mr-1" aria-hidden="true" />
              147+ configs analyzed
            </UnifiedBadge>
            <UnifiedBadge variant="base" style="secondary" className="text-sm">
              <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
              Instant results
            </UnifiedBadge>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section className={'container mx-auto px-4 pb-16'}>
        <div className={'max-w-4xl mx-auto'}>
          <QuizForm />
        </div>
      </section>

      {/* Benefits Section */}
      <section className={'container mx-auto px-4 pb-16'}>
        <div className={'max-w-4xl mx-auto'}>
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-lg`}>
                  <span
                    className={
                      'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold'
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
                      'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold'
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
                      'flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold'
                    }
                  >
                    3
                  </span>
                  Get Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Receive ranked recommendations with match scores and explanations for each choice.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={'container mx-auto px-4 pb-16'}>
        <div className={'max-w-4xl mx-auto'}>
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className={UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2}>
                <BarChart className="h-5 w-5 text-primary" />
                What You'll Get
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <Sparkles className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                  <span className="text-sm">Personalized match scores for each configuration</span>
                </li>
                <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <Sparkles className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                  <span className="text-sm">Clear explanations of why each was recommended</span>
                </li>
                <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <Sparkles className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                  <span className="text-sm">Ranked results from best to good fit</span>
                </li>
                <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <Sparkles className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                  <span className="text-sm">Shareable results to discuss with your team</span>
                </li>
                <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <Sparkles className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                  <span className="text-sm">Direct links to setup guides and documentation</span>
                </li>
                <li className={UI_CLASSES.FLEX_ITEMS_START_GAP_2}>
                  <Sparkles className={`h-5 w-5 text-primary ${UI_CLASSES.FLEX_SHRINK_0_MT_0_5}`} />
                  <span className="text-sm">Filter results by category and use case</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Email CTA - Footer section (matching homepage pattern) */}
      <section className={'container mx-auto px-4 py-12'}>
        <UnifiedNewsletterCapture
          source="content_page"
          variant="hero"
          context="config-recommender-page"
        />
      </section>
    </div>
  );
}
