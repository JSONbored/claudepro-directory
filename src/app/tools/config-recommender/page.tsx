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
import { InlineEmailCTA } from '@/src/components/shared/inline-email-cta';
import { QuizForm } from '@/src/components/tools/recommender/quiz-form';
import { Badge } from '@/src/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/src/components/ui/card';
import { BarChart, Clock, Sparkles, Target, Zap } from '@/src/lib/icons';
import { generatePageMetadata } from '@/src/lib/seo/metadata-generator';
import { UI_CLASSES } from '@/src/lib/ui-constants';

// Generate metadata from centralized registry
export const metadata: Metadata = await generatePageMetadata('/tools/config-recommender');

// ISR Configuration - Static page, no revalidation needed
export const revalidate = false;

export default function ConfigRecommenderPage() {
  return (
    <div className={`${UI_CLASSES.MIN_H_SCREEN} bg-background`}>
      {/* Hero Section */}
      <section className={`relative py-16 px-4 ${UI_CLASSES.OVERFLOW_HIDDEN}`}>
        <div className={`container ${UI_CLASSES.MX_AUTO} text-center ${UI_CLASSES.MAX_W_4XL}`}>
          {/* Badge */}
          <Badge
            variant="outline"
            className={`mb-6 border-primary/20 ${UI_CLASSES.BG_ACCENT_5} text-primary`}
          >
            <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
            AI-Powered Recommendations
          </Badge>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Find Your Perfect Claude Configuration
          </h1>

          {/* Description */}
          <p
            className={`text-lg md:text-xl ${UI_CLASSES.TEXT_MUTED_FOREGROUND} ${UI_CLASSES.MAX_W_3XL} ${UI_CLASSES.MX_AUTO} mb-8`}
          >
            Answer 7 quick questions and get personalized recommendations from our catalog of 147+
            configurations. Instant results, zero cost, tailored to your needs.
          </p>

          {/* Stats */}
          <div className={`flex flex-wrap ${UI_CLASSES.JUSTIFY_CENTER} gap-3`}>
            <Badge variant="secondary" className="text-sm">
              <Clock className="h-3 w-3 mr-1" aria-hidden="true" />2 minutes
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Target className="h-3 w-3 mr-1" aria-hidden="true" />
              147+ configs analyzed
            </Badge>
            <Badge variant="secondary" className="text-sm">
              <Zap className="h-3 w-3 mr-1" aria-hidden="true" />
              Instant results
            </Badge>
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 pb-16`}>
        <div className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
          <QuizForm />
        </div>
      </section>

      {/* Benefits Section */}
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 pb-16`}>
        <div className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
          <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className={`${UI_CLASSES.FLEX_ITEMS_CENTER_GAP_2} text-lg`}>
                  <span className={`${UI_CLASSES.FLEX} items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold`}>
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
                  <span className={`${UI_CLASSES.FLEX} items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold`}>
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
                  <span className={`${UI_CLASSES.FLEX} items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold`}>
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
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 pb-16`}>
        <div className={`${UI_CLASSES.MAX_W_4XL} ${UI_CLASSES.MX_AUTO}`}>
          <Card className="bg-accent/5 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
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
      <section className={`container ${UI_CLASSES.MX_AUTO} px-4 py-12`}>
        <InlineEmailCTA
          variant="hero"
          context="config-recommender-page"
          headline="Join 1,000+ Claude Power Users"
          description="Get weekly updates on new tools, guides, and community highlights. No spam, unsubscribe anytime."
        />
      </section>
    </div>
  );
}
